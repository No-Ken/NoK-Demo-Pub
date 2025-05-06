import { z } from 'zod';
import type { AppLogger } from '../utils/logger';

/** CommandType 定義 */
export const CommandTypeEnum = z.enum([
  'WARIKAN_START',
  'WARIKAN_PAYMENT_ADD',
  'SCHEDULE_ADJUSTMENT_START',
  'MEMO_PERSONAL_ADD',
  'MEMO_PERSONAL_UPDATE',
  'MEMO_SHARED_START',
  'MEMO_SHARED_UPDATE',
  'HELP',
  'UNKNOWN',
]);
export type CommandType = z.infer<typeof CommandTypeEnum>;

export interface ParsedCommand {
  type: CommandType;
  args: string | null;
  commandKeyword: string | null;
  rawText: string; // 元のテキストを保持
}

// 金額判定（より厳密な正規表現）
const paymentRegex = /^(?:￥|¥|\s*)?([\d,０-９]+)\s*(?:円|$)/;

// コマンド定義（優先順位順）
const commandDefinitions: Array<{ 
  keywords: string[], 
  type: CommandType,
  requiresGroup?: boolean // グループチャット必須フラグ
}> = [
  // 共有メモ関連（グループチャット必須）
  { 
    keywords: ['共有メモ更新', '議事録に追記', 'あのメモに加えて'], 
    type: 'MEMO_SHARED_UPDATE',
    requiresGroup: true 
  },
  { 
    keywords: ['共有メモ', '共有めも', '議事録作成'], 
    type: 'MEMO_SHARED_START',
    requiresGroup: true 
  },
  
  // 個人メモ関連
  { 
    keywords: ['メモ更新', '追記して', 'さっきのメモに'], 
    type: 'MEMO_PERSONAL_UPDATE'
  },
  { 
    keywords: ['メモ', 'めも', '覚えて', '記録'], 
    type: 'MEMO_PERSONAL_ADD'
  },
  
  // その他機能
  { 
    keywords: ['割り勘', 'わりかん', '精算', '立て替え払い'], 
    type: 'WARIKAN_START'
  },
  { 
    keywords: ['スケジュール', '日程', '調整', '予定', 'いつにする', 'アポ'], 
    type: 'SCHEDULE_ADJUSTMENT_START'
  },
  { 
    keywords: ['ヘルプ', '使い方', '教えて', 'help'], 
    type: 'HELP'
  },
];

/**
 * メンション本体テキストを解析し、コマンドタイプと引数を抽出する
 * @param text 解析対象テキスト
 * @param isGroupChat グループチャットかどうか
 * @param logger ロガーインスタンス（オプション）
 */
export function parseMentionCommand(
  text: string,
  isGroupChat: boolean,
  logger?: AppLogger
): ParsedCommand {
  const trimmedText = text.trim();
  const lowerTrimmedText = trimmedText.toLowerCase();
  const result: ParsedCommand = { 
    type: 'UNKNOWN', 
    args: null, 
    commandKeyword: null,
    rawText: trimmedText 
  };

  logger?.debug(`Parsing command for text: "${trimmedText}" (group: ${isGroupChat})`);

  // 1. 金額表現チェック
  const paymentMatch = trimmedText.match(paymentRegex);
  if (paymentMatch) {
    result.type = 'WARIKAN_PAYMENT_ADD';
    result.args = trimmedText;
    result.commandKeyword = '(payment_detected)';
    logger?.info(`Payment command detected: ${result.type}`);
    return result;
  }

  // 2. キーワードマッチング
  for (const def of commandDefinitions) {
    // グループチャット要件チェック
    if (def.requiresGroup && !isGroupChat) continue;

    for (const keyword of def.keywords) {
      if (lowerTrimmedText.startsWith(keyword)) {
        result.type = def.type;
        result.commandKeyword = keyword;
        
        // キーワード以降を引数として抽出
        const args = trimmedText.substring(keyword.length).trim();
        result.args = args.length > 0 ? args : null;
        
        logger?.info(
          `Command matched: ${result.type} (keyword: "${keyword}", args: "${result.args}")`
        );
        return result;
      }
    }
  }

  // 3. マッチしない場合
  result.type = 'UNKNOWN';
  result.args = trimmedText;
  logger?.info('No command match found, defaulting to UNKNOWN');
  return result;
}

// 金額パース用ヘルパー関数
export function parseAmount(text: string): number | null {
  const match = text.match(/([\d,０-９]+)/);
  if (!match) return null;
  
  try {
    // 全角数字を半角に変換し、カンマを除去して数値化
    const normalized = match[1]
      .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/,|，/g, '');
    
    const amount = parseInt(normalized, 10);
    return isNaN(amount) || amount <= 0 ? null : amount;
  } catch {
    return null;
  }
} 