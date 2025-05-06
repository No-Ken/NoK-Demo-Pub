import React from 'react';
import { useWarikanSettlements } from '@/api/hooks/warikan.hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { logger } from '@/utils/logger';

interface SettlementResultProps {
  projectId: string;
}

export function SettlementResult({ projectId }: SettlementResultProps) {
  const { data: settlements, isLoading, error, isError } = useWarikanSettlements(projectId);

  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isError) {
    logger.error(`Failed to fetch settlements for ${projectId}:`, error);
    return (
      <div className="flex items-center space-x-2 text-destructive p-4 justify-center">
        <AlertTriangle className="h-5 w-5" />
        <p>精算結果の取得に失敗しました。</p>
      </div>
    );
  }

  if (!settlements || settlements.length === 0) {
    return (
        <div className="flex items-center space-x-2 text-muted-foreground p-4 justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p>精算の必要はありません！</p>
        </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">以下の送金を行うと精算が完了します。</p>
      {settlements.map((s, index) => (
        <div key={`${s.payer.id}-${s.receiver.id}-${index}`}
             className="flex items-center justify-between p-3 border rounded-md bg-gray-50/80 shadow-sm text-sm sm:text-base">
          <div className="flex items-center space-x-1 flex-wrap">
            <span className="font-medium text-red-700 bg-red-100 px-1.5 py-0.5 rounded text-xs sm:text-sm">
                {s.payer.displayName}
            </span>
            <span className="text-muted-foreground text-xs sm:text-sm">→</span>
            <span className="font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded text-xs sm:text-sm">
                {s.receiver.displayName}
            </span>
          </div>
          <div className="font-bold text-lg text-primary whitespace-nowrap pl-2">
            {Math.round(s.amount).toLocaleString()} 円
          </div>
        </div>
      ))}
    </div>
  );
} 