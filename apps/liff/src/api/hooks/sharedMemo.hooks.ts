import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { sharedMemoApi } from '../apiClient';
import type {
    SharedMemo,
    CreateSharedMemoInput,
    UpdateSharedMemoInput,
    AddEditorInput,
    ListSharedMemosResponse,
    SharedMemoEditor,
} from '../generated';
import type { AxiosError } from 'axios';
import { logger } from '../../utils/logger';

interface ApiError { error?: string; message?: string; }

const sharedMemoKeys = {
  all: (filters?: Record<string, any>) => ['sharedMemos', filters ?? {}] as const,
  lists: () => [...sharedMemoKeys.all(), 'list'] as const,
  list: (filters?: { limit?: number; cursor?: string }) => [...sharedMemoKeys.lists(), filters ?? {}] as const,
  details: () => [...sharedMemoKeys.all(), 'detail'] as const,
  detail: (id: string | undefined) => [...sharedMemoKeys.details(), id] as const,
  editors: (id: string | undefined) => [...sharedMemoKeys.detail(id), 'editors'] as const,
};

export function useInfiniteSharedMemos(limit: number = 20) {
    return useInfiniteQuery<ListSharedMemosResponse, AxiosError<ApiError>>({
        queryKey: sharedMemoKeys.list({ limit }),
        queryFn: async ({ pageParam }) => {
            logger.info(`[RQ] Fetching shared memos: limit=${limit}, cursor=${pageParam}`);
            const response = await sharedMemoApi.listSharedMemos(limit, pageParam as string | undefined);
            return response.data;
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });
}

export function useSharedMemoDetail(memoId: string | null | undefined) {
    return useQuery<SharedMemo, AxiosError<ApiError>>({
        queryKey: sharedMemoKeys.detail(memoId),
        queryFn: async () => {
            const id = memoId!;
            logger.info(`[RQ] Fetching shared memo detail: ${id}`);
            const response = await sharedMemoApi.getSharedMemoById(id);
            return response.data;
        },
        enabled: !!memoId,
    });
}

export function useCreateSharedMemo() {
    const queryClient = useQueryClient();
    return useMutation<SharedMemo, AxiosError<ApiError>, CreateSharedMemoInput>({
        mutationFn: async (data) => {
            logger.info('[RQ] Creating shared memo:', data);
            const response = await sharedMemoApi.createSharedMemo(data);
            return response.data;
        },
        onSuccess: () => {
            logger.info('[RQ] Shared memo created');
            queryClient.invalidateQueries({ queryKey: sharedMemoKeys.lists() });
        },
        onError: (error) => logger.error('[RQ] Failed to create shared memo:', error.response?.data || error.message),
    });
}

export function useUpdateSharedMemo(memoId: string | null | undefined) {
    const queryClient = useQueryClient();
    return useMutation<void, AxiosError<ApiError>, UpdateSharedMemoInput>({
        mutationFn: async (data) => {
            if (!memoId) throw new Error('memoId is required');
            logger.info(`[RQ] Updating shared memo ${memoId}:`, data);
            await sharedMemoApi.updateSharedMemo(memoId, data);
        },
        onSuccess: () => {
            logger.info(`[RQ] Shared memo ${memoId} updated`);
            queryClient.invalidateQueries({ queryKey: sharedMemoKeys.detail(memoId) });
            queryClient.invalidateQueries({ queryKey: sharedMemoKeys.lists() });
        },
        onError: (error) => logger.error(`[RQ] Failed to update shared memo ${memoId}:`, error.response?.data || error.message),
    });
}

export function useArchiveSharedMemo(memoId: string | null | undefined) {
    const queryClient = useQueryClient();
    return useMutation<void, AxiosError<ApiError>, void>({
        mutationFn: async () => {
            if (!memoId) throw new Error('memoId is required');
            logger.info(`[RQ] Archiving shared memo: ${memoId}`);
            await sharedMemoApi.archiveSharedMemo(memoId);
        },
        onSuccess: () => {
            logger.info(`[RQ] Shared memo ${memoId} archived`);
            queryClient.removeQueries({ queryKey: sharedMemoKeys.detail(memoId) });
            queryClient.invalidateQueries({ queryKey: sharedMemoKeys.lists() });
        },
        onError: (error) => logger.error(`[RQ] Failed to archive shared memo ${memoId}:`, error.response?.data || error.message),
    });
}

export function useAddSharedMemoEditor(memoId: string | null | undefined) {
    const queryClient = useQueryClient();
    return useMutation<void, AxiosError<ApiError>, AddEditorInput>({
        mutationFn: async (data) => {
            if (!memoId) throw new Error('memoId is required');
            logger.info(`[RQ] Adding editor ${data.editorUserId} to shared memo ${memoId}`);
            await sharedMemoApi.addSharedMemoEditor(memoId, data);
        },
        onSuccess: (data, variables) => {
            logger.info(`[RQ] Editor ${variables.editorUserId} added to shared memo ${memoId}`);
            queryClient.invalidateQueries({ queryKey: sharedMemoKeys.detail(memoId) });
        },
        onError: (error) => logger.error(`[RQ] Failed to add editor to shared memo ${memoId}:`, error.response?.data || error.message),
    });
}

export function useRemoveSharedMemoEditor(memoId: string | null | undefined) {
    const queryClient = useQueryClient();
    return useMutation<void, AxiosError<ApiError>, { editorId: string }>({
        mutationFn: async (variables) => {
            if (!memoId) throw new Error('memoId is required');
            logger.info(`[RQ] Removing editor ${variables.editorId} from shared memo ${memoId}`);
            await sharedMemoApi.removeSharedMemoEditor(memoId, variables.editorId);
        },
        onSuccess: (data, variables) => {
            logger.info(`[RQ] Editor ${variables.editorId} removed from shared memo ${memoId}`);
            queryClient.invalidateQueries({ queryKey: sharedMemoKeys.detail(memoId) });
        },
        onError: (error) => logger.error(`[RQ] Failed to remove editor from shared memo ${memoId}:`, error.response?.data || error.message),
    });
} 