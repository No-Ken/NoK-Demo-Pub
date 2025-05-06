import { firestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  SharedMemoDoc,
  sharedMemoDocSchema,
  SharedMemoEditorDoc,
  sharedMemoEditorDocSchema,
} from '@task/types/firestore-types';
import { ValidationError } from '../../errors/httpErrors';
import type { AppLogger } from '../../utils/logger';

export default class SharedMemoRepository {
  private db = firestore();
  private col = this.db.collection('sharedMemos') as FirebaseFirestore.CollectionReference<SharedMemoDoc>;
  private logger?: AppLogger;

  constructor(logger?: AppLogger) {
    this.logger = logger;
  }

  private editorCol(id: string) {
    return this.col.doc(id).collection('sharedMemoEditors') as FirebaseFirestore.CollectionReference<SharedMemoEditorDoc>;
  }

  /**
   * 生のメモデータを取得（アーカイブ済み含む）
   */
  private async getRawSharedMemoById(id: string): Promise<(SharedMemoDoc & { id: string }) | null> {
    try {
      const snap = await this.col.doc(id).get();
      if (!snap.exists) return null;

      const data = sharedMemoDocSchema.parse(snap.data());
      return { id: snap.id, ...data };

    } catch (error) {
      this.logger?.error(
        `Firestore data validation failed for sharedMemo ${id} in getRaw:`,
        error
      );
      return null;
    }
  }

  // --- 認可チェック用ヘルパー ---
  async isOwner(id: string, userId: string): Promise<boolean> {
    const memo = await this.getRawSharedMemoById(id);
    return !!memo && memo.createdBy === userId;
  }

  async isEditor(id: string, userId: string): Promise<boolean> {
    const editorSnap = await this.editorCol(id).doc(userId).get();
    return editorSnap.exists;
  }

  async canRead(id: string, userId: string): Promise<boolean> {
    const memo = await this.getRawSharedMemoById(id);
    if (!memo || memo.isArchived) return false;
    return memo.readableUserIds?.includes(userId) ?? false;
  }

  async canEdit(id: string, userId: string): Promise<boolean> {
    const memo = await this.getRawSharedMemoById(id);
    if (!memo || memo.isArchived) return false;
    return memo.readableUserIds?.includes(userId) ?? false;
  }

  // --- CRUD操作 ---
  async createSharedMemo(
    userId: string,
    input: {
      title: string;
      templateType?: 'meeting' | 'outing' | 'free';
      content?: string;
      groupId?: string;
    },
    initialMemberIds: string[]
  ): Promise<SharedMemoDoc & { id: string }> {
    const now = Timestamp.now();
    const uniqueInitialMemberIds = [...new Set([userId, ...initialMemberIds])]; // 作成者は必ず含める

    const data: SharedMemoDoc = {
      title: input.title,
      templateType: input.templateType ?? 'free',
      content: input.content ?? '',
      createdBy: userId,
      groupId: input.groupId ?? null,
      createdAt: now,
      updatedAt: now,
      lastEditorId: userId,
      readableUserIds: uniqueInitialMemberIds,
      isArchived: false,
    };

    try {
      const parsedData = sharedMemoDocSchema.parse(data);
      const ref = this.col.doc();
      const batch = this.db.batch();

      // メインドキュメントの作成
      batch.set(ref, parsedData);

      // 編集者サブコレクションの作成
      const editorData = sharedMemoEditorDocSchema.parse({ addedAt: now });
      uniqueInitialMemberIds.forEach(memberId => {
        batch.set(this.editorCol(ref.id).doc(memberId), editorData);
      });

      await batch.commit();

      this.logger?.info(
        `Created shared memo ${ref.id} with ${uniqueInitialMemberIds.length} initial editors`
      );

      return { id: ref.id, ...parsedData };

    } catch (error) {
      this.logger?.error('Failed to create shared memo:', error);
      throw new ValidationError(`メモの作成に失敗しました: ${error}`);
    }
  }

  async getSharedMemoById(id: string): Promise<(SharedMemoDoc & { id: string }) | null> {
    const memo = await this.getRawSharedMemoById(id);
    if (!memo || memo.isArchived) return null;
    return memo;
  }

