import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { WebhookEvent, MessageEvent, TextMessage, TextMessageContent, UserSource, GroupSource, RoomSource } from '@line/bot-sdk';
import { lineMiddleware, lineClient } from '../adapters/line';
import { parseMentionCommand } from '../services/commandParser';
import { ForbiddenError, NotFoundError, HttpError, ValidationError } from '../errors/httpErrors';
import { logger } from '../utils/logger';
import { chatContextService, type ChatContext } from '../services/chatContextService';
import WarikanService from '../services/warikan.service';
import ScheduleService from '../services/schedule.service';
import PersonalMemoService from '../services/personalMemo.service';
import SharedMemoService from '../services/sharedMemo.service';
import { messageLogService } from '../services/messageLog.service';
import { enqueueGeminiJob } from '../adapters/cloudTasks.adapter';
import { Timestamp } from 'firebase-admin/firestore';
import { LIFF_URLS, BOT_CONFIG } from '../config/constants';
import { z } from 'zod';

// --- Service Instances ---
const warikanService = new WarikanService(logger);
const scheduleService = new ScheduleService(logger);
const personalMemoService = new PersonalMemoService(logger);
const sharedMemoService = new SharedMemoService(logger);
// ---------------------------------

// --- 環境変数 ---
const LIFF_WARIKAN_URL = process.env.LIFF_WARIKAN_URL || '';
const LIFF_SCHEDULE_URL = process.env.LIFF_SCHEDULE_URL || '';
const LIFF_SHAREDMEMO_URL = process.env.LIFF_SHAREDMEMO_URL || '';
const BOT_NAME = process.env.BOT_NAME || 'AI秘書 TASK';
const LINE_BOT_USER_ID_INTERNAL = process.env.LINE_BOT_USER_ID;
// ---------------------------------

const router = express.Router();

// ヘルスチェックエンドポイント
router.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// LINE Webhookエンドポイント
router.post('/webhook', lineMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const events: WebhookEvent[] = req.body.events;
  try {
    for (const event of events) {
      try {
        await handleEvent(event);
      } catch (error) {
        logger.error('🔴 Unhandled error within handleEvent:', { error, event });
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    logger.error('🔴 Fatal error in webhook processing loop:', error);
    next(error);
  }
});

// --- Event Handler ---
async function handleEvent(event: WebhookEvent): Promise<void> {
  // --- 1. 基本チェック & 情報取得 ---
  if (event.type !== 'message' || event.message.type !== 'text' || !event.source?.userId) return;
  const messageEvent = event as MessageEvent;
  const message = messageEvent.message as TextMessage;
  const source = event.source as UserSource | GroupSource | RoomSource;
  const userId = source.userId!;
  const chatId = source.groupId ?? source.roomId ?? userId;
  const chatType = source.type;

  // ★ 会話ログ保存
  try {
    const logData = {
        messageId: message.id, chatId, chatType, userId, type: message.type,
        text: message.text ?? null, lineTimestamp: Timestamp.fromMillis(event.timestamp),
    };
    await messageLogService.saveLog(logData);
  } catch (logError) { logger.error('🔴 Failed to save message log:', logError); }

  // ★ Botへのメンションか確認
  if (!LINE_BOT_USER_ID_INTERNAL) { logger.error('🔴 LINE_BOT_USER_ID is not set.'); return; }
  const isMentionedToBot = message.mention?.mentionees?.some(m => m.userId === LINE_BOT_USER_ID_INTERNAL) ?? false;
  if (!isMentionedToBot) return;

  // ★ メンション除去 & コマンド解析
  let commandText = message.text;
  if (message.mention?.mentionees) {
    message.mention.mentionees.forEach(m => {
      if (m.userId) {
        // メンション部分を正規表現で除去
        commandText = commandText.replace(new RegExp(`@[^\s]+`), '').trim();
      }
    });
  }
  commandText = commandText.trim();
  if (commandText.length === 0) { await replyHelp(messageEvent.replyToken, BOT_NAME); return; }
  const parsedCommand = parseMentionCommand(commandText, logger);
  logger.info(`[Webhook] Parsed command for chat ${chatId}:`, parsedCommand);

  // ★ チャットの状態を取得
  const context: ChatContext = await chatContextService.getContext(chatId, logger);
  let replyMessageText: string | null = null;
  let shouldUpdateContext = false;
  let newContext: Partial<ChatContext> = {};

  // ★ コマンド処理 (エラーハンドリング込み)
  try {
    switch (parsedCommand.type) {
      case 'WARIKAN_START':
        const newProject = await warikanService.createProject(userId, { projectName: parsedCommand.args ?? '新しい割り勘', groupId: chatType !== 'user' ? chatId : undefined });
        newContext = { activeWarikanProjectId: newProject.id, activeSharedMemoId: null, activePersonalMemoId: null, activeScheduleId: null };
        shouldUpdateContext = true;
        replyMessageText = `割り勘プロジェクト「${newProject.projectName}」を開始しました！\n👇メンバー追加や支払い登録はこちら\n${LIFF_WARIKAN_URL}/${newProject.id}`;
        break;
      case 'WARIKAN_PAYMENT_ADD':
        if (!context.activeWarikanProjectId) {
          replyMessageText = '現在進行中の割り勘プロジェクトがありません。\n「@BOT 割り勘」で開始できます。'; break;
        }
        const paymentId = await warikanService.addPaymentFromText(context.activeWarikanProjectId, userId, parsedCommand.args ?? '');
        replyMessageText = `\u{1F4B0} 支払いを登録しました。\n👇割り勘状況はこちら\n${LIFF_WARIKAN_URL}/${context.activeWarikanProjectId}`;
        break;
      case 'SCHEDULE_ADJUSTMENT_START':
        const newSchedule = await scheduleService.createSchedule(userId, { title: parsedCommand.args ?? '新しい日程調整', groupId: chatType !== 'user' ? chatId : undefined });
        newContext = { activeScheduleId: newSchedule.id, activeWarikanProjectId: null, activeSharedMemoId: null, activePersonalMemoId: null };
        shouldUpdateContext = true;
        replyMessageText = `日程調整「${newSchedule.title}」を開始しました！\n👇候補日入力や投票はこちら\n${LIFF_SCHEDULE_URL}/${newSchedule.id}`;
        break;
      case 'MEMO_PERSONAL_ADD':
        if (chatType === 'user') {
            const memoContent = parsedCommand.args ?? commandText;
            const newMemo = await personalMemoService.createMemo(userId, { content: memoContent });
            newContext = { activePersonalMemoId: newMemo.id };
            shouldUpdateContext = true;
            replyMessageText = `個人メモを保存しました📝\n「${memoContent.substring(0, 30)}${memoContent.length > 30 ? '...' : ''}」\n(裏で内容を整理中です...)`;
            await enqueueGeminiJob({ docPath: `personalMemos/${newMemo.id}`, content: memoContent, userId });
        } else if (chatType === 'group' || chatType === 'room') {
            if (context.activeSharedMemoId) {
                await sharedMemoService.triggerMemoProcessing(context.activeSharedMemoId, userId);
                replyMessageText = `共有メモ(ID: ${context.activeSharedMemoId})のまとめ処理を開始しました。\n👇結果はこちらで確認できます\n${LIFF_SHAREDMEMO_URL}/${context.activeSharedMemoId}`;
            } else {
                replyMessageText = 'グループでメモを作成するには「@BOT 共有メモ [タイトル]」と入力してください。';
            }
        } else { replyMessageText = 'このチャットではメモ機能を利用できません。'; }
        break;
      case 'MEMO_SHARED_START':
        if (chatType === 'group' || chatType === 'room') {
            const newSharedMemo = await sharedMemoService.createSharedMemo(userId, { title: parsedCommand.args ?? '共有メモ', groupId: chatId });
            newContext = { activeSharedMemoId: newSharedMemo.id, activePersonalMemoId: null };
            shouldUpdateContext = true;
            replyMessageText = `共有メモ「${newSharedMemo.title}」を作成しました！\n👇こちらで内容を確認・編集できます\n${LIFF_SHAREDMEMO_URL}/${newSharedMemo.id}`;
        } else { replyMessageText = '共有メモはグループチャットまたはルームで作成してください。'; }
        break;
      case 'MEMO_PERSONAL_UPDATE':
         if (chatType === 'user' && context.activePersonalMemoId) {
             replyMessageText = `個人メモ(ID: ${context.activePersonalMemoId})の更新機能は準備中です。\n(メモの内容は LIFF で編集してください。)`;
         } else { replyMessageText = '更新対象のアクティブな個人メモがありません。'; }
         break;
      case 'MEMO_SHARED_UPDATE':
        if ((chatType === 'group' || chatType === 'room') && context.activeSharedMemoId) {
            await sharedMemoService.triggerMemoProcessing(context.activeSharedMemoId, userId);
            replyMessageText = `共有メモ(ID: ${context.activeSharedMemoId})のまとめ/更新処理を開始しました。\n結果はLIFFで確認してください。\n${LIFF_SHAREDMEMO_URL}/${context.activeSharedMemoId}`;
        } else { replyMessageText = '更新/表示対象のアクティブな共有メモがありません。'; }
        break;
      case 'HELP':
        await replyHelp(messageEvent.replyToken, BOT_NAME); return;
      case 'UNKNOWN':
      default:
        if (chatType === 'user') {
             const unknownContent = parsedCommand.rawText;
             const newMemo = await personalMemoService.createMemo(userId, { content: unknownContent });
             newContext = { activePersonalMemoId: newMemo.id };
             shouldUpdateContext = true;
             replyMessageText = `個人メモとして保存しました📝\n「${unknownContent.substring(0, 30)}${unknownContent.length > 30 ? '...' : ''}」\n(裏で内容を整理中です...)`;
             await enqueueGeminiJob({ docPath: `personalMemos/${newMemo.id}`, content: unknownContent, userId });
        } else {
            replyMessageText = `ごめんなさい、「${parsedCommand.rawText}」は分かりませんでした。\n「@${BOT_NAME} ヘルプ」で確認できます。`;
        }
        break;
    }
    if (shouldUpdateContext && newContext) {
        await chatContextService.updateContext(chatId, newContext, chatType, logger);
        logger.info(`[Webhook] Chat context updated for ${chatId}:`, newContext);
    }
    if (replyMessageText) {
        await replyText(messageEvent.replyToken, replyMessageText);
    }
  } catch (error: any) {
    logger.error(`🔴 Error handling command type ${parsedCommand?.type} in chat ${chatId} by user ${userId}:`, error);
    let errorMessage = 'エラーが発生しました。処理できませんでした。\n時間を置いて再試行してください。';
    if (error instanceof ForbiddenError) errorMessage = `ごめんなさい、この操作を行う権限がありません。`;
    else if (error instanceof NotFoundError) errorMessage = `対象のデータが見つかりませんでした。`;
    else if (error instanceof ValidationError || error instanceof z.ZodError) errorMessage = `入力内容が正しくありません。\n${error.message.substring(0, 100)}`;
    else if (error instanceof HttpError) errorMessage = `エラー (${error.status}) が発生しました。`;
    else if (error instanceof Error) errorMessage = `予期せぬエラーが発生しました。`;
    await replyText(messageEvent.replyToken, errorMessage);
  }
}

// --- Helper Functions ---
async function replyText(replyToken: string, text: string): Promise<void> {
  try {
    if (text.length > 5000) {
      text = text.substring(0, 4990) + '... (省略)';
    }
    await lineClient.replyMessage(replyToken, { type: 'text', text });
  } catch (error: any) {
    if (error.originalError?.response?.data?.message?.includes('Invalid reply token')) {
      logger.warn(`Reply token ${replyToken} is already used or expired.`);
    } else {
      logger.error(`🔴 Failed to reply message (token: ${replyToken}):`, error.originalError?.response?.data || error.message);
    }
  }
}

async function replyHelp(replyToken: string, botName: string): Promise<void> {
  const helpText = `【${botName}の使い方例】\n@${botName} に続けてどうぞ！\n・割り勘\n・1000円 ランチ代\n・スケジュール調整\n・メモ 今日のアイデア\n・共有メモ 会議\n・更新 (共有メモ処理)`;
  await replyText(replyToken, helpText);
}

export default router;