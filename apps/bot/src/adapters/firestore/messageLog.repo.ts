import { firestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { MessageLogDoc, messageLogDocSchema } from '@task/types/firestore-types';
import type { AppLogger } from '../../utils/logger';

// ★ 一度に取得するログの最大件数 (パフォーマンス・コスト考慮、要調整)
const MAX_LOGS_PER_PERIOD_FETCH = 1000;

export default class MessageLogRepository {
  private db = firestore();
  private col = this.db.collection('messageLogs') as FirebaseFirestore.CollectionReference<MessageLogDoc>;
  private logger?: AppLogger;

  constructor(logger?: AppLogger) {
    this.logger = logger;
  }

  /**
   * 受信したメッセージログを Firestore に保存する
   */
  async saveLog(logData: Omit<MessageLogDoc, 'createdAt'>, logger?: AppLogger): Promise<string> {
    logger = logger ?? this.logger;
    const now = Timestamp.now();
    const dataToSave: MessageLogDoc = {
      ...logData,
      createdAt: now,
    };

    try {
      const parsedData = messageLogDocSchema.parse(dataToSave);
      const docRef = await this.col.add(parsedData);
      logger?.debug(`[MsgLogRepo] Saved message log ${docRef.id} for chat ${logData.chatId}`);
      return docRef.id;
    } catch (error) {
      logger?.error(`[MsgLogRepo] Failed to save message log for chat ${logData.chatId}:`, error);
      throw new Error(`Failed to save message log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 指定されたチャットの指定期間のメッセージログを取得する
   * Firestoreの制約上、startTime 以降のログを取得し、endTime 以前のものをプログラムでフィルタリングする
   * @param chatId グループID または ユーザーID
   * @param startTime 取得開始日時 (この日時を含む)
   * @param endTime 取得終了日時 (この日時を含む)
   * @returns メッセージログの配列 (lineTimestamp昇順)。取得上限に達した場合、期間内の全てを取得できていない可能性がある。
   */
  async getLogsForPeriod(
    chatId: string,
    startTime: Timestamp,
    endTime: Timestamp,
  ): Promise<MessageLogDoc[]> {
    const logger = console; // 仮のロガー
    logger.debug(`[MsgLogRepo] Getting logs for chat ${chatId} between ${startTime.toDate()} and ${endTime.toDate()}`);

    // Firestore クエリ: chatIdで絞り込み、startTime以降をlineTimestamp昇順で取得
    // 複合インデックス (chatId ASC, lineTimestamp ASC) が必要
    const query = this.col
      .where('chatId', '==', chatId)
      .where('lineTimestamp', '>=', startTime)
      .orderBy('lineTimestamp', 'asc')
      .limit(MAX_LOGS_PER_PERIOD_FETCH);

    try {
      const snapshot = await query.get();
      logger.debug(`[MsgLogRepo] Fetched ${snapshot.docs.length} raw logs (limit: ${MAX_LOGS_PER_PERIOD_FETCH}) for chat ${chatId}`);

      const filteredLogs: MessageLogDoc[] = [];
      snapshot.docs.forEach(doc => {
        try {
          // Zod でデータ形式を検証
          const data = messageLogDocSchema.parse(doc.data());
          // endTime 以前のログのみフィルタリング
          if (data.lineTimestamp.toMillis() <= endTime.toMillis()) {
            filteredLogs.push(data);
          }
        } catch (error) {
          logger.error(`[MsgLogRepo] Skipping log due to validation error: ${doc.id}`, error);
        }
      });

      // 取得上限に達した場合の警告ログ
      if (snapshot.docs.length === MAX_LOGS_PER_PERIOD_FETCH) {
        logger.warn(`[MsgLogRepo] Fetched logs reached the limit (${MAX_LOGS_PER_PERIOD_FETCH}) for chat ${chatId}. There might be more logs in the specified period.`);
      }

      logger.info(`[MsgLogRepo] Returning ${filteredLogs.length} filtered logs for chat ${chatId}`);
      return filteredLogs;
    } catch (error: any) {
      logger.error(`[MsgLogRepo] Failed to get logs for chat ${chatId}:`, error);
      throw new Error(`Failed to retrieve message logs: ${error.message}`);
    }
  }
} 