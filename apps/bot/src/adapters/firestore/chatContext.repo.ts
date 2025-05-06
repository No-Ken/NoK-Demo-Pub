import { firestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { ChatContextDoc, chatContextDocSchema } from '@task/types/firestore-types';
import type { AppLogger } from '../../utils/logger';

export default class ChatContextRepository {
  private db = firestore();
  private col = this.db.collection('chatContexts') as FirebaseFirestore.CollectionReference<ChatContextDoc>;

  /**
   * 指定されたチャットIDのコンテキストドキュメントを取得する
   * @param chatId - ユーザーID または グループID
   * @param logger - (任意) ログ出力用
   * @returns コンテキストドキュメントデータ。存在しないor不正な場合は null
   */
  async get(chatId: string, logger?: AppLogger): Promise<ChatContextDoc | null> {
    logger?.debug(`[ChatContextRepo] Getting context for ${chatId}`);
    const snap = await this.col.doc(chatId).get();
    if (!snap.exists) {
      logger?.debug(`[ChatContextRepo] Context for ${chatId} not found.`);
      return null;
    }
    try {
      // 読み取り時に Zod でバリデーション
      const data = chatContextDocSchema.parse(snap.data());
      logger?.debug(`[ChatContextRepo] Found context for ${chatId}:`, data);
      return data;
    } catch (error: any) {
      logger?.error(`[ChatContextRepo] Firestore data validation failed for chatContext ${chatId}:`, error);
      console.error(`[ChatContextRepo] Firestore data validation failed for chatContext ${chatId}:`, error);
      return null;
    }
  }

  /**
   * 指定されたチャットIDのコンテキストドキュメントを作成または更新（マージ）する
   * @param chatId - ユーザーID または グループID
   * @param data - 更新または作成するデータ (Partial)
   * @param chatType - チャットタイプ ('user' | 'group' | 'room') - 新規作成/確認用
   * @param logger - (任意) ログ出力用
   */
  async set(
    chatId: string,
    data: Partial<Omit<ChatContextDoc, 'chatId' | 'chatType' | 'updatedAt'>>,
    chatType: 'user' | 'group' | 'room',
    logger?: AppLogger
  ): Promise<void> {
    const updateData: Partial<ChatContextDoc> & { updatedAt: Timestamp; chatId: string; chatType: string } = {
      ...data,
      chatId: chatId,
      chatType: chatType,
      updatedAt: Timestamp.now(),
    };

    try {
      logger?.debug(`[ChatContextRepo] Setting context for ${chatId}:`, updateData);
      await this.col.doc(chatId).set(updateData, { merge: true });
      logger?.info(`[ChatContextRepo] Context for ${chatId} updated.`);
      console.log(`[ChatContextRepo] Context for ${chatId} updated.`);
    } catch (error: any) {
      logger?.error(`[ChatContextRepo] Failed to set context for ${chatId}:`, error);
      console.error(`[ChatContextRepo] Failed to set context for ${chatId}:`, error);
      throw new Error(`Failed to update chat context: ${error.message}`);
    }
  }

  /**
   * 指定されたチャットIDのコンテキストドキュメントを削除する
   * @param chatId - ユーザーID または グループID
   * @param logger - (任意) ログ出力用
   */
  async delete(chatId: string, logger?: AppLogger): Promise<void> {
    logger?.debug(`[ChatContextRepo] Deleting context for ${chatId}`);
    try {
      await this.col.doc(chatId).delete();
      logger?.info(`[ChatContextRepo] Context for ${chatId} deleted.`);
      console.log(`[ChatContextRepo] Context for ${chatId} deleted.`);
    } catch (error: any) {
      logger?.error(`[ChatContextRepo] Failed to delete context for ${chatId}:`, error);
      console.error(`[ChatContextRepo] Failed to delete context for ${chatId}:`, error);
      throw new Error(`Failed to delete chat context: ${error.message}`);
    }
  }

  /**
   * 期限切れのコンテキストを一括削除 (定期的なクリーンアップ用)
   */
  async cleanupExpired(expirationHours: number = 24): Promise<void> {
    try {
      const expireTime = Timestamp.fromMillis(Date.now() - expirationHours * 60 * 60 * 1000);
      const batch = this.db.batch();
      let count = 0;

      const snapshots = await this.col
        .where('updatedAt', '<', expireTime)
        .get();

      snapshots.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });

      if (count > 0) {
        await batch.commit();
        this.logger?.info(`Cleaned up ${count} expired chat contexts`);
      }

    } catch (error) {
      this.logger?.error('Failed to cleanup expired chat contexts:', error);
      throw error;
    }
  }
} 