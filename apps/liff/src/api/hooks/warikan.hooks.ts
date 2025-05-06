import { useQuery, useMutation, useQueryClient, QueryKey, useInfiniteQuery } from '@tanstack/react-query';
import { warikanApi } from '../apiClient';
import type {
  CreateProjectInput,
  AddPaymentInput,
  WarikanProject,
  WarikanPayment,
  WarikanProjectDetail,
  WarikanMember,
  WarikanSettlement,
  AddMemberInput
} from '../generated';
import type { AxiosError } from 'axios';
import { logger } from '../../utils/logger';
import type { ListWarikanProjectsResponse } from '@task/types/firestore-types';

interface ApiError {
  error?: string;
  message?: string;
}

const warikanKeys = {
  all: ['warikanProjects'] as const,
  lists: () => [...warikanKeys.all, 'list'] as const,
  details: () => [...warikanKeys.all, 'detail'] as const,
  detail: (id: string | undefined) => [...warikanKeys.details(), id] as const,
  payments: (id: string | undefined) => [...warikanKeys.detail(id), 'payments'] as const,
  members: (id: string | undefined) => [...warikanKeys.detail(id), 'members'] as const,
  settlements: (id: string | undefined) => [...warikanKeys.detail(id), 'settlements'] as const,
};

/**
 * 自分がアクセス可能な割り勘プロジェクト一覧を取得するフック
 */
export function useWarikanProjects() {
  return useQuery<WarikanProject[], AxiosError<ApiError>>({
    queryKey: ['warikanProjects'],
    queryFn: async () => {
      logger.info('Fetching warikan projects...');
      const response = await warikanApi.listWarikanProjects();
      return response.data;
    },
  });
}

/**
 * 特定の割り勘プロジェクト詳細を取得するフック
 */
export function useWarikanProjectDetail(projectId: string | null | undefined) {
  return useQuery<WarikanProjectDetail, AxiosError<ApiError>>({
    queryKey: warikanKeys.detail(projectId),
    queryFn: async () => {
      const id = projectId!;
      logger.info(`[RQ] Fetching warikan project detail: ${id}`);
      const response = await warikanApi.getWarikanProjectById(id);
      return response.data;
    },
    enabled: !!projectId,
  });
}

/**
 * 特定の割り勘プロジェクトの支払い一覧を取得するフック
 */
export function useWarikanPayments(projectId: string | null | undefined) {
  return useQuery<WarikanPayment[], AxiosError<ApiError>>({
    queryKey: warikanKeys.payments(projectId),
    queryFn: async () => {
      const id = projectId!;
      logger.info(`[RQ] Fetching payments for project: ${id}`);
      const response = await warikanApi.listWarikanPayments(id);
      return response.data;
    },
    enabled: !!projectId,
  });
}

/**
 * 新しい割り勘プロジェクトを作成するミューテーションフック
 */
export function useCreateWarikanProject() {
  const queryClient = useQueryClient();
  return useMutation<WarikanProject, AxiosError<ApiError>, CreateProjectInput>({
    mutationFn: async (data) => {
      logger.info('[RQ] Creating warikan project:', data);
      const response = await warikanApi.createWarikanProject(data);
      return response.data;
    },
    onSuccess: (newProject) => {
      logger.info(`[RQ] Warikan project created: ${newProject.id}`);
      // queryClient.invalidateQueries({ queryKey: warikanKeys.lists() });
    },
    onError: (error) => logger.error('[RQ] Failed to create warikan project:', error.response?.data || error.message),
  });
}

/**
 * 割り勘プロジェクトに支払いを追加するミューテーションフック
 */
