import { PostbackEvent } from '@line/bot-sdk';
import { replyToEvent } from '../adapters/line';
import { getFromFirestore, saveToFirestore } from '../adapters/firestore';
import { logger } from '../utils/logger';

/**
 * Handle postback events from LINE
 * @param event The postback event
 */
export async function handlePostback(event: PostbackEvent): Promise<void> {
  // Get user ID from event
  const userId = event.source.userId;
  if (!userId) {
    logger.error('User ID not found in event');
    return;
  }

  try {
    // Parse the postback data
    const data = parsePostbackData(event.postback.data);
    
    // Log the postback for debugging
    logger.debug('Postback received:', data);
    
    // Save postback event to Firestore
    await saveToFirestore('postbacks', {
      userId,
      data,
      timestamp: new Date()
    });

    // Handle different postback types
    switch (data.action) {
      case 'schedule_confirm':
        await handleScheduleConfirm(event, data);
        break;
      case 'schedule_cancel':
        await handleScheduleCancel(event, data);
        break;
      case 'warikan_confirm':
        await handleWarikanConfirm(event, data);
        break;
      case 'warikan_cancel':
        await handleWarikanCancel(event, data);
        break;
      case 'memo_save':
        await handleMemoSave(event, data);
        break;
      case 'memo_delete':
        await handleMemoDelete(event, data);
        break;
      default:
        logger.warn(`Unknown postback action: ${data.action}`);
        await replyToEvent(event.replyToken, [{
          type: 'text',
          text: '不明なアクションです。もう一度お試しください。'
        }]);
    }
  } catch (error) {
    logger.error('Error handling postback:', error);
    await replyToEvent(event.replyToken, [{
      type: 'text',
      text: 'エラーが発生しました。もう一度お試しください。'
    }]);
  }
}

/**
 * Parse postback data string into an object
 * @param data The postback data string
 * @returns Parsed object
 */
function parsePostbackData(data: string): Record<string, any> {
  // Parse URL-encoded or JSON data
  try {
    if (data.startsWith('{')) {
      // JSON format
      return JSON.parse(data);
    } else {
      // URL-encoded format (key=value&key2=value2)
      const result: Record<string, string> = {};
      data.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        result[key] = decodeURIComponent(value);
      });
      return result;
    }
  } catch (error) {
    logger.error('Error parsing postback data:', error);
    return { action: 'unknown', raw: data };
  }
}

/**
 * Handle schedule confirmation postback
 * @param event The postback event
 * @param data The parsed postback data
 */
async function handleScheduleConfirm(event: PostbackEvent, data: Record<string, any>): Promise<void> {
  const scheduleId = data.scheduleId;
  
  // Get schedule from Firestore
  const schedule = await getFromFirestore('schedules', scheduleId);
  if (!schedule) {
    await replyToEvent(event.replyToken, [{
      type: 'text',
      text: '予定が見つかりませんでした。新しく登録してください。'
    }]);
    return;
  }
  
  // Update schedule status
  await saveToFirestore('schedules', {
    ...schedule,
    status: 'confirmed',
    confirmedAt: new Date()
  }, scheduleId);
  
  // Reply with confirmation
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: '予定を確定しました。参加者に通知します。'
  }]);
}

/**
 * Handle schedule cancellation postback
 * @param event The postback event
 * @param data The parsed postback data
 */
async function handleScheduleCancel(event: PostbackEvent, data: Record<string, any>): Promise<void> {
  const scheduleId = data.scheduleId;
  
  // Get schedule from Firestore
  const schedule = await getFromFirestore('schedules', scheduleId);
  if (!schedule) {
    await replyToEvent(event.replyToken, [{
      type: 'text',
      text: '予定が見つかりませんでした。'
    }]);
    return;
  }
  
  // Update schedule status
  await saveToFirestore('schedules', {
    ...schedule,
    status: 'cancelled',
    cancelledAt: new Date()
  }, scheduleId);
  
  // Reply with confirmation
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: '予定をキャンセルしました。'
  }]);
}

/**
 * Handle warikan confirmation postback
 * @param event The postback event
 * @param data The parsed postback data
 */
async function handleWarikanConfirm(event: PostbackEvent, data: Record<string, any>): Promise<void> {
  const warikanId = data.warikanId;
  
  // Get warikan project from Firestore
  const warikan = await getFromFirestore('warikanProjects', warikanId);
  if (!warikan) {
    await replyToEvent(event.replyToken, [{
      type: 'text',
      text: '割り勘情報が見つかりませんでした。新しく登録してください。'
    }]);
    return;
  }
  
  // Update warikan status
  await saveToFirestore('warikanProjects', {
    ...warikan,
    status: 'confirmed',
    confirmedAt: new Date()
  }, warikanId);
  
  // Reply with confirmation
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: '割り勘計算を確定しました。メンバーに共有します。'
  }]);
}

/**
 * Handle warikan cancellation postback
 * @param event The postback event
 * @param data The parsed postback data
 */
async function handleWarikanCancel(event: PostbackEvent, data: Record<string, any>): Promise<void> {
  const warikanId = data.warikanId;
  
  // Update warikan status
  await saveToFirestore('warikanProjects', {
    status: 'cancelled',
    cancelledAt: new Date()
  }, warikanId);
  
  // Reply with confirmation
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: '割り勘計算をキャンセルしました。'
  }]);
}

/**
 * Handle memo save postback
 * @param event The postback event
 * @param data The parsed postback data
 */
async function handleMemoSave(event: PostbackEvent, data: Record<string, any>): Promise<void> {
  const memoId = data.memoId;
  const title = data.title || '無題のメモ';
  
  // Get memo from Firestore
  const memo = await getFromFirestore('memos', memoId);
  if (!memo) {
    await replyToEvent(event.replyToken, [{
      type: 'text',
      text: 'メモが見つかりませんでした。'
    }]);
    return;
  }
  
  // Update memo
  await saveToFirestore('memos', {
    ...memo,
    title,
    saved: true,
    updatedAt: new Date()
  }, memoId);
  
  // Reply with confirmation
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: `「${title}」というタイトルでメモを保存しました。`
  }]);
}

/**
 * Handle memo deletion postback
 * @param event The postback event
 * @param data The parsed postback data
 */
async function handleMemoDelete(event: PostbackEvent, data: Record<string, any>): Promise<void> {
  const memoId = data.memoId;
  
  // Get memo from Firestore
  const memo = await getFromFirestore('memos', memoId);
  if (!memo) {
    await replyToEvent(event.replyToken, [{
      type: 'text',
      text: 'メモが見つかりませんでした。'
    }]);
    return;
  }
  
  // Update memo (soft delete)
  await saveToFirestore('memos', {
    ...memo,
    deleted: true,
    deletedAt: new Date()
  }, memoId);
  
  // Reply with confirmation
  await replyToEvent(event.replyToken, [{
    type: 'text',
    text: 'メモを削除しました。'
  }]);
}
