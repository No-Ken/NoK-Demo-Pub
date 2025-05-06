import { z } from 'zod';
import type { AppLogger } from '../utils/logger';

/**
 * 支払いコマンド引数のパース結果を表す型
 */
export const paymentArgsSchema = z.object({
  amount: z.number().int().positive({ message: '金額は1円以上の整数で入力してください。' }),
  description: z.string().max(100, { message: 'メモは100文字以内で入力してください。' }).optional(),
  // payerUserId: z.string().optional(), // TODO: 支払者メンション解析用
});
export type PaymentArgs = z.infer<typeof paymentArgsSchema>;

// 金額抽出用の正規表現 (全角・カンマ対応、円マーク任意)
const amountRegex = /(?:￥|¥|\s|^)([\d,０-９]+)\s*(?:円|$)/;
// 全角数字・カンマを半角に変換
const toHalfWidth = (str: string): string => str.replace(/[０-９，]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFE0));

/**
 * 支払いコマンドの引数テキストから金額と説明 (任意) を抽出する
 * @param textArgs 引数文字列 (例: "1000円 ランチ代", "5,000", "会議室代 300円")
 * @param logger (任意) ログ出力用
 * @returns パース結果 PaymentArgs、失敗時は null
 */
export function parsePaymentArgs(textArgs: string | null, logger?: AppLogger): PaymentArgs | null {
  if (!textArgs) {
    logger?.warn('[ArgParser] Payment args text is null.');
    return null;
  }
  logger?.debug(`[ArgParser] Parsing payment args: "${textArgs}"`);

  // 1. 金額を抽出・検証
  const amountMatch = textArgs.match(amountRegex);
  if (!amountMatch?.[1]) {
    logger?.warn('[ArgParser] Payment amount pattern not found in args.');
    return null;
  }
  let amount: number;
  try {
    const amountString = toHalfWidth(amountMatch[1]).replace(/,/g, '');
    amount = parseInt(amountString, 10);
    // Zodスキーマで正の整数かもチェック
    paymentArgsSchema.pick({ amount: true }).parse({ amount });
  } catch (error) {
    logger?.error("[ArgParser] Failed to parse or validate amount:", { amountString: amountMatch[1], error });
    return null;
  }

  // 2. 説明を抽出 (金額部分を除いた残り)
  const matchedAmountExpression = amountMatch[0];
  const description = textArgs.replace(matchedAmountExpression, '').trim() || undefined;

  // 3. 結果を組み立てて最終バリデーション
  try {
    const result = paymentArgsSchema.parse({ amount, description });
    logger?.info('[ArgParser] Payment args parsed successfully:', result);
    return result;
  } catch (error) {
    logger?.error("[ArgParser] Final validation failed:", { amount, description, error });
    return null;
  }
}

// スケジュール調整用スキーマ
export const scheduleArgsSchema = z.object({
  title: z.string().optional(),
  dates: z.array(z.string()).optional(), // 日付候補（オプション）
});
export type ScheduleArgs = z.infer<typeof scheduleArgsSchema>;

/**
 * スケジュール調整コマンドの引数をパースする
 * @param textArgs 引数文字列
 * @returns パース結果 ScheduleArgs
 */
export function parseScheduleArgs(textArgs: string): ScheduleArgs {
  // 基本的にはタイトルとして扱う
  return { title: textArgs || undefined };
}

// メモ作成用スキーマ
export const memoArgsSchema = z.object({
  title: z.string().optional(),
  content: z.string(),
});
export type MemoArgs = z.infer<typeof memoArgsSchema>;

/**
 * メモ作成コマンドの引数をパースする
 * @param textArgs 引数文字列
 * @returns パース結果 MemoArgs
 */
export function parseMemoArgs(textArgs: string): MemoArgs {
  const lines = textArgs.split('\n');
  // 1行目をタイトルとして扱う（オプション）
  if (lines.length > 1) {
    return {
      title: lines[0],
      content: lines.slice(1).join('\n').trim()
    };
  }
  // 1行のみの場合は全てcontentとして扱う
  return { content: textArgs };
} 