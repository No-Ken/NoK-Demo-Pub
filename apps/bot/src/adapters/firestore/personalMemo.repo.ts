import { firestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  PersonalMemoDoc,
  personalMemoDocSchema,
} from '@task/types/firestore-types';

export default class PersonalMemoRepository {
  private db = firestore();
  private col = this.db.collection('personalMemos') as FirebaseFirestore.CollectionReference<PersonalMemoDoc>;

  async createMemo(userId: string, input: { content: string; tags?: string[] }): Promise<PersonalMemoDoc & { id: string }> {
    const now = Timestamp.now();
    const data: Omit<PersonalMemoDoc, 'aiAnalysis' | 'pageId'> & Partial<Pick<PersonalMemoDoc, 'aiAnalysis' | 'pageId'>> = {
      userId,
      content: input.content,
      tags: input.tags ?? [],
      source: 'liff',
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };
    const parsedData = personalMemoDocSchema.parse(data);
    const ref = await this.col.add(parsedData);
    return { id: ref.id, ...parsedData };
  }

  async getMemoById(id: string): Promise<(PersonalMemoDoc & { id: string }) | null> {
    const snap = await this.col.doc(id).get();
    if (!snap.exists) return null;
    try {
        const data = personalMemoDocSchema.parse(snap.data());
        if (data.isArchived) return null;
        return { id: snap.id, ...data };
    } catch (error) {
        console.error(`Firestore data validation failed for personalMemo ${id}:`, error);
        return null;
    }
  }

  async listMemos(userId: string, limit: number, cursor?: string): Promise<{ data: (PersonalMemoDoc & { id: string })[], nextCursor: string | null }> {
    let query = this.col
      .where('userId', '==', userId)
      .where('isArchived', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (cursor) {
      try {
        const cursorSnap = await this.col.doc(cursor).get();
        if (cursorSnap.exists) {
            query = query.startAfter(cursorSnap);
        } else {
            console.warn(`listPersonalMemos: Cursor document ${cursor} not found.`);
        }
      } catch(error) {
          console.error(`Error fetching cursor document ${cursor} for personal memos:`, error);
      }
    }
    const snaps = await query.get();

    const data = snaps.docs
        .map(doc => {
            try {
                const parsed = personalMemoDocSchema.parse(doc.data());
                return { id: doc.id, ...parsed };
            } catch (error) {
                console.error(`Firestore data validation failed for personalMemo ${doc.id} in list:`, error);
                return null;
            }
        })
        .filter((item): item is PersonalMemoDoc & { id: string } => item !== null);

    const nextCursor = snaps.docs.length === limit ? snaps.docs[snaps.docs.length - 1]?.id : null;
    return { data, nextCursor };
  }

  async updateMemo(id: string, input: { content?: string; tags?: string[] }): Promise<void> {
    const now = Timestamp.now();
    const updateData: Partial<PersonalMemoDoc> & { updatedAt: FirebaseFirestore.Timestamp } = {
        updatedAt: now,
    };
    if (input.content !== undefined) updateData.content = input.content;
    if (input.tags !== undefined) updateData.tags = input.tags;

    try {
        personalMemoDocSchema.partial().pick({ content: true, tags: true, updatedAt: true }).parse(updateData);
    } catch(error) {
        console.error(`Update data validation failed for personalMemo ${id}:`, error);
        throw new Error(`Invalid update data: ${error}`);
    }

    await this.col.doc(id).update(updateData);
    console.log(`Updated personal memo: ${id}`);
  }

  async archiveMemo(id: string): Promise<void> {
    const now = Timestamp.now();
    const updateData = { isArchived: true, updatedAt: now };
    try {
        personalMemoDocSchema.partial().pick({ isArchived: true, updatedAt: true }).parse(updateData);
    } catch(error) {
        console.error(`Archive data validation failed for personalMemo ${id}:`, error);
        throw new Error(`Invalid archive data: ${error}`);
    }
    await this.col.doc(id).update(updateData);
    console.log(`Archived personal memo: ${id}`);
  }
}