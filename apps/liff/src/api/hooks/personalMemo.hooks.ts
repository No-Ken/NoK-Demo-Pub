import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { personalMemoApi } from '../apiClient';
import type {
    PersonalMemo,
    CreateMemoInput,
    UpdateMemoInput,
    ListMemosResponse,
} from '../generated';
import type { AxiosError } from 'axios';
import { logger } from '../../utils/logger';

interface ApiError { error?: string; message?: string; }

const personalMemoKeys = {
  all: ['personalMemos'] as const,
  lists: () => [...personalMemoKeys.all, 'list'] as const,
  list: (filters?: { limit?: number; cursor?: string }) => [...personalMemoKeys.lists(), filters ?? {}] as const,
  details: () => [...personalMemoKeys.all, 'detail'] as const,
  detail: (id: string | undefined) => [...personalMemoKeys.details(), id] as const,
};

export function useInfinitePersonalMemos(limit: number = 20) {
    return useInfiniteQuery<ListMemosResponse, AxiosError<ApiError>>({
        queryKey: personalMemoKeys.list({ limit }),
        queryFn: async ({ pageParam }) => {
            logger.info(`[RQ] Fetching personal memos: limit=${limit}, cursor=${pageParam}`);
            const response = await personalMemoApi.listPersonalMemos(limit, pageParam as string | undefined);
            return response.data;
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });
}

export function usePersonalMemoDetail(memoId: string | null | undefined) {
    return useQuery<PersonalMemo, AxiosError<ApiError>>({
        queryKey: personalMemoKeys.detail(memoId),
        queryFn: async () => {
            const id = memoId!;
            logger.info(`[RQ] Fetching personal memo detail: ${id}`);
            const response = await personalMemoApi.getPersonalMemoById(id);
            return response.data;
        },
        enabled: !!memoId,
    });
}

export function useCreatePersonalMemo() {
    const queryClient = useQueryClient();
    return useMutation<PersonalMemo, AxiosError<ApiError>, CreateMemoInput>({
        mutationFn: async (data) => {
            logger.info('[RQ] Creating personal memo:', data);
            const response = await personalMemoApi.createPersonalMemo(data);
            return response.data;
        },
        onSuccess: () => {
            logger.info('[RQ] Personal memo created');
            queryClient.invalidateQueries({ queryKey: personalMemoKeys.lists() });
        },
        onError: (error) => logger.error('[RQ] Failed to create personal memo:', error.response?.data || error.message),
    });
}

export function useUpdatePersonalMemo(memoId: string | null | undefined) {
    const queryClient = useQueryClient();
    return useMutation<void, AxiosError<ApiError>, UpdateMemoInput>({
        mutationFn: async (data) => {
            if (!memoId) throw new Error('memoId is required');
            logger.info(`[RQ] Updating personal memo ${memoId}:`, data);
            await personalMemoApi.updatePersonalMemo(memoId, data);
        },
        onSuccess: () => {
            logger.info(`[RQ] Personal memo ${memoId} updated`);
            queryClient.invalidateQueries({ queryKey: personalMemoKeys.detail(memoId) });
            queryClient.invalidateQueries({ queryKey: personalMemoKeys.lists() });
        },
        onError: (error) => logger.error(`[RQ] Failed to update personal memo ${memoId}:`, error.response?.data || error.message),
    });
}

export function useArchivePersonalMemo(memoId: string | null | undefined) {
    const queryClient = useQueryClient();
    return useMutation<void, AxiosError<ApiError>, void>({
        mutationFn: async () => {
            if (!memoId) throw new Error('memoId is required');
            logger.info(`[RQ] Archiving personal memo: ${memoId}`);
            await personalMemoApi.deletePersonalMemo(memoId);
        },
        onSuccess: () => {
            logger.info(`[RQ] Personal memo ${memoId} archived`);
            queryClient.removeQueries({ queryKey: personalMemoKeys.detail(memoId) });
            queryClient.invalidateQueries({ queryKey: personalMemoKeys.lists() });
        },
        onError: (error) => logger.error(`[RQ] Failed to archive personal memo ${memoId}:`, error.response?.data || error.message),
    });
} 