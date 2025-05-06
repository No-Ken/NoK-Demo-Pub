import SharedMemoRepository from '../adapters/firestore/sharedMemo.repo';
import LineAdapter from '../adapters/line.adapter'; // LINE Adapter
import { z } from 'zod';
import {
  createSharedMemoSchema,
  updateSharedMemoSchema,
  // editorSchema は Controller のみで使用
} from '../controllers/sharedMemo.controller';
import { ForbiddenError, NotFoundError, InternalServerError } from '../errors/httpErrors'; // カスタムエラー
import type { SharedMemoDoc } from '@task/types/firestore-types';
import type { AppLogger } from '../utils/logger';
import { Timestamp } from 'firebase-admin/firestore';
import { enqueueGeminiJob } from '../adapters/cloudTasks.adapter';
import { messageLogService } from '../services/messageLog.service';
import MessageLogRepository from '../adapters/firestore/messageLog.repo'; // ★ ログリポジトリ追加

// const logger: AppLogger = getLogger();

export default class SharedMemoService {
  private repo = new SharedMemoRepository();
  private lineAdapter = new LineAdapter(); // DI推奨
  private logger?: AppLogger;
  private messageLogRepo = new MessageLogRepository(); // ★ ログリポジトリ

  constructor(logger?: AppLogger) {
    this.logger = logger;
  }

  /**
   * 新しい共有メモを作成する
   * @param userId 作成者のユーザーID
   * @param input 作成データ
   * @returns 作成されたメモデータ
   */
  async createSharedMemo(userId: string, input: z.infer<typeof createSharedMemoSchema>): Promise<SharedMemoDoc & { id: string }> {
    let initialMemberIds: string[] = [userId];

    if (input.groupId) {
      try {
        const groupMemberIds = await this.lineAdapter.getGroupMemberIds(input.groupId /*, logger*/);
        initialMemberIds = [...new Set([userId, ...groupMemberIds])];
      } catch (error) {
        console.error(`Failed to get group members for ${input.groupId}. Creating memo with owner only.`, error);
        // グループメンバー取得失敗時は作成者のみで作成
        initialMemberIds = [userId];
        // 必要であればエラーを上に投げる
        // throw new Error('Could not fetch group members to set initial editors.');
      }
    }
    // Repositoryに初期メンバーリストを渡す
    return this.repo.createSharedMemo(userId, input, initialMemberIds);
  }

  /**
   * 指定されたIDの共有メモを取得する (認可チェック込み)
   * @param id 取得するメモID
   * @param userId リクエストユーザーID
   * @returns メモデータ、または null (存在しない or 権限なし)
   */
  async getSharedMemo(id: string, userId: string): Promise<(SharedMemoDoc & { id: string }) | null> {
    const memo = await this.repo.getSharedMemoById(id); // isArchived チェックは Repo で実施済み
    if (!memo) return null; // 見つからない

    // ★認可チェック: readableUserIds に含まれるか確認
    if (!memo.readableUserIds?.includes(userId)) {
      // 権限がない場合は NotFoundError の方が適切か？ ForbiddenError でも可
      throw new ForbiddenError('You do not have permission to access this shared memo.');
    }
    return memo;
  }

  /**
   * 指定されたユーザーがアクセス可能な共有メモ一覧を取得する
   * @param userId ユーザーID
   * @param limit 取得件数
   * @param cursor ページネーションカーソル
   * @returns メモデータのリストと次のカーソル
   */
  listSharedMemos(userId: string, limit: number, cursor?: string) {
    // 認可は Repository のクエリ ('array-contains') で行われるため、ここではそのまま呼び出す
    return this.repo.listSharedMemos(userId, limit, cursor);
  }

  /**
   * 指定されたIDの共有メモを更新する
   * @param id 更新するメモID
   * @param userId リクエストユーザーID
   * @param input 更新データ (title?, content?)
   */
  async updateSharedMemo(id: string, userId: string, input: z.infer<typeof updateSharedMemoSchema>): Promise<void> {
    // ★認可チェック: readableUserIds (編集権限) を確認
    const memo = await this.repo.getSharedMemoById(id);
    if (!memo) {
        throw new NotFoundError('Shared memo not found.');
    }
    if (!memo.readableUserIds?.includes(userId)) {
        throw new ForbiddenError('You do not have permission to update this shared memo.');
    }
    // lastEditorId を渡して更新
    await this.repo.updateSharedMemo(id, input, userId);
  }

  /**
   * 指定されたIDの共有メモをアーカイブ（論理削除）する
   * @param id アーカイブするメモID
   * @param userId リクエストユーザーID
   */
  async archiveSharedMemo(id: string, userId: string): Promise<void> {
    // ★認可チェック: readableUserIds (編集権限) を確認
    const memo = await this.repo.getSharedMemoById(id);
     if (!memo) {
        throw new NotFoundError('Shared memo not found.');
    }
    if (!memo.readableUserIds?.includes(userId)) {
        throw new ForbiddenError('You do not have permission to archive this shared memo.');
    }
    await this.repo.archiveSharedMemo(id);
  }

