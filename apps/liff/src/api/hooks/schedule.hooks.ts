import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '../apiClient';
import type {
    Schedule,
    ScheduleDetail,
    CreateScheduleInput,
    AddParticipantInput,
    AddCandidateDatesInput,
    VoteInput,
    ScheduleParticipant,
} from '../generated';
import type { AxiosError } from 'axios';
import { logger } from '../../utils/logger';

// エラーレスポンスの共通型
interface ApiError { error?: string; message?: string; }

// キャッシュキーを一元管理するオブジェクト
const scheduleQueryKeys = {
  all: ['schedules'] as const,
  details: () => [...scheduleQueryKeys.all, 'detail'] as const,
  detail: (id: string | undefined) => [...scheduleQueryKeys.details(), id] as const,
};

/**
 * 指定されたIDのスケジュール詳細情報を取得するフック
 */
export function useScheduleDetail(scheduleId: string | null | undefined) {
  return useQuery<ScheduleDetail, AxiosError<ApiError>>({
    queryKey: scheduleQueryKeys.detail(scheduleId),
    queryFn: async () => {
      const id = scheduleId!;
      logger.info(`[RQ] Fetching schedule detail: ${id}`);
      const response = await scheduleApi.getScheduleById(id);
      return response.data;
    },
    enabled: !!scheduleId,
  });
}

/**
 * 新しいスケジュールを作成するミューテーションフック
 */
export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation<Schedule, AxiosError<ApiError>, CreateScheduleInput>({
    mutationFn: async (data) => {
      logger.info('[RQ] Creating schedule:', data);
      const response = await scheduleApi.createSchedule(data);
      return response.data;
    },
    onSuccess: (newSchedule) => {
      logger.info(`[RQ] Schedule created: ${newSchedule.id}`);
      // queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.all });
    },
    onError: (error) => logger.error('[RQ] Failed to create schedule:', error.response?.data || error.message),
  });
}

/**
 * スケジュールに参加者を追加するミューテーションフック
 */
export function useAddScheduleParticipant(scheduleId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<ScheduleParticipant, AxiosError<ApiError>, AddParticipantInput>({
    mutationFn: async (data) => {
      if (!scheduleId) throw new Error('scheduleId is required');
      logger.info(`[RQ] Adding participant to schedule ${scheduleId}:`, data);
      const response = await scheduleApi.addScheduleParticipant(scheduleId, data);
      return response.data;
    },
    onSuccess: () => {
      logger.info(`[RQ] Participant added to schedule ${scheduleId}`);
      queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.detail(scheduleId) });
    },
    onError: (error) => logger.error(`[RQ] Failed to add participant:`, error.response?.data || error.message),
  });
}

/**
 * スケジュールに候補日時を追加するミューテーションフック
 */
export function useAddScheduleCandidateDates(scheduleId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiError>, AddCandidateDatesInput>({
    mutationFn: async (data) => {
      if (!scheduleId) throw new Error('scheduleId is required');
      logger.info(`[RQ] Adding candidate dates to schedule ${scheduleId}:`, data);
      await scheduleApi.addScheduleCandidateDates(scheduleId, data);
    },
    onSuccess: () => {
      logger.info(`[RQ] Candidate dates added to schedule ${scheduleId}`);
      queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.detail(scheduleId) });
    },
    onError: (error) => logger.error(`[RQ] Failed to add candidate dates:`, error.response?.data || error.message),
  });
}

/**
 * スケジュールに投票するミューテーションフック
 */
export function useAddScheduleVote(scheduleId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiError>, VoteInput>({
    mutationFn: async (data) => {
      if (!scheduleId) throw new Error('scheduleId is required');
      logger.info(`[RQ] Adding vote to schedule ${scheduleId}:`, data);
      await scheduleApi.addScheduleVote(scheduleId, data);
    },
    onSuccess: () => {
      logger.info(`[RQ] Vote added to schedule ${scheduleId}`);
      queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.detail(scheduleId) });
    },
    onError: (error) => logger.error(`[RQ] Failed to add vote:`, error.response?.data || error.message),
  });
}

/**
 * スケジュールを確定するミューテーションフック
 */
export function useConfirmSchedule(scheduleId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiError>, void>({
    mutationFn: async () => {
      if (!scheduleId) throw new Error('scheduleId is required');
      logger.info(`[RQ] Confirming schedule: ${scheduleId}`);
      await scheduleApi.confirmSchedule(scheduleId);
    },
    onSuccess: () => {
      logger.info(`[RQ] Schedule ${scheduleId} confirmed`);
      queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.detail(scheduleId) });
    },
    onError: (error) => logger.error(`[RQ] Failed to confirm schedule:`, error.response?.data || error.message),
  });
}

export function useArchiveSchedule(scheduleId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiError>, void>({
    mutationFn: async () => {
      if (!scheduleId) throw new Error('scheduleId is required');
      logger.info(`[RQ] Archiving schedule: ${scheduleId}`);
      await scheduleApi.archiveSchedule(scheduleId);
    },
    onSuccess: () => {
      logger.info(`[RQ] Schedule ${scheduleId} archived`);
      queryClient.removeQueries({ queryKey: scheduleQueryKeys.detail(scheduleId) });
    },
    onError: (error) => logger.error(`[RQ] Failed to archive schedule:`, error.response?.data || error.message),
  });
} 