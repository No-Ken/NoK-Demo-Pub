import { firestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  WarikanProjectDoc,
  warikanProjectDocSchema,
  WarikanMemberDoc,
  warikanMemberDocSchema,
  WarikanPaymentDoc,
  warikanPaymentDocSchema,
} from '@task/types/firestore-types';
import { NotFoundError } from '../../errors/httpErrors';

export default class WarikanRepository {
  private db = firestore();
  private projectsCol = this.db.collection('warikanProjects') as FirebaseFirestore.CollectionReference<WarikanProjectDoc>;
  private membersCol(projectId: string) { return this.projectsCol.doc(projectId).collection('warikanMembers') as FirebaseFirestore.CollectionReference<WarikanMemberDoc>; }
  private paymentsCol(projectId: string) { return this.projectsCol.doc(projectId).collection('warikanPayments') as FirebaseFirestore.CollectionReference<WarikanPaymentDoc>; }

  async createProject(userId: string, projectName: string): Promise<WarikanProjectDoc & { id: string }> {
    const now = Timestamp.now();
    const data: WarikanProjectDoc = {
      projectName,
      status: 'active',
      createdBy: userId,
      groupId: null,
      shareUrlToken: null,
      createdAt: now,
      updatedAt: now,
      totalAmount: 0,
      memberCount: 1,
    };
    const parsedData = warikanProjectDocSchema.parse(data);
    const ref = await this.projectsCol.add(parsedData);

    const memberData: WarikanMemberDoc = {
        lineUserId: userId,
        isGuest: false,
        displayName: 'Owner (You)',
        balance: 0,
        addedAt: now,
    };
    const parsedMemberData = warikanMemberDocSchema.parse(memberData);
    await this.membersCol(ref.id).doc(userId).set(parsedMemberData);

    console.log(`Created warikan project ${ref.id}`);
    return { id: ref.id, ...parsedData };
  }

  async getProjectById(id: string): Promise<(WarikanProjectDoc & { id: string }) | null> {
    const snap = await this.projectsCol.doc(id).get();
    if (!snap.exists) return null;
    try {
      const data = warikanProjectDocSchema.parse(snap.data());
      return { id: snap.id, ...data };
    } catch (error) {
        console.error(`Firestore data validation failed for warikanProject ${id}:`, error);
        return null;
    }
  }

  async getMember(projectId: string, userId: string): Promise<(WarikanMemberDoc & { id: string }) | null> {
      const snap = await this.membersCol(projectId).doc(userId).get();
      if (!snap.exists) return null;
      try {
        const data = warikanMemberDocSchema.parse(snap.data());
        return { id: snap.id, ...data };
      } catch (error) {
          console.error(`Firestore data validation failed for warikanMember ${projectId}/${userId}:`, error);
          return null;
      }
  }

  async addPayment(
    projectId: string,
    input: { payerMemberId: string; amount: number; description?: string; participants?: string[] }
  ): Promise<string> {
    const projectRef = this.projectsCol.doc(projectId);
    const paymentsRef = this.paymentsCol(projectId).doc();

    const paymentId = await this.db.runTransaction(async (tx) => {
      const projSnap = await tx.get(projectRef);
      if (!projSnap.exists) throw new Error(`Project ${projectId} not found`);

      const now = Timestamp.now();
      const dataToCreate: WarikanPaymentDoc = {
        projectId: projectId,
        payerMemberId: input.payerMemberId,
        amount: input.amount,
        description: input.description,
        participants: input.participants,
        createdAt: now,
      };
      const parsedData = warikanPaymentDocSchema.parse(dataToCreate);

      tx.set(paymentsRef, parsedData);
      tx.update(projectRef, {
        totalAmount: firestore.FieldValue.increment(input.amount),
        updatedAt: now,
      });
      return paymentsRef.id;
    });
    console.log(`Added payment ${paymentId} to project ${projectId}`);
    return paymentId;
  }

  async listPayments(projectId: string): Promise<(WarikanPaymentDoc & { id: string })[]> {
    const snaps = await this.paymentsCol(projectId)
      .orderBy('createdAt', 'asc')
      .get();

    return snaps.docs
        .map(doc => {
            try {
                const data = warikanPaymentDocSchema.parse(doc.data());
                return { id: doc.id, ...data };
            } catch (error) {
                console.error(`Firestore data validation failed for warikanPayment ${projectId}/${doc.id}:`, error);
                return null;
            }
        })
        .filter((item): item is WarikanPaymentDoc & { id: string } => item !== null);
  }

  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    // まず、プロジェクト作成者かどうかをチェック
    const projectSnap = await this.projectsCol.doc(projectId).get();
    if (!projectSnap.exists) return false;
    
    const projectData = projectSnap.data() as WarikanProjectDoc;
    if (projectData.createdBy === userId) return true;
    
    // 次に、メンバーかどうかをチェック
    const memberSnap = await this.membersCol(projectId).doc(userId).get();
    return memberSnap.exists;
  }

  /**
   * 指定ユーザーがアクセス可能なプロジェクト一覧を取得（ページネーション対応）
   */
  async listProjectsByUserId(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<{ data: (WarikanProjectDoc & { id: string })[]; nextCursor: string | null }> {
    let query = this.projectsCol
      .where('readableUserIds', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .limit(limit);

    if (cursor) {
      try {
        const cursorSnap = await this.projectsCol.doc(cursor).get();
        if (cursorSnap.exists) {
          query = query.startAfter(cursorSnap);
        } else {
          console.warn(`[WarikanRepo] Cursor ${cursor} not found.`);
        }
      } catch (error) {
        console.error(`Error fetching cursor ${cursor}:`, error);
      }
    }
    const snaps = await query.get();
    const data = snaps.docs
      .map(doc => {
        try {
          const parsed = warikanProjectDocSchema.parse(doc.data());
          return { id: doc.id, ...parsed };
        } catch (error) {
          console.error(`Firestore data validation failed for warikanProject ${doc.id}:`, error);
          return null;
        }
      })
      .filter((item): item is WarikanProjectDoc & { id: string } => item !== null);
    const nextCursor = snaps.docs.length === limit ? snaps.docs[snaps.docs.length - 1]?.id : null;
    return { data, nextCursor };
  }

  /**
   * 指定プロジェクトのメンバー一覧を取得
   */
  async listMembers(projectId: string): Promise<(WarikanMemberDoc & { id: string })[]> {
    const snaps = await this.membersCol(projectId).get();
    return snaps.docs.map(doc => {
      try {
        const data = warikanMemberDocSchema.parse(doc.data());
        return { id: doc.id, ...data };
      } catch (error) {
        console.error(`Firestore data validation failed for warikanMember ${projectId}/${doc.id}:`, error);
        return null;
      }
    }).filter((item): item is WarikanMemberDoc & { id: string } => item !== null);
  }

  /**
   * 支払い記録を削除し、合計金額を更新する (トランザクション)
   */
  async deletePayment(projectId: string, paymentId: string): Promise<void> {
    const logger = console; // 仮ロガー
    const projectRef = this.projectsCol.doc(projectId);
    const paymentRef = this.paymentsCol(projectId).doc(paymentId);

    await this.db.runTransaction(async (tx) => {
      const paymentSnap = await tx.get(paymentRef);
      const projectSnap = await tx.get(projectRef);

      if (!projectSnap.exists) {
        throw new NotFoundError(`Project ${projectId} not found.`);
      }
      if (!paymentSnap.exists) {
        throw new NotFoundError(`Payment ${paymentId} not found.`);
      }

      const paymentData = warikanPaymentDocSchema.parse(paymentSnap.data());
      const amountToDelete = paymentData.amount ?? 0;

      tx.delete(paymentRef);
      tx.update(projectRef, {
        totalAmount: firestore.FieldValue.increment(-amountToDelete),
        updatedAt: Timestamp.now(),
      });
      logger.info(`[WarikanRepo] Payment ${paymentId} prepared for deletion and totalAmount updated in tx.`);
    });
    logger.info(`[WarikanRepo] Payment ${paymentId} deleted successfully from project ${projectId}.`);
  }
}