import { z } from 'zod';
import type { Timestamp } from 'firebase-admin/firestore'; // または firebase/firestore
// Timestamp スキーマ (前回の定義例、または z.instanceof(Timestamp) を直接使用)
const timestampSchema = z.custom<Timestamp>(
  (data) => data instanceof Timestamp,
  { message: 'Invalid Timestamp' }
);
const timestampOptionalSchema = timestampSchema.optional(); // 任意の場合
const timestampNullableSchema = timestampSchema.nullable(); // Null許容の場合
// ... (他のスキーマ: UserDoc, GroupDoc, ScheduleDoc etc.) ...
// ★ SharedMemoDoc スキーマ (修正・確定版)
export const sharedMemoDocSchema = z.object({
  title: z.string().min(1, { message: 'タイトルは必須です' }),
  templateType: z.enum(['meeting', 'outing', 'free']).optional().default('free'),
  content: z.string().optional(),
  createdBy: z.string(), // LINE User ID
  groupId: z.string().nullable().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  lastEditorId: z.string().optional(),
  readableUserIds: z.array(z.string()).optional().default([]), // ★ 読み書き可能ユーザーIDリスト
  isArchived: z.boolean().optional().default(false),         // ★ 論理削除フラグ
  // structuredContent: z.record(z.any()).optional(), // ★ Gemini結果格納用 (将来追加)
});
export type SharedMemoDoc = z.infer<typeof sharedMemoDocSchema>;
// ★ SharedMemoEditorDoc スキーマ (サブコレクション用)
export const sharedMemoEditorDocSchema = z.object({
    addedAt: timestampSchema,
});
export type SharedMemoEditorDoc = z.infer<typeof sharedMemoEditorDocSchema>;
// チャットコンテキストドキュメントのスキーマ
export const chatContextDocSchema = z.object({
  chatId: z.string(),
  chatType: z.enum(['user', 'group', 'room']),
  activeSharedMemoId: z.string().nullable().optional(),
  activeWarikanProjectId: z.string().nullable().optional(),
  activeScheduleId: z.string().nullable().optional(),
  activePersonalMemoId: z.string().nullable().optional(),
  updatedAt: timestampSchema,
});
export type ChatContextDoc = z.infer<typeof chatContextDocSchema>;
// Service層で使用するコンテキスト型
export interface ChatContext {
  activeSharedMemoId: string | null;
  activeWarikanProjectId: string | null;
  activeScheduleId: string | null;
  activePersonalMemoId: string | null;
}
// メッセージログドキュメントのスキーマ
export const messageLogDocSchema = z.object({
  messageId: z.string(),
  chatId: z.string(),
  chatType: z.enum(['user', 'group', 'room']),
  userId: z.string(),
  type: z.string(),
  text: z.string().nullable().optional(),
  lineTimestamp: timestampSchema,
  createdAt: timestampSchema,
});
export type MessageLogDoc = z.infer<typeof messageLogDocSchema>;
// ... (他の型) ...
import { warikanProjectDocSchema } from './firestore-types';

export const listWarikanProjectsResponseSchema = z.object({
    data: z.array(warikanProjectDocSchema.extend({ id: z.string() })),
    nextCursor: z.string().nullable(),
});
export type ListWarikanProjectsResponse = z.infer<typeof listWarikanProjectsResponseSchema>;
// --- Aggregated export ---
export const schemas = {
  // ... (他のスキーマ) ...
  sharedMemoDocSchema,
  sharedMemoEditorDocSchema,
  chatContextDocSchema,
  messageLogDocSchema,
  timestampSchema,
};