export function useAddWarikanPayment(projectId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, AxiosError<ApiError>, AddPaymentInput>({
    mutationFn: async (data) => {
      if (!projectId) throw new Error('projectId is required');
      logger.info(`[RQ] Adding payment to project ${projectId}:`, data);
      const response = await warikanApi.addWarikanPayment(projectId, data);
      return response.data;
    },
    onSuccess: (data) => {
      logger.info(`[RQ] Payment ${data.id} added to project ${projectId}`);
      queryClient.invalidateQueries({ queryKey: warikanKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: warikanKeys.payments(projectId) });
      queryClient.invalidateQueries({ queryKey: warikanKeys.settlements(projectId) });
    },
    onError: (error) => logger.error(`[RQ] Failed to add payment:`, error.response?.data || error.message),
  });
}

export function useAddWarikanMember(projectId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<WarikanMember, AxiosError<ApiError>, AddMemberInput>({
    mutationFn: async (data) => {
      if (!projectId) throw new Error('projectId is required');
      logger.info(`[RQ] Adding member to project ${projectId}:`, data);
      const response = await warikanApi.addWarikanMember(projectId, data);
      return response.data;
    },
    onSuccess: () => {
      logger.info(`[RQ] Member added to project ${projectId}`);
      queryClient.invalidateQueries({ queryKey: warikanKeys.detail(projectId) });
    },
    onError: (error) => logger.error(`[RQ] Failed to add member:`, error.response?.data || error.message),
  });
}

export function useSettleWarikanProject(projectId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<WarikanProject, AxiosError<ApiError>, void>({
    mutationFn: async () => {
      if (!projectId) throw new Error('projectId is required');
      logger.info(`[RQ] Settling project: ${projectId}`);
      const response = await warikanApi.settleWarikanProject(projectId);
      return response.data;
    },
    onSuccess: () => {
      logger.info(`[RQ] Project ${projectId} settled.`);
      queryClient.invalidateQueries({ queryKey: warikanKeys.detail(projectId) });
    },
    onError: (error) => logger.error(`[RQ] Failed to settle project:`, error.response?.data || error.message),
  });
}

/**
 * アクセス可能な割り勘プロジェクト一覧を取得するフック (無限スクロール)
 */
export function useInfiniteWarikanProjects(limit: number = 20) {
    return useInfiniteQuery<ListWarikanProjectsResponse, AxiosError<ApiError>>({
        queryKey: warikanKeys.lists(),
        queryFn: async ({ pageParam }) => {
            logger.info(`[RQ] Fetching warikan projects: limit=${limit}, cursor=${pageParam}`);
            const response = await warikanApi.listWarikanProjects(limit, pageParam as string | undefined);
            return response.data;
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });
}

/**
 * 特定の割り勘プロジェクトの精算結果を取得するフック
 */
export function useWarikanSettlements(projectId: string | null | undefined) {
  const queryKey = warikanKeys.settlements(projectId);
  return useQuery<WarikanSettlement[], AxiosError<ApiError>>({
    queryKey: queryKey,
    queryFn: async () => {
      const id = projectId!;
      logger.info(`[RQ] Fetching settlements for project: ${id}`);
      const response = await warikanApi.getWarikanSettlements(id);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 支払い記録を削除するミューテーションフック
 */
export function useDeleteWarikanPayment(projectId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiError>, { paymentId: string }>({
    mutationFn: async (variables) => {
      if (!projectId) throw new Error('projectId is required');
      logger.info(`[RQ] Deleting payment ${variables.paymentId} from project ${projectId}`);
      await warikanApi.deleteWarikanPayment(projectId, variables.paymentId);
    },
    onSuccess: (data, variables) => {
      logger.info(`[RQ] Payment ${variables.paymentId} deleted from project ${projectId}`);
      queryClient.invalidateQueries({ queryKey: warikanKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: warikanKeys.payments(projectId) });
      queryClient.invalidateQueries({ queryKey: warikanKeys.settlements(projectId) });
    },
    onError: (error, variables) => {
      logger.error(`[RQ] Failed to delete payment ${variables.paymentId}:`, error.response?.data || error.message);
    },
  });
} 