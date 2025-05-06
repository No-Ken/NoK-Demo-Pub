import { MessageEvent } from '@line/bot-sdk';
import { replyToEvent } from '../adapters/line';
import { createAIProcessingTask } from '../adapters/cloud-tasks';
import { saveToFirestore } from '../adapters/firestore';
import { logger } from '../utils/logger';

// Command prefixes
const SCHEDULE_PREFIX = '/schedule';
const SPLIT_PREFIX = '/split';
const MEMO_PREFIX = '/memo';
const HELP_PREFIX = '/help';

/**
 * Handle text messages from users
 * @param event The message event
 * @param text The text content of the message
 */
export async function handleTextMessage(event: MessageEvent, text: string): Promise<void> {
  // Get user ID from event
  const userId = event.source.userId;
  if (!userId) {
    logger.error('User ID not found in event');
    return;
  }

  // Save the message to Firestore
  await saveToFirestore('messages', {
    userId,
    text,
    timestamp: new Date(),
    eventType: event.type
  });

  // Handle commands
  if (text.startsWith(SCHEDULE_PREFIX)) {
    await handleScheduleCommand(event, text);
  } else if (text.startsWith(SPLIT_PREFIX)) {
    await handleSplitCommand(event, text);
  } else if (text.startsWith(MEMO_PREFIX)) {
    await handleMemoCommand(event, text);
  } else if (text.startsWith(HELP_PREFIX)) {
    await handleHelpCommand(event);
  } else {
    // Process with AI
    await handleGenericMessage(event, text);
  }
}

/**
 * Handle schedule commands
 * @param event The message event
 * @param text The text content of the message
 */
async function handleScheduleCommand(event: MessageEvent, text: string): Promise<void> {
  // Extract command parameters
  const params = text.substring(SCHEDULE_PREFIX.length).trim();
  
  // Send acknowledgment
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: '日程調整を処理中です。少々お待ちください...'
  }]);
  
  // Queue for AI processing with schedule context
  await createAIProcessingTask(
    params, 
    event.source.userId!
  );
}

/**
 * Handle split (warikan) commands
 * @param event The message event
 * @param text The text content of the message
 */
async function handleSplitCommand(event: MessageEvent, text: string): Promise<void> {
  // Extract command parameters
  const params = text.substring(SPLIT_PREFIX.length).trim();
  
  // Send acknowledgment
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: '割り勘計算を処理中です。少々お待ちください...'
  }]);
  
  // Queue for AI processing with split context
  await createAIProcessingTask(
    params, 
    event.source.userId!
  );
}

/**
 * Handle memo commands
 * @param event The message event
 * @param text The text content of the message
 */
async function handleMemoCommand(event: MessageEvent, text: string): Promise<void> {
  // Extract command parameters
  const params = text.substring(MEMO_PREFIX.length).trim();
  
  // Send acknowledgment
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: 'メモを処理中です。少々お待ちください...'
  }]);
  
  // Queue for AI processing with memo context
  await createAIProcessingTask(
    params, 
    event.source.userId!
  );
}

/**
 * Handle help command
 * @param event The message event
 */
async function handleHelpCommand(event: MessageEvent): Promise<void> {
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: `TASKのヘルプです。以下のコマンドが利用可能です：

/schedule [予定の詳細] - 日程調整を行います
例: /schedule 明日10時から12時までミーティング

/split [支払い情報] - 割り勘計算を行います
例: /split 飲み会：5000円 参加者：田中、佐藤、鈴木

/memo [メモ内容] - メモを保存・検索します
例: /memo 買い物リスト：牛乳、卵、パン

通常のメッセージも送信できます。AIがお手伝いします。`
  }]);
}

/**
 * Handle generic text messages
 * @param event The message event
 * @param text The text content of the message
 */
async function handleGenericMessage(event: MessageEvent, text: string): Promise<void> {
  // Send acknowledgment
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: 'メッセージを処理中です。少々お待ちください...'
  }]);
  
  // Queue for AI processing
  await createAIProcessingTask(
    text, 
    event.source.userId!
  );
}
