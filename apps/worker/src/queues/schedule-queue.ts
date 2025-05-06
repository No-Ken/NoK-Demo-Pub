import { sendMessages } from '../adapters/line';
import { generateGeminiResponse } from '../adapters/gemini';
import { saveToFirestore } from '../adapters/firestore';
import { createRateLimiter } from '../utils/rate-limiter';
import { extractDatesFromText, formatDateOptions } from '../utils/date-utils';
import { v4 as uuidv4 } from 'uuid';

// Initialize rate limiter for Gemini API
const geminiRateLimiter = createRateLimiter({
  tokensPerInterval: 30, // 30 requests per minute
  interval: 60 * 1000, // 1 minute
});

/**
 * Process messages from the schedule queue
 * @param message The message text to process
 * @param userId The LINE user ID
 * @returns Result of processing
 */
export async function processScheduleQueue(message: string, userId: string): Promise<any> {
  try {
    // Acquire a token from the rate limiter
    await geminiRateLimiter.removeTokens(1);
    
    // Log message processing
    console.info(`Processing schedule for user ${userId}: ${message.substring(0, 50)}...`);
    
    // Generate response using Gemini with scheduling context
    const aiResponse = await generateGeminiResponse(message, {
      context: 'schedule',
      userId
    });
    
    // Extract dates and times from message
    const dateOptions = extractDatesFromText(message);
    
    // Create a new schedule in Firestore
    const scheduleId = uuidv4();
    await saveToFirestore('schedules', {
      id: scheduleId,
      userId,
      title: message.length > 20 ? `${message.substring(0, 20)}...` : message,
      description: message,
      dateOptions,
      status: 'pending',
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }, scheduleId);
    
    // Format date options for display
    const formattedDateOptions = formatDateOptions(dateOptions);
    
    // Create a carousel of date options with postback actions
    const messages = [
      {
        type: 'text',
        text: aiResponse
      },
      {
        type: 'template',
        altText: '日程調整の候補日が作成されました',
        template: {
          type: 'buttons',
          title: '日程調整',
          text: `${dateOptions.length}件の候補日があります`,
          actions: [
            {
              type: 'uri',
              label: '候補日を確認・投票する',
              uri: `https://liff.line.me/${process.env.LIFF_ID}/schedule/${scheduleId}`
            }
          ]
        }
      }
    ];
    
    // Send messages back to user
    await sendMessages(userId, messages);
    
    return {
      success: true,
      scheduleId,
      dateOptions,
      messageProcessed: true
    };
  } catch (error) {
    console.error('Error processing schedule message:', error);
    
    // Handle rate limiting errors gracefully
    if (error.message?.includes('rate limit')) {
      await sendMessages(
        userId,
        [{
          type: 'text',
          text: '現在、リクエストが多く処理に時間がかかっています。しばらくしてからもう一度お試しください。'
        }]
      );
      
      return {
        success: false,
        error: 'Rate limit exceeded',
        messageProcessed: false
      };
    }
    
    // Handle other errors
    await sendMessages(
      userId,
      [{
        type: 'text',
        text: '日程調整の処理中にエラーが発生しました。恐れ入りますが、もう一度お試しください。'
      }]
    );
    
    // Re-throw error for logging purposes
    throw error;
  }
}