  async listSharedMemos(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<{
    data: (SharedMemoDoc & { id: string })[];
    nextCursor: string | null;
  }> {
    try {
      let query = this.col
        .where('readableUserIds', 'array-contains', userId)
        .where('isArchived', '==', false)
        .orderBy('updatedAt', 'desc')
        .limit(limit);

      if (cursor) {
        const cursorSnap = await this.col.doc(cursor).get();
        if (cursorSnap.exists) {
          query = query.startAfter(cursorSnap);
        } else {
          this.logger?.warn(`Cursor ${cursor} not found in listSharedMemos`);
        }
      }

      const snaps = await query.get();
      const data = snaps.docs
        .map(doc => {
          try {
            const parsed = sharedMemoDocSchema.parse(doc.data());
            return { id: doc.id, ...parsed };
          } catch (error) {
            this.logger?.error(
              `Data validation failed for memo ${doc.id} in list:`,
              error
            );
            return null;
          }
        })
        .filter((item): item is SharedMemoDoc & { id: string } => item !== null);

      const nextCursor = snaps.docs.length === limit ? snaps.docs[snaps.docs.length - 1]?.id : null;

      return { data, nextCursor };

    } catch (error) {
      this.logger?.error('Failed to list shared memos:', error);
      throw error;
    }
  }

  async updateSharedMemo(
    id: string,
    input: { title?: string; content?: string },
    lastEditorId: string
  ): Promise<void> {
    try {
      const now = Timestamp.now();
      const updateData: Partial<SharedMemoDoc> & {
        updatedAt: FirebaseFirestore.Timestamp;
        lastEditorId: string;
      } = {
        ...input,
        updatedAt: now,
        lastEditorId,
      };

      const validatedData = sharedMemoDocSchema
        .partial()
        .pick({
          title: true,
          content: true,
          lastEditorId: true,
          updatedAt: true,
        })
        .parse(updateData);

      await this.col.doc(id).update(validatedData);
      this.logger?.info(`Updated shared memo: ${id}`);

    } catch (error) {
      this.logger?.error(`Failed to update memo ${id}:`, error);
      throw new ValidationError(`メモの更新に失敗しました: ${error}`);
    }
  }

  async archiveSharedMemo(id: string): Promise<void> {
    try {
      const now = Timestamp.now();
      const updateData = {
        isArchived: true,
        updatedAt: now,
      };

      const validatedData = sharedMemoDocSchema
        .partial()
        .pick({ isArchived: true, updatedAt: true })
        .parse(updateData);

      await this.col.doc(id).update(validatedData);
      this.logger?.info(`Archived shared memo: ${id}`);

    } catch (error) {
      this.logger?.error(`Failed to archive memo ${id}:`, error);
      throw new ValidationError(`メモのアーカイブに失敗しました: ${error}`);
    }
  }

  // --- 編集者管理 ---
  async addEditor(id: string, editorUserId: string): Promise<void> {
    try {
      const now = Timestamp.now();
      const editorRef = this.editorCol(id).doc(editorUserId);
      const memoRef = this.col.doc(id);

      await this.db.runTransaction(async (tx) => {
        const memoSnap = await tx.get(memoRef);
        if (!memoSnap.exists || memoSnap.data()?.isArchived) {
          throw new Error('Memo not found or archived');
        }

        const editorData = sharedMemoEditorDocSchema.parse({ addedAt: now });
        tx.set(editorRef, editorData);
        tx.update(memoRef, {
          readableUserIds: firestore.FieldValue.arrayUnion(editorUserId),
          updatedAt: now,
        });
      });

      this.logger?.info(`Added editor ${editorUserId} to memo ${id}`);

    } catch (error) {
      this.logger?.error(`Failed to add editor ${editorUserId} to memo ${id}:`, error);
      throw error;
    }
  }

  async removeEditor(id: string, editorUserId: string): Promise<void> {
    try {
      const now = Timestamp.now();
      const editorRef = this.editorCol(id).doc(editorUserId);
      const memoRef = this.col.doc(id);

      await this.db.runTransaction(async (tx) => {
        const memoSnap = await tx.get(memoRef);
        if (!memoSnap.exists || memoSnap.data()?.isArchived) {
          throw new Error('Memo not found or archived');
        }

        tx.delete(editorRef);
        tx.update(memoRef, {
          readableUserIds: firestore.FieldValue.arrayRemove(editorUserId),
          updatedAt: now,
        });
      });

      this.logger?.info(`Removed editor ${editorUserId} from memo ${id}`);

    } catch (error) {
      this.logger?.error(`Failed to remove editor ${editorUserId} from memo ${id}:`, error);
      throw error;
    }
  }
}