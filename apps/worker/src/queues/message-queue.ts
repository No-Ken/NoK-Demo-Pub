import { sendTextMessage } from '../adapters/line';
import { generateGeminiResponse } from '../adapters/gemini';
import { saveToFirestore } from '../adapters/firestore';
import { createRateLimiter } from '../utils/rate-limiter';

// Initialize rate limiter for Gemini API
const geminiRateLimiter = createRateLimiter({
  tokensPerInterval: 30, // 30 requests per minute
  interval: 60 * 1000, // 1 minute
});

/**
 * Process messages from the general message queue
 * @param message The message text to process
 * @param userId The LINE user ID
 * @returns Result of processing
 */
export async function processMessageQueue(message: string, userId: string): Promise<any> {
  try {
    // Acquire a token from the rate limiter
    await geminiRateLimiter.removeTokens(1);
    
    // Log message processing
    console.info(`Processing message for user ${userId}: ${message.substring(0, 50)}...`);
    
    // Generate response using Gemini
    const aiResponse = await generateGeminiResponse(message, {
      context: 'general',
      userId
    });
    
    // Save response to Firestore
    const responseId = await saveToFirestore('responses', {
      userId,
      originalMessage: message,
      aiResponse,
      timestamp: new Date(),
      context: 'general'
    });
    
    // Send response back to user
    await sendTextMessage(userId, aiResponse);
    
    return {
      success: true,
      responseId,
      messageProcessed: true
    };
  } catch (error) {
    console.error('Error processing message:', error);
    
    // Handle rate limiting errors gracefully
    if (error.message?.includes('rate limit')) {
      await sendTextMessage(
        userId, 
        '現在、リクエストが多く処理に時間がかかっています。しばらくしてからもう一度お試しください。'
      );
      
      return {
        success: false,
        error: 'Rate limit exceeded',
        messageProcessed: false
      };
    }
    
    // Handle other errors
    await sendTextMessage(
      userId,
      'メッセージの処理中にエラーが発生しました。恐れ入りますが、もう一度お試しください。'
    );
    
    // Re-throw error for logging purposes
    throw error;
  }
}