  /**
   * 共有メモに編集者を追加する
   * @param id メモID
   * @param userId リクエストユーザーID (操作者)
   * @param editorUserId 追加する編集者のユーザーID
   */
  async addEditor(id: string, userId: string, editorUserId: string): Promise<void> {
    // ★認可チェック: 作成者のみが編集者を追加できる
    const memo = await this.repo.getSharedMemoById(id);
     if (!memo) {
        throw new NotFoundError('Shared memo not found.');
    }
    if (memo.createdBy !== userId) {
      throw new ForbiddenError('Only the owner can add editors.');
    }
    // 自分自身を再度追加しようとした場合などは Repo 側で冪等に処理される想定
    await this.repo.addEditor(id, editorUserId);
  }

  /**
   * 共有メモから編集者を削除する
   * @param id メモID
   * @param userId リクエストユーザーID (操作者)
   * @param editorUserId 削除する編集者のユーザーID
   * @throws {NotFoundError} メモが見つからない場合
   * @throws {ForbiddenError} 操作権限がない、またはオーナー自身を削除しようとした場合
   */
  async removeEditor(id: string, userId: string, editorUserId: string): Promise<void> {
    // 1. メモが存在するか確認 (アーカイブ済み含むか注意、ここでは含まない前提のgetを使用)
    const memo = await this.repo.getSharedMemoById(id);
    if (!memo) {
      // 削除対象のメモ自体が見つからない (or アーカイブ済み)
      throw new NotFoundError('Shared memo not found or has been archived.');
    }

    // 2. 認可チェック: 操作者がオーナーか？
    if (memo.createdBy !== userId) {
      throw new ForbiddenError('Only the owner can remove editors.');
    }

    // 3. オーナー自身を削除しようとしていないかチェック
    if (memo.createdBy === editorUserId) {
      throw new ForbiddenError('Cannot remove the owner themselves from the editors list.');
    }

    // 4. Repository を呼び出して削除実行
    await this.repo.removeEditor(id, editorUserId);
  }

  /**
   * 共有メモの非同期処理 (Gemini要約など) をトリガーする
   * @param memoId 対象の共有メモID
   * @param userId 操作を実行するユーザーID (認可チェック用)
   * @throws {NotFoundError} メモが見つからない場合
   * @throws {ForbiddenError} 操作権限がない場合
   * @throws {InternalServerError} ログ取得やタスクエンキューに失敗した場合
   */
  async triggerMemoProcessing(memoId: string, userId: string): Promise<void> {
    // 1. メモの存在確認と認可チェック (読み取り権限でチェック)
    const memo = await this.repo.getSharedMemoById(memoId);
    if (!memo) {
      throw new NotFoundError(`Shared memo (ID: ${memoId}) not found or archived.`);
    }
    // canRead は readableUserIds を見る想定
    if (!(await this.repo.canRead(memoId, userId))) {
        throw new ForbiddenError(`You do not have permission to process this shared memo.`);
    }
    // グループIDがない場合はログ取得できないのでエラー
    if (!memo.groupId) {
        console.warn(`[SharedMemoService] Memo ${memoId} does not have groupId. Cannot fetch logs.`);
        throw new InternalServerError('Cannot process memo without associated group.');
    }

    // 2. 関連する会話ログを取得
    const startTime = memo.createdAt; // Timestamp
    const endTime = Timestamp.now();
    let logs;
    try {
        logs = await this.messageLogRepo.getLogsForPeriod(memo.groupId, startTime, endTime);
    } catch (error) {
        console.error(`[SharedMemoService] Failed to get message logs for memo ${memoId}:`, error);
        throw new InternalServerError('Failed to retrieve conversation logs for processing.');
    }

    // 3. Gemini に渡すコンテンツを生成
    if (!logs || logs.length === 0) {
        console.log(`[SharedMemoService] No new logs found for memo ${memoId}. Skipping Gemini job.`);
        return;
    }
    const contentToProcess = logs
        .filter(log => log.type === 'text' && log.text)
        .map(log => `${log.userId}: ${log.text}`)
        .join('\n');

    if (contentToProcess.trim().length === 0) {
        console.log(`[SharedMemoService] No processable text content found for memo ${memoId}.`);
        return;
    }

    // 4. Gemini 処理タスクをエンキュー
    try {
        await enqueueGeminiJob({
            docPath: `sharedMemos/${memoId}`,
            content: contentToProcess,
            userId: userId,
        });
    } catch (error) {
        console.error(`[SharedMemoService] Failed to enqueue Gemini job for memo ${memoId}:`, error);
        throw new InternalServerError('Failed to enqueue memo processing task.');
    }
    // 5. (任意) メモのステータスを更新しても良い
    // await this.repo.updateSharedMemo(memoId, { status: 'processing' }, userId);
  }
}