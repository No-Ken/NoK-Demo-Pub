import { sendMessages } from '../adapters/line';
import { generateGeminiResponse } from '../adapters/gemini';
import { saveToFirestore } from '../adapters/firestore';
import { createRateLimiter } from '../utils/rate-limiter';
import { extractExpenseInfoFromText } from '../utils/expense-utils';
import { v4 as uuidv4 } from 'uuid';

// Initialize rate limiter for Gemini API
const geminiRateLimiter = createRateLimiter({
  tokensPerInterval: 30, // 30 requests per minute
  interval: 60 * 1000, // 1 minute
});

/**
 * Process messages from the warikan (expense splitting) queue
 * @param message The message text to process
 * @param userId The LINE user ID
 * @returns Result of processing
 */
export async function processWarikanQueue(message: string, userId: string): Promise<any> {
  try {
    // Acquire a token from the rate limiter
    await geminiRateLimiter.removeTokens(1);
    
    // Log message processing
    console.info(`Processing warikan for user ${userId}: ${message.substring(0, 50)}...`);
    
    // Generate response using Gemini with warikan context
    const aiResponse = await generateGeminiResponse(message, {
      context: 'warikan',
      userId
    });
    
    // Extract expense information from message
    const { title, totalAmount, participants, items } = await extractExpenseInfoFromText(message);
    
    // Calculate individual shares
    const individualShare = Math.ceil(totalAmount / participants.length);
    
    // Create a new warikan project in Firestore
    const warikanId = uuidv4();
    await saveToFirestore('warikanProjects', {
      id: warikanId,
      userId,
      title: title || (message.length > 20 ? `${message.substring(0, 20)}...` : message),
      description: message,
      totalAmount,
      participants: participants.map(name => ({
        name,
        paid: false,
        amount: individualShare
      })),
      items: items || [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }, warikanId);
    
    // Create messages with warikan details and link to LIFF app
    const messages = [
      {
        type: 'text',
        text: aiResponse
      },
      {
        type: 'template',
        altText: '割り勘計算が作成されました',
        template: {
          type: 'buttons',
          title: '割り勘計算',
          text: `合計: ${totalAmount}円\n1人あたり: ${individualShare}円\n参加者: ${participants.length}名`,
          actions: [
            {
              type: 'uri',
              label: '詳細を確認・編集する',
              uri: `https://liff.line.me/${process.env.LIFF_ID}/warikan/${warikanId}`
            }
          ]
        }
      }
    ];
    
    // Send messages back to user
    await sendMessages(userId, messages);
    
    return {
      success: true,
      warikanId,
      totalAmount,
      individualShare,
      participants,
      messageProcessed: true
    };
  } catch (error) {
    console.error('Error processing warikan message:', error);
    
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
        text: '割り勘計算の処理中にエラーが発生しました。恐れ入りますが、もう一度お試しください。'
      }]
    );
    
    // Re-throw error for logging purposes
    throw error;
  }
}
