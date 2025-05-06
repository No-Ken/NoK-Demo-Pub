import { sendMessages } from '../adapters/line';
import { generateGeminiResponse } from '../adapters/gemini';
import { saveToFirestore, getFromFirestore, queryFirestore } from '../adapters/firestore';
import { createRateLimiter } from '../utils/rate-limiter';
import { v4 as uuidv4 } from 'uuid';

// Initialize rate limiter for Gemini API
const geminiRateLimiter = createRateLimiter({
  tokensPerInterval: 30, // 30 requests per minute
  interval: 60 * 1000, // 1 minute
});

// Command constants
const SAVE_COMMAND = 'save';
const SEARCH_COMMAND = 'search';
const LIST_COMMAND = 'list';
const DELETE_COMMAND = 'delete';

/**
 * Process messages from the memo queue
 * @param message The message text to process
 * @param userId The LINE user ID
 * @returns Result of processing
 */
export async function processMemoQueue(message: string, userId: string): Promise<any> {
  try {
    // Acquire a token from the rate limiter
    await geminiRateLimiter.removeTokens(1);
    
    // Log message processing
    console.info(`Processing memo for user ${userId}: ${message.substring(0, 50)}...`);
    
    // Check for specific commands
    const firstWord = message.trim().split(' ')[0].toLowerCase();
    
    if (firstWord === SAVE_COMMAND) {
      return await processMemeSave(message.substring(SAVE_COMMAND.length).trim(), userId);
    } else if (firstWord === SEARCH_COMMAND) {
      return await processMemoSearch(message.substring(SEARCH_COMMAND.length).trim(), userId);
    } else if (firstWord === LIST_COMMAND) {
      return await processMemoList(userId);
    } else if (firstWord === DELETE_COMMAND) {
      return await processMemoDelete(message.substring(DELETE_COMMAND.length).trim(), userId);
    }
    
    // Default behavior: generate AI response and save as new memo
    return await processNewMemo(message, userId);
  } catch (error) {
    console.error('Error processing memo message:', error);
    
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
        text: 'メモの処理中にエラーが発生しました。恐れ入りますが、もう一度お試しください。'
      }]
    );
    
    // Re-throw error for logging purposes
    throw error;
  }
}

/**
 * Process a new memo
 * @param message The message text
 * @param userId The LINE user ID
 * @returns Result of processing
 */
async function processNewMemo(message: string, userId: string): Promise<any> {
  // Generate response using Gemini with memo context
  const aiResponse = await generateGeminiResponse(message, {
    context: 'memo',
    userId
  });
  
  // Generate a title for the memo using Gemini
  const titlePrompt = `以下のテキストに適切なタイトル（20文字以内）をつけてください。余計な説明は不要です。タイトルだけを返してください。:\n${message}`;
  const title = await generateGeminiResponse(titlePrompt, {
    context: 'title',
    userId
  });
  
  // Create a new memo in Firestore
  const memoId = uuidv4();
  await saveToFirestore('memos', {
    id: memoId,
    userId,
    title: title.length > 20 ? title.substring(0, 20) : title,
    content: message,
    aiSuggestion: aiResponse,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false
  }, memoId);
  
  // Create messages with memo details and link to LIFF app
  const messages = [
    {
      type: 'text',
      text: `メモを保存しました。タイトル：「${title}」\n\n${aiResponse}`
    },
    {
      type: 'template',
      altText: 'メモが作成されました',
      template: {
        type: 'buttons',
        title: 'メモ操作',
        text: 'メモを表示または編集しますか？',
        actions: [
          {
            type: 'uri',
            label: 'メモを表示・編集する',
            uri: `https://liff.line.me/${process.env.LIFF_ID}/memo/${memoId}`
          }
        ]
      }
    }
  ];
  
  // Send messages back to user
  await sendMessages(userId, messages);
  
  return {
    success: true,
    memoId,
    title,
    messageProcessed: true
  };
}

/**
 * Process a memo save command
 * @param message The message text
 * @param userId The LINE user ID
 * @returns Result of processing
 */
async function processMemeSave(message: string, userId: string): Promise<any> {
  // Same as processNewMemo but with explicit save command
  return await processNewMemo(message, userId);
}

/**
 * Process a memo search command
 * @param query The search query
 * @param userId The LINE user ID
 * @returns Result of processing
 */
async function processMemoSearch(query: string, userId: string): Promise<any> {
  // Search for memos matching the query
  const memos = await queryFirestore(
    'memos',
    'content',
    'array-contains',
    query.split(' ')
  );
  
  if (memos.length === 0) {
    await sendMessages(
      userId,
      [{
        type: 'text',
        text: `「${query}」に一致するメモは見つかりませんでした。`
      }]
    );
    
    return {
      success: true,
      results: [],
      messageProcessed: true
    };
  }
  
  // Create messages with search results
  const resultText = memos
    .map((memo, index) => `${index + 1}. ${memo.title}`)
    .join('\n');
  
  const messages = [
    {
      type: 'text',
      text: `「${query}」の検索結果（${memos.length}件）:\n${resultText}`
    },
    {
      type: 'template',
      altText: 'メモ検索結果',
      template: {
        type: 'buttons',
        title: 'メモ検索結果',
        text: '全てのメモを表示しますか？',
        actions: [
          {
            type: 'uri',
            label: '全てのメモを表示',
            uri: `https://liff.line.me/${process.env.LIFF_ID}/memos`
          }
        ]
      }
    }
  ];
  
  // Send messages back to user
  await sendMessages(userId, messages);
  
  return {
    success: true,
    results: memos.map(memo => ({ id: memo.id, title: memo.title })),
    messageProcessed: true
  };
}

/**
 * Process a memo list command
 * @param userId The LINE user ID
 * @returns Result of processing
 */
async function processMemoList(userId: string): Promise<any> {
  // Get all active memos for the user
  const memos = await queryFirestore(
    'memos',
    'userId',
    '==',
    userId
  );
  
  const activeMemos = memos.filter(memo => !memo.deleted);
  
  if (activeMemos.length === 0) {
    await sendMessages(
      userId,
      [{
        type: 'text',
        text: 'メモがありません。新しいメモを作成してください。'
      }]
    );
    
    return {
      success: true,
      results: [],
      messageProcessed: true
    };
  }
  
  // Create messages with memo list
  const resultText = activeMemos
    .map((memo, index) => `${index + 1}. ${memo.title}`)
    .join('\n');
  
  const messages = [
    {
      type: 'text',
      text: `あなたのメモ一覧（${activeMemos.length}件）:\n${resultText}`
    },
    {
      type: 'template',
      altText: 'メモ一覧',
      template: {
        type: 'buttons',
        title: 'メモ一覧',
        text: '全てのメモを表示しますか？',
        actions: [
          {
            type: 'uri',
            label: '全てのメモを表示',
            uri: `https://liff.line.me/${process.env.LIFF_ID}/memos`
          }
        ]
      }
    }
  ];
  
  // Send messages back to user
  await sendMessages(userId, messages);
  
  return {
    success: true,
    results: activeMemos.map(memo => ({ id: memo.id, title: memo.title })),
    messageProcessed: true
  };
}

/**
 * Process a memo delete command
 * @param memoTitle The title of the memo to delete
 * @param userId The LINE user ID
 * @returns Result of processing
 */
async function processMemoDelete(memoTitle: string, userId: string): Promise<any> {
  // Find memo by title
  const memos = await queryFirestore(
    'memos',
    'title',
    '==',
    memoTitle
  );
  
  const userMemos = memos.filter(memo => memo.userId === userId && !memo.deleted);
  
  if (userMemos.length === 0) {
    await sendMessages(
      userId,
      [{
        type: 'text',
        text: `「${memoTitle}」というタイトルのメモは見つかりませんでした。`
      }]
    );
    
    return {
      success: false,
      error: 'Memo not found',
      messageProcessed: true
    };
  }
  
  // Soft delete the memo
  const memo = userMemos[0];
  await saveToFirestore('memos', {
    ...memo,
    deleted: true,
    deletedAt: new Date()
  }, memo.id);
  
  // Send confirmation message
  await sendMessages(
    userId,
    [{
      type: 'text',
      text: `「${memo.title}」を削除しました。`
    }]
  );
  
  return {
    success: true,
    memoId: memo.id,
    title: memo.title,
    messageProcessed: true
  };
}
