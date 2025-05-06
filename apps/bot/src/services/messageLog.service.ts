import { Timestamp } from 'firebase-admin/firestore';
import MessageLogRepository from '../adapters/firestore/messageLog.repo';
import type { MessageLogDoc } from '@task/types/firestore-types';
import type { AppLogger } from '../utils/logger';

export default class MessageLogService {
  private repo: MessageLogRepository;
  private logger?: AppLogger;

  constructor(logger?: AppLogger) {
    this.logger = logger;
    this.repo = new MessageLogRepository(logger);
  }

  /**
   * メッセージログを保存する
   */
  async saveLog(logData: Omit<MessageLogDoc, 'createdAt'>, logger?: AppLogger): Promise<void> {
    logger = logger ?? this.logger;
    try {
      await this.repo.saveLog(logData, logger);
    } catch (error) {
      logger?.error("[MsgLogService] Error saving message log:", error);
      // ログ保存失敗はメインフローを止めない
    }
  }

  /**
   * 指定期間のメッセージログを取得する
   */
  async getLogs(chatId: string, startTime: Timestamp, endTime: Timestamp): Promise<MessageLogDoc[]> {
    return this.repo.getLogsForPeriod(chatId, startTime, endTime);
  }
}

// シングルトンインスタンス
export const messageLogService = new MessageLogService(); 