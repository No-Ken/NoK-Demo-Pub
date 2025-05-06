import ChatContextRepository from '../adapters/firestore/chatContext.repo';
import type { ChatContextDoc } from '@task/types/firestore-types';
import type { AppLogger } from '../utils/logger';

// Service が外部に提供するコンテキスト情報のインターフェース
export interface ChatContext {
  activeSharedMemoId: string | null;
  activeWarikanProjectId: string | null;
  activeScheduleId: string | null;
  activePersonalMemoId: string | null;
}

// デフォルトのコンテキスト値
const DEFAULT_CONTEXT: ChatContext = {
  activeSharedMemoId: null,
  activeWarikanProjectId: null,
  activeScheduleId: null,
  activePersonalMemoId: null,
};

class ChatContextService {
  private repo: ChatContextRepository;
  private logger?: AppLogger;

  constructor(logger?: AppLogger) {
    this.repo = new ChatContextRepository();
    this.logger = logger;
  }

  /**
   * チャットコンテキストを取得する
   * @param chatId - ユーザーID または グループID
   * @param logger - (任意) ログ出力用
   * @returns ChatContext オブジェクト (見つからない場合はデフォルト値)
   */
  async getContext(chatId: string, logger?: AppLogger): Promise<ChatContext> {
    const doc = await this.repo.get(chatId, logger);
    if (!doc) {
      return { ...DEFAULT_CONTEXT };
    }
    // Firestoreドキュメントから必要な情報だけ抽出
    return {
      activeSharedMemoId: doc.activeSharedMemoId ?? null,
      activeWarikanProjectId: doc.activeWarikanProjectId ?? null,
      activeScheduleId: doc.activeScheduleId ?? null,
      activePersonalMemoId: doc.activePersonalMemoId ?? null,
    };
  }

  /**
   * チャットコンテキストの一部を更新する
   * @param chatId - ユーザーID または グループID
   * @param updates - 更新するフィールドと値 (ChatContextの部分集合)
   * @param chatType - チャットタイプ ('user' | 'group' | 'room')
   * @param logger - (任意) ログ出力用
   */
  async updateContext(
    chatId: string,
    updates: Partial<ChatContext>,
    chatType: 'user' | 'group' | 'room',
    logger?: AppLogger
  ): Promise<void> {
    // Repository の set メソッドが受け付ける形式に変換
    const repoUpdates: Partial<Omit<ChatContextDoc, 'chatId' | 'chatType' | 'updatedAt'>> = {};
    if (updates.activeSharedMemoId !== undefined) repoUpdates.activeSharedMemoId = updates.activeSharedMemoId;
    if (updates.activeWarikanProjectId !== undefined) repoUpdates.activeWarikanProjectId = updates.activeWarikanProjectId;
    if (updates.activeScheduleId !== undefined) repoUpdates.activeScheduleId = updates.activeScheduleId;
    if (updates.activePersonalMemoId !== undefined) repoUpdates.activePersonalMemoId = updates.activePersonalMemoId;

    if (Object.keys(repoUpdates).length > 0) {
      await this.repo.set(chatId, repoUpdates, chatType, logger);
    } else {
      logger?.debug(`[ChatContextService] No context updates provided for ${chatId}. Skipping set.`);
    }
  }

  // --- 特定の状態をクリア/設定するヘルパーメソッド ---

  async setActiveSharedMemo(chatId: string, chatType: 'user' | 'group' | 'room', memoId: string | null, logger?: AppLogger) {
    await this.updateContext(
      chatId,
      {
        activeSharedMemoId: memoId,
        activePersonalMemoId: null,
        activeWarikanProjectId: null,
        activeScheduleId: null,
      },
      chatType,
      logger
    );
  }

  async setActiveWarikan(chatId: string, chatType: 'user' | 'group' | 'room', projectId: string | null, logger?: AppLogger) {
    await this.updateContext(
      chatId,
      {
        activeWarikanProjectId: projectId,
        activeSharedMemoId: null,
        activePersonalMemoId: null,
        activeScheduleId: null,
      },
      chatType,
      logger
    );
  }

  async setActiveSchedule(chatId: string, chatType: 'user' | 'group' | 'room', scheduleId: string | null, logger?: AppLogger) {
    await this.updateContext(
      chatId,
      {
        activeScheduleId: scheduleId,
        activeSharedMemoId: null,
        activePersonalMemoId: null,
        activeWarikanProjectId: null,
      },
      chatType,
      logger
    );
  }

  async setActivePersonalMemo(chatId: string, chatType: 'user' | 'group' | 'room', memoId: string | null, logger?: AppLogger) {
    // 個人チャットでのみ有効のはずなので chatType チェックを追加
    if (chatType !== 'user') {
      console.warn(`[ChatContextService] Attempted to set activePersonalMemoId in non-user chat: ${chatId}`);
      return;
    }
    await this.updateContext(
      chatId,
      {
        activePersonalMemoId: memoId,
        activeSharedMemoId: null,
        activeWarikanProjectId: null,
        activeScheduleId: null,
      },
      chatType,
      logger
    );
  }

  async clearContext(chatId: string, chatType: 'user' | 'group' | 'room', logger?: AppLogger) {
    await this.updateContext(
      chatId,
      {
        activeSharedMemoId: null,
        activePersonalMemoId: null,
        activeWarikanProjectId: null,
        activeScheduleId: null,
      },
      chatType,
      logger
    );
  }
}

// シングルトンインスタンスをエクスポート
export const chatContextService = new ChatContextService(); 