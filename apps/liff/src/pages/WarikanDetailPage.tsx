import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useWarikanProjectDetail,
    // useWarikanPayments, // projectDetailに含まれる前提
    // useWarikanSettlements, // ★ 未実装API/フック
    useAddWarikanMember,
    // useRemoveWarikanMember, // ★ 未実装フック
    useAddWarikanPayment,
    // useDeleteWarikanPayment, // ★ 未実装フック
    useSettleWarikanProject,
} from '../api/hooks/warikan.hooks';
import { logger } from '../utils/logger';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { MemberList } from '@/components/features/warikan/MemberList';
import { PaymentList } from '@/components/features/warikan/PaymentList';
import { SettlementResult } from '@/components/features/warikan/SettlementResult';
import { AddPaymentForm } from '@/components/features/warikan/AddPaymentForm';
import { AddMemberForm } from '@/components/features/warikan/AddMemberForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

function WarikanDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return <div>プロジェクトIDが無効です。</div>; // IDがない場合のエラー

  const navigate = useNavigate();
  const { firebaseUser } = useAuthStore();
  const { toast } = useToast();

  // --- データ取得 ---
  const { data: projectDetail, isLoading, error, refetch: refetchProject } = useWarikanProjectDetail(projectId);
  // 精算結果は別途取得 (API/フック実装後)
  // const { data: settlements, isLoading: isLoadingSettlements } = useWarikanSettlements(projectId);

  // --- ミューテーション ---
  const addMemberMutation = useAddWarikanMember(projectId);
  const addPaymentMutation = useAddWarikanPayment(projectId);
  const settleProjectMutation = useSettleWarikanProject(projectId);
  // TODO: 削除系ミューテーション

  // --- ダイアログ制御 ---
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // --- ローディング・エラー表示 ---
  if (isLoading) { /* ... ローディング表示 (Skeleton) ... */ }
  if (error) { /* ... エラー表示 ... */ }
  if (!projectDetail) { /* ... Not Found 表示 ... */ }

  const isOwner = projectDetail.createdBy === firebaseUser?.uid;

  // --- イベントハンドラ ---
  const handleAddPaymentSuccess = () => {
    setIsAddPaymentOpen(false);
    toast({ title: "支払いを追加しました" });
    // refetchProject(); // projectDetailを再取得する場合 (キャッシュ無効化でも可)
  };
  const handleAddMemberSuccess = () => {
    setIsAddMemberOpen(false);
    toast({ title: "メンバーを追加しました" });
  };
  const handleSettleProject = () => { /* ... 精算実行処理 (前回参照) ... */ };
  const handleRemoveMember = (memberId: string, memberName: string) => { /* ... メンバー削除処理 (未実装) ... */ };
  const handleDeletePayment = (paymentId: string, description?: string | null) => { /* ... 支払い削除処理 (未実装) ... */ };

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{projectDetail.projectName}</CardTitle>
          <CardDescription>
            ステータス: {projectDetail.status === 'active' ? '精算中' : '精算済み'}
            <span className="ml-4 text-sm">合計: {projectDetail.totalAmount?.toLocaleString() ?? 0} 円</span>
            <span className="ml-4 text-sm">人数: {projectDetail.members?.length ?? projectDetail.memberCount ?? 0} 人</span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">支払い</TabsTrigger>
          <TabsTrigger value="members">メンバー</TabsTrigger>
          <TabsTrigger value="settlement">精算</TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>支払い履歴</CardTitle></div>
              <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                <DialogTrigger asChild><Button size="sm">追加</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>支払いを追加</DialogTitle></DialogHeader>
                  <AddPaymentForm projectId={projectId} members={projectDetail.members} onSubmitSuccess={handleAddPaymentSuccess}/>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <PaymentList
                payments={projectDetail.payments}
                members={projectDetail.members}
                projectId={projectId}
                currentUserId={firebaseUser?.uid}
                // onEditPayment={(p) => {/* TODO */}}
                onDeletePayment={handleDeletePayment}
                isLoadingDelete={false /* deletePaymentMutation.isPending */}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <div><CardTitle>参加メンバー</CardTitle></div>
               <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                 <DialogTrigger asChild><Button size="sm" variant="outline">追加</Button></DialogTrigger>
                 <DialogContent>
                   <DialogHeader><DialogTitle>メンバーを追加</DialogTitle></DialogHeader>
                   <AddMemberForm projectId={projectId} onSubmitSuccess={handleAddMemberSuccess} />
                 </DialogContent>
               </Dialog>
             </CardHeader>
             <CardContent>
               <MemberList
                 members={projectDetail.members}
                 projectId={projectId}
                 isOwner={isOwner}
                 onRemoveMember={handleRemoveMember}
                 isLoadingRemove={false /* removeMemberMutation.isPending */}
               />
             </CardContent>
           </Card>
        </TabsContent>

        {/* Settlement Tab */}
        <TabsContent value="settlement">
          <Card>
            <CardHeader>
              <CardTitle>精算結果</CardTitle>
              <CardDescription>誰が誰にいくら支払うか</CardDescription>
            </CardHeader>
            <CardContent>
              <SettlementResult projectId={projectId} />
              {projectDetail?.status === 'active' && (
                 <div className="mt-4 border-t pt-4">
                    <Button variant="destructive" onClick={handleSettleProject} disabled={settleProjectMutation.isPending}>
                        {settleProjectMutation.isPending ? '処理中...' : '精算済みにする'}
                    </Button>
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default WarikanDetailPage; 