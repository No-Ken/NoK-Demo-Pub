// 共通型定義
// libs/types/firestore-types.ts
// Firestore document data *only* (ID は含めない) と Zod スキーマ
// v0.9.1 – 2025‑05‑01  🔄 feedback 対応

import { z } from 'zod';

/** ************* 共通型 *************/
// Firestore Admin SDK / Client SDK の Timestamp 型
export type FSTimestamp = FirebaseFirestore.Timestamp;

// エミュレータ JSON ⇄ 実インスタンス 両対応
export const timestampSchema = z
  .instanceof<FSTimestamp>(Object as any) // eslint-disable-line @typescript-eslint/ban-types
  .or(z.string().datetime());

/** ************* users *************/
export const userDocSchema = z.object({
  status: z.enum(['active', 'pending', 'inactive']).default('pending'),
  displayName: z.string().min(1).optional(),
  pictureUrl: z.string().url().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  friendAddedAt: timestampSchema.optional(),
  settings: z.record(z.any()).optional(),
});
export type UserDoc = z.infer<typeof userDocSchema>;

/** ************* groups *************/
export const groupDocSchema = z.object({
  groupName: z.string().min(1).optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  members: z.record(z.string(), timestampSchema).optional(), // key = lineUserId
});
export type GroupDoc = z.infer<typeof groupDocSchema>;

/** ************* schedules *************/
export const scheduleDocSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['adjusting', 'confirmed', 'cancelled']).default('adjusting'),
  createdBy: z.string().min(1), // userId
  groupId: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  candidateDates: z.array(
    z.object({
      optionId: z.string().min(1),
      datetime: timestampSchema,
    }),
  ).optional(),
  confirmedDateTime: timestampSchema.optional(),
});
export type ScheduleDoc = z.infer<typeof scheduleDocSchema>;

export const scheduleParticipantDocSchema = z.object({
  scheduleId: z.string().min(1), // 親ID を保持
  isGuest: z.boolean(),
  lineUserId: z.string().optional(),
  displayName: z.string().min(1),
  addedAt: timestampSchema,
});
export type ScheduleParticipantDoc = z.infer<typeof scheduleParticipantDocSchema>;

export const scheduleVoteDocSchema = z.object({
  scheduleId: z.string().min(1),
  optionId: z.string().min(1),
  participantId: z.string().min(1),
  vote: z.enum(['ok', 'maybe', 'ng']),
  comment: z.string().optional(),
  votedAt: timestampSchema,
});
export type ScheduleVoteDoc = z.infer<typeof scheduleVoteDocSchema>;

/** ************* warikan *************/
export const warikanProjectDocSchema = z.object({
  projectName: z.string().min(1),
  status: z.enum(['active', 'settled']).default('active'),
  createdBy: z.string().min(1),
  groupId: z.string().optional(),
  shareUrlToken: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  totalAmount: z.number().nonnegative().default(0),
  memberCount: z.number().int().nonnegative().default(0),
});
export type WarikanProjectDoc = z.infer<typeof warikanProjectDocSchema>;

export const warikanMemberDocSchema = z.object({
  projectId: z.string().min(1),
  isGuest: z.boolean(),
  lineUserId: z.string().optional(),
  displayName: z.string().min(1),
  balance: z.number().default(0),
  addedAt: timestampSchema,
});
export type WarikanMemberDoc = z.infer<typeof warikanMemberDocSchema>;

export const warikanPaymentDocSchema = z.object({
  projectId: z.string().min(1),
  payerMemberId: z.string().min(1),
  amount: z.number().nonnegative(),
  description: z.string().optional(),
  paymentDate: timestampSchema.optional(),
  createdAt: timestampSchema,
  participants: z.array(z.string()).optional(),
});
export type WarikanPaymentDoc = z.infer<typeof warikanPaymentDocSchema>;

export const warikanSettlementDocSchema = z.object({
  projectId: z.string().min(1),
  payerMemberId: z.string().min(1),
  receiverMemberId: z.string().min(1),
  amount: z.number().nonnegative(),
  isDone: z.boolean().default(false),
});
export type WarikanSettlementDoc = z.infer<typeof warikanSettlementDocSchema>;

/** ************* personal memos *************/
export const personalMemoDocSchema = z.object({
  userId: z.string().min(1),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(['line', 'liff']).default('line').optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  pageId: z.string().optional(),
  isArchived: z.boolean().default(false).optional(),
  aiAnalysis: z.record(z.any()).optional(),
});
export type PersonalMemoDoc = z.infer<typeof personalMemoDocSchema>;

export const memoPageDocSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional(),
  parentPageId: z.string().nullable().optional(),
  order: z.number().int().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type MemoPageDoc = z.infer<typeof memoPageDocSchema>;

/** ************* shared memos *************/
export const sharedMemoDocSchema = z.object({
  title: z.string().min(1),
  templateType: z.enum(['meeting', 'outing', 'free']).default('free').optional(),
  content: z.string().optional(),
  createdBy: z.string().min(1),
  groupId: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  lastEditorId: z.string().optional(),
});
export type SharedMemoDoc = z.infer<typeof sharedMemoDocSchema>;

export const sharedMemoEditorDocSchema = z.object({
  sharedMemoId: z.string().min(1),
  addedAt: timestampSchema,
});
export type SharedMemoEditorDoc = z.infer<typeof sharedMemoEditorDocSchema>;

/** ************* export 集約 *************/
export const schemas = {
  userDocSchema,
  groupDocSchema,
  scheduleDocSchema,
  scheduleParticipantDocSchema,
  scheduleVoteDocSchema,
  warikanProjectDocSchema,
  warikanMemberDocSchema,
  warikanPaymentDocSchema,
  warikanSettlementDocSchema,
  personalMemoDocSchema,
  memoPageDocSchema,
  sharedMemoDocSchema,
  sharedMemoEditorDocSchema,
};
