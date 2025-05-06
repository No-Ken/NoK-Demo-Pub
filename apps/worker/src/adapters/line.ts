import { Client, ClientConfig, Message, TextMessage } from '@line/bot-sdk';

export const lineConfig: ClientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
};

// Initialize LINE client
export const lineClient = new Client(lineConfig);

/**
 * Send a text message to a user
 * @param userId The LINE user ID to send the message to
 * @param text The text content to send
 */
export async function sendTextMessage(userId: string, text: string): Promise<void> {
  const message: TextMessage = {
    type: 'text',
    text: text
  };
  
  await lineClient.pushMessage(userId, message);
}

/**
 * Send multiple messages to a user
 * @param userId The LINE user ID to send the messages to
 * @param messages Array of messages to send
 */
export async function sendMessages(userId: string, messages: Message[]): Promise<void> {
  await lineClient.pushMessage(userId, messages);
}

/**
 * Reply to a specific event
 * @param replyToken The reply token from the event
 * @param messages Array of messages to send
 */
export async function replyToEvent(replyToken: string, messages: Message[]): Promise<void> {
  await lineClient.replyMessage(replyToken, messages);
}

/**
 * Get user profile from LINE
 * @param userId The LINE user ID
 * @returns User profile information
 */
export async function getUserProfile(userId: string): Promise<{
  displayName: string;
  userId: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
}> {
  try {
    return await lineClient.getProfile(userId);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      displayName: 'Unknown User',
      userId
    };
  }
}

/**
 * Create a rich menu for a user
 * @param userId The LINE user ID
 * @param richMenuId The rich menu ID to link
 */
export async function linkRichMenuToUser(userId: string, richMenuId: string): Promise<void> {
  try {
    await lineClient.linkRichMenuToUser(userId, richMenuId);
  } catch (error) {
    console.error('Error linking rich menu to user:', error);
  }
}

/**
 * Create and send a button template message
 * @param userId The LINE user ID
 * @param title The title of the button template
 * @param text The text content
 * @param actions The button actions
 */
export async function sendButtonTemplate(
  userId: string,
  title: string,
  text: string,
  actions: Array<{
    type: string;
    label: string;
    data?: string;
    uri?: string;
  }>
): Promise<void> {
  const message = {
    type: 'template',
    altText: title,
    template: {
      type: 'buttons',
      title: title.length > 40 ? `${title.substring(0, 37)}...` : title,
      text: text.length > 160 ? `${text.substring(0, 157)}...` : text,
      actions
    }
  };
  
  await lineClient.pushMessage(userId, message);
}

/**
 * Create and send a carousel template message
 * @param userId The LINE user ID
 * @param altText The alternative text
 * @param columns The carousel columns
 */
export async function sendCarouselTemplate(
  userId: string,
  altText: string,
  columns: Array<{
    title?: string;
    text: string;
    thumbnailImageUrl?: string;
    actions: Array<{
      type: string;
      label: string;
      data?: string;
      uri?: string;
    }>;
  }>
): Promise<void> {
  const message = {
    type: 'template',
    altText,
    template: {
      type: 'carousel',
      columns: columns.map(column => ({
        thumbnailImageUrl: column.thumbnailImageUrl,
        title: column.title && column.title.length > 40 
          ? `${column.title.substring(0, 37)}...` 
          : column.title,
        text: column.text.length > 120 
          ? `${column.text.substring(0, 117)}...` 
          : column.text,
        actions: column.actions
      }))
    }
  };
  
  await lineClient.pushMessage(userId, message);
}
