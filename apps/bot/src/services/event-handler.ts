import { WebhookEvent, MessageEvent, TextMessage } from '@line/bot-sdk';
import { replyToEvent } from '../adapters/line';
import { handleTextMessage } from './message-handler';
import { handlePostback } from './postback-handler';
import { saveToFirestore } from '../adapters/firestore';
import { logger } from '../utils/logger';

/**
 * Main event handler for LINE webhook events
 * @param event The webhook event from LINE
 */
export async function handleEvent(event: WebhookEvent): Promise<void> {
  try {
    // Log the event for debugging
    logger.debug('Received event:', event);
    
    // Store event in Firestore for analytics
    await saveToFirestore('events', {
      type: event.type,
      timestamp: new Date(),
      source: event.source,
      // Don't store sensitive data
      event: event.type === 'message' ? { type: event.type } : event
    });

    // Handle different event types
    switch (event.type) {
      case 'message':
        await handleMessageEvent(event);
        break;
      case 'postback':
        await handlePostback(event);
        break;
      case 'follow':
        await handleFollowEvent(event);
        break;
      case 'unfollow':
        await handleUnfollowEvent(event);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    logger.error('Error handling event:', error);
    
    // If we have a reply token, send an error message
    if ('replyToken' in event) {
      await replyToEvent(event.replyToken, [{
        type: 'text',
        text: 'すみません、エラーが発生しました。しばらくしてからもう一度お試しください。'
      }]);
    }
  }
}

/**
 * Handle message events (text, image, etc.)
 * @param event The message event
 */
async function handleMessageEvent(event: MessageEvent): Promise<void> {
  // Handle different message types
  switch (event.message.type) {
    case 'text':
      await handleTextMessage(event, (event.message as TextMessage).text);
      break;
    case 'image':
      // Handle image message
      await replyToEvent(event.replyToken, [{
        type: 'text',
        text: '画像を受け取りました。現在、画像の処理はサポートしていません。'
      }]);
      break;
    default:
      // Handle unsupported message types
      await replyToEvent(event.replyToken, [{
        type: 'text',
        text: 'このタイプのメッセージはサポートしていません。テキストメッセージを送信してください。'
      }]);
  }
}

/**
 * Handle follow events (when a user adds the bot as a friend)
 * @param event The follow event
 */
async function handleFollowEvent(event: WebhookEvent): Promise<void> {
  if (event.type !== 'follow') return;
  
  const userId = event.source.userId;
  if (!userId) return;
  
  // Save user to Firestore
  await saveToFirestore('users', {
    userId,
    followedAt: new Date(),
    active: true
  }, userId);
  
  // Send welcome message
  if ('replyToken' in event) {
    await replyToEvent(event.replyToken, [{
      type: 'text',
      text: 'TASKをフォローいただきありがとうございます！\n\n日程調整、割り勘計算、メモの管理をお手伝いします。何かお手伝いできることがあればお気軽にメッセージをお送りください。'
    }]);
  }
}

/**
 * Handle unfollow events (when a user blocks the bot)
 * @param event The unfollow event
 */
async function handleUnfollowEvent(event: WebhookEvent): Promise<void> {
  if (event.type !== 'unfollow') return;
  
  const userId = event.source.userId;
  if (!userId) return;
  
  // Update user record in Firestore
  await saveToFirestore('users', {
    userId,
    unfollowedAt: new Date(),
    active: false
  }, userId);
  
  logger.info(`User ${userId} unfollowed the bot`);
}
