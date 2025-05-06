import { z } from 'zod';

// ... (既存のスキーマ) ...

// グループの状態を表すスキーマ
export const groupStateSchema = z.object({
    activeSharedMemoId: z.string().nullable().optional(),
    activeWarikanProjectId: z.string().nullable().optional(),
}).partial();
export type GroupState = z.infer<typeof groupStateSchema>;

// ユーザーの状態を表すスキーマ
export const userStateSchema = z.object({
    activePersonalMemoId: z.string().nullable().optional(),
    activeWarikanProjectId: z.string().nullable().optional(),
}).partial();
export type UserState = z.infer<typeof userStateSchema>;

// ChatContext 型定義
export interface ChatContext {
    activeSharedMemoId: string | null;
    activeWarikanProjectId: string | null;
    activePersonalMemoId: string | null;
} 