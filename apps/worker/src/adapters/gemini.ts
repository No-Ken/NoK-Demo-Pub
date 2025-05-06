import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { getFromFirestore, saveToFirestore, queryFirestore } from './firestore';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Default generation config
const defaultGenerationConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 1024,
};

// Context-specific generation configs
const contextConfigs: Record<string, GenerationConfig> = {
  schedule: {
    temperature: 0.3, // More deterministic for date extraction
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 768,
  },
  warikan: {
    temperature: 0.2, // More deterministic for calculations
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 768,
  },
  memo: {
    temperature: 0.8, // More creative for suggestions
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024,
  },
  title: {
    temperature: 0.4, // Balanced for title generation
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 64, // Short output for titles
  },
};

// Context-specific system prompts
const contextPrompts: Record<string, string> = {
  general: `あなたはLINEで会話するAI秘書「TASK」です。ユーザーの質問や依頼に丁寧かつ簡潔に応答してください。
日本語のみで会話します。返答は最大300文字程度に抑えてください。
適切な場合は「/schedule」「/split」「/memo」コマンドの使い方を提案することができます。`,

  schedule: `あなたはLINEで会話するAI秘書「TASK」の日程調整機能です。ユーザーのメッセージから日程調整に関する情報を抽出し、適切な候補日を提案してください。
抽出すべき情報：イベントタイトル、開催日時（候補含む）、開催場所、参加者、所要時間など。
日本語のみで会話します。返答は最大200文字程度に抑えてください。
ユーザーのメッセージを分析し、日程調整の候補日をできるだけ具体的に抽出してください。`,

  warikan: `あなたはLINEで会話するAI秘書「TASK」の割り勘計算機能です。ユーザーのメッセージから支払いに関する情報を抽出し、割り勘計算を行ってください。
抽出すべき情報：イベント名、合計金額、参加者名、個別の支払い項目（あれば）。
日本語のみで会話します。返答は最大200文字程度に抑えてください。
計算結果は明確かつ簡潔に表示してください。`,

  memo: `あなたはLINEで会話するAI秘書「TASK」のメモ機能です。ユーザーのメッセージを分析し、重要なポイントをまとめたり、構造化したりする提案をしてください。
日本語のみで会話します。返答は最大200文字程度に抑えてください。
メモの内容に関連する追加情報や整理のアドバイスを提供してください。`,

  title: `以下のテキストに適切なタイトル（20文字以内）をつけてください。余計な説明は不要です。タイトルだけを返してください。`,
};

/**
 * Generate a response using Gemini API
 * @param message The user message to process
 * @param options Options including context and user ID
 * @returns Generated AI response text
 */
export async function generateGeminiResponse(
  message: string, 
  options: {
    context?: keyof typeof contextPrompts;
    userId: string;
  }
): Promise<string> {
  try {
    const { context = 'general', userId } = options;
    
    // Get user history for context (last 5 interactions)
    const userHistory = await getUserHistory(userId, 5);
    
    // Select the appropriate generation config based on context
    const generationConfig = contextConfigs[context] || defaultGenerationConfig;
    
    // Initialize the model with the selected config
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-lite',
      generationConfig,
    });
    
    // Build the chat history
    const chat = model.startChat({
      history: userHistory,
      systemInstruction: contextPrompts[context],
    });
    
    // Generate response
    const result = await chat.sendMessage(message);
    const response = result.response.text();
    
    // Save interaction to history
    await saveToFirestore('ai_interactions', {
      userId,
      message,
      response,
      context,
      timestamp: new Date(),
    });
    
    return response;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    
    // Return fallback response based on context type
    const fallbackResponses: Record<string, string> = {
      general: 'すみません、メッセージの処理中にエラーが発生しました。もう一度お試しください。',
      schedule: '日程調整の処理中にエラーが発生しました。予定の詳細を記述し、もう一度お試しください。',
      warikan: '割り勘計算の処理中にエラーが発生しました。金額と参加者を明記し、もう一度お試しください。',
      memo: 'メモの処理中にエラーが発生しました。もう一度お試しください。',
      title: '無題のメモ',
    };
    
    return fallbackResponses[options.context || 'general'];
  }
}

/**
 * Get user conversation history for context
 * @param userId The LINE user ID
 * @param limit Maximum number of history items to retrieve
 * @returns Formatted chat history for Gemini
 */
async function getUserHistory(
  userId: string, 
  limit: number = 5
): Promise<{ role: string; parts: string }[]> {
  try {
    // Query recent interactions for this user
    const interactions = await queryRecentInteractions(userId, limit);
    
    if (!interactions || interactions.length === 0) {
      return [];
    }
    
    // Format interactions for Gemini chat history
    return interactions.flatMap(interaction => [
      { role: 'user', parts: interaction.message },
      { role: 'model', parts: interaction.response },
    ]);
  } catch (error) {
    console.error('Error retrieving user history:', error);
    return [];
  }
}

/**
 * Query recent AI interactions for a user
 * @param userId The LINE user ID
 * @param limit Maximum number of interactions to retrieve
 * @returns Array of interactions
 */
async function queryRecentInteractions(
  userId: string,
  limit: number = 5
): Promise<Array<{ message: string; response: string }>> {
  try {
    // Query interactions ordered by timestamp
    const interactions = await queryFirestore(
      'ai_interactions',
      'userId',
      '==',
      userId,
      'timestamp',
      'desc',
      limit
    );
    
    return interactions.map(doc => ({
      message: doc.message,
      response: doc.response,
    }));
  } catch (error) {
    console.error('Error querying recent interactions:', error);
    return [];
  }
}
