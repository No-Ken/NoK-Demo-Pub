import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { logger } from '@/utils/logger';
import { useInfiniteWarikanProjects } from '@/api/hooks/warikan.hooks';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { CreateProjectForm } from '@/components/features/warikan/CreateProjectForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';

function WarikanListPage() {
  const navigate = useNavigate();
  const { firebaseUser } = useAuthStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 無限スクロールフックを使用
  const {
      data: projectsData,
      fetchNextPage,
      hasNextPage,
      isLoading,
      isFetchingNextPage,
      error,
  } = useInfiniteWarikanProjects();

  // 無限スクロールのための Intersection Observer
  const { ref: loadMoreRef, inView } = useInView();

  React.useEffect(() => {
      if (inView && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
      }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 全ページのデータをフラットな配列に変換
  const projects = projectsData?.pages.flatMap(page => page.data) ?? [];

  const handleCreateSuccess = (newProjectId: string) => {
    setIsCreateDialogOpen(false);
    navigate(`/warikan/${newProjectId}`);
  };

  if (isLoading && !projectsData) {
      return <div className="p-4"><Skeleton className="h-8 w-3/4 mb-6" /><Skeleton className="h-20 w-full mb-4" /><Skeleton className="h-20 w-full" /></div>;
  }
  if (error) {
      logger.error('Failed to fetch warikan projects:', error);
      return <div className="p-4 text-red-600">プロジェクト一覧の読み込みに失敗しました。</div>;
  }
  if (!firebaseUser) {
      return <div className="p-4 text-gray-500">ログインしてください。</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">割り勘プロジェクト</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild><Button size="sm">新規作成</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しい割り勘プロジェクト</DialogTitle>
              <DialogDescription>プロジェクト名を入力してください。(メンバーは後で追加)</DialogDescription>
            </DialogHeader>
            <CreateProjectForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* プロジェクト一覧 */}
      <div className="space-y-4">
        {projects && projects.length > 0 ? (
          projects.map((proj) => (
            <Link to={`/warikan/${proj.id}`} key={proj.id} className="block hover:no-underline">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{proj.projectName}</CardTitle>
                  <CardDescription>
                    ステータス: {proj.status === 'active' ? '精算中' : '精算済み'}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))
        ) : (
          !isLoading && <div className="text-center p-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">まだプロジェクトがありません。</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>最初のプロジェクトを作成</Button>
              </DialogTrigger>
               <DialogContent className="sm:max-w-[425px]">
                 <DialogHeader>
                   <DialogTitle>新しい割り勘プロジェクト</DialogTitle>
                   <DialogDescription>プロジェクト名を入力してください。(メンバーは後で追加)</DialogDescription>
                 </DialogHeader>
                 <CreateProjectForm onSuccess={handleCreateSuccess} />
               </DialogContent>
            </Dialog>
          </div>
        )}
        {/* 無限スクロール用のトリガー要素 */}
        <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
            {isFetchingNextPage && <p>読み込み中...</p>}
            {!hasNextPage && projects.length > 0 && <p className="text-sm text-gray-500">全てのプロジェクトを表示しました</p>}
        </div>
      </div>
    </div>
  );
}
export default WarikanListPage; 