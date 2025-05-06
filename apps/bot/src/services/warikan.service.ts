import { ForbiddenError, NotFoundError, ValidationError } from '../errors/httpErrors';
import WarikanRepository from '../adapters/firestore/warikan.repo';
import { addPaymentInputSchema } from '../controllers/warikan.controller';
import { WarikanProjectDoc, WarikanPaymentDoc, WarikanMemberDoc } from '@task/types/firestore-types';
import { z } from 'zod';
import { parseAmount } from './commandParser';
import { parsePaymentArgs, type PaymentArgs } from './argumentParsers';
import type { AppLogger } from '../utils/logger';
import { logger } from '../utils/logger';

type WarikanProjectResponse = WarikanProjectDoc & { id: string };
type WarikanPaymentResponse = { id: string };

// ★ 精算結果の型 (APIレスポンスにも利用)
export interface Settlement {
    payer: WarikanMemberDoc & { id: string };
    receiver: WarikanMemberDoc & { id: string };
    amount: number;
}

export default class WarikanService {
  private repo = new WarikanRepository();
  private logger?: AppLogger;

  constructor(logger?: AppLogger) {
    this.logger = logger;
  }

  async createProject(userId: string, projectName: string): Promise<WarikanProjectResponse> {
    const newProject = await this.repo.createProject(userId, projectName);
    return newProject;
  }

  async getProject(projectId: string, userId: string): Promise<WarikanProjectResponse | null> {
    const isMember = await this.repo.isProjectMember(projectId, userId);
    const project = await this.repo.getProjectById(projectId);

    if (!project) {
        return null;
    }
    if (project.createdBy !== userId && !isMember) {
      throw new ForbiddenError('You do not have permission to access this project.');
    }
    return project;
  }

  async addPayment(
    projectId: string,
    userId: string,
    input: z.infer<typeof addPaymentInputSchema>
  ): Promise<WarikanPaymentResponse> {
    const isMember = await this.repo.isProjectMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('You must be a member to add payments.');
    }

    const payerIsValid = await this.repo.isProjectMember(projectId, input.payerMemberId);
    if (!payerIsValid) {
        throw new ForbiddenError(`Payer (${input.payerMemberId}) is not a member of this project.`);
    }

    const paymentId = await this.repo.addPayment(projectId, input);
    return { id: paymentId };
  }

  async listPayments(projectId: string, userId: string) {
    const isMember = await this.repo.isProjectMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('You must be a member to view payments.');
    }
    return this.repo.listPayments(projectId);
  }

  /**
   * テキストコマンドから支払い情報を登録する
   */
  async addPaymentFromText(projectId: string, userId: string, textArgs: string | null): Promise<string> {
    // 1. 認可チェック: 操作ユーザーがメンバーか
    if (!(await this.isProjectMember(projectId, userId))) {
      throw new ForbiddenError('支払い登録にはプロジェクトのメンバーである必要があります。');
    }

    // 2. 引数パース
    const parsedArgs = parsePaymentArgs(textArgs);
    if (!parsedArgs) {
      throw new ValidationError('支払い情報の形式が正しくありません。\n金額（必須）とメモ（任意）を認識できませんでした。\n例:「@BOT 1000円 ランチ代」');
    }

    // 3. 支払者IDの決定 (現状は操作ユーザー固定)
    const payerMemberId = userId;

    // 4. Repository の addPayment を呼び出し
    const paymentInput = {
      payerMemberId: payerMemberId,
      amount: parsedArgs.amount,
      description: parsedArgs.description,
    };

    try {
      const paymentId = await this.repo.addPayment(projectId, paymentInput);
      return paymentId;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError(`割り勘プロジェクトが見つかりません (ID: ${projectId})`);
      }
      throw error;
    }
  }

  /**
   * プロジェクトを作成する
   */
  async createProject(
    userId: string, 
    input: { projectName: string; groupId?: string }
  ): Promise<WarikanProjectDoc & { id: string }> {
    // プロジェクト作成
    const project = await this.repo.createProject({
      name: input.projectName,
      createdBy: userId,
      createdAt: new Date(),
      groupId: input.groupId,
      members: [{ userId, role: 'owner' }],
    });

    this.logger?.info(
      `Created warikan project: ${project.id} (${project.name})`
    );
    return project;
  }

  /**
   * ユーザーがプロジェクトのメンバーかどうかを確認する
   */
  private async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const member = await this.repo.getMember(projectId, userId);
    return !!member;
  }

  /**
   * 指定ユーザーがアクセス可能なプロジェクト一覧を取得（ページネーション対応）
   */
  async listProjects(userId: string, limit: number, cursor?: string) {
    // 認可は Repository のクエリ (readableUserIds) で行われる
    return this.repo.listProjectsByUserId(userId, limit, cursor);
  }

  /**
   * 指定された割り勘プロジェクトの精算結果を計算して取得する
   */
  async getSettlements(projectId: string, userId: string): Promise<Settlement[]> {
    logger.info(`[WarikanService] Calculating settlements for project ${projectId}, requested by ${userId}`);

    // --- 1. 認可チェック: ユーザーがメンバーか？ ---
    if (!(await this.isProjectMember(projectId, userId))) {
      throw new ForbiddenError('You must be a member to view settlements.');
    }

    // --- 2. 必要なデータを Repository から取得 ---
    const members = await this.repo.listMembers(projectId);
    const payments = await this.repo.listPayments(projectId);

    if (!members || members.length === 0) {
        logger.warn(`[WarikanService] No members found for project ${projectId}, cannot calculate settlements.`);
        return [];
    }
    if (!payments || payments.length === 0) {
        logger.info(`[WarikanService] No payments found for project ${projectId}, no settlements needed.`);
        return [];
    }

    // --- 3. 各メンバーの収支を計算 ---
    const balances: { [memberId: string]: number } = {};
    members.forEach(m => balances[m.id] = 0);

    let totalPaymentAmount = 0;
    payments.forEach(p => {
        balances[p.payerMemberId] += p.amount;
        totalPaymentAmount += p.amount;
        const participants = p.participants?.length ? p.participants : members.map(m => m.id);
        if (participants.length > 0) {
            const amountPerParticipant = p.amount / participants.length;
            participants.forEach(participantId => {
                if (balances[participantId] !== undefined) {
                    balances[participantId] -= amountPerParticipant;
                } else {
                    logger.warn(`[WarikanService] Participant ${participantId} in payment ${p.id} not found in member list.`);
                }
            });
        }
    });
    logger.debug(`[WarikanService] Calculated balances for project ${projectId}:`, balances);

    // --- 4. 精算アルゴリズム (シンプルな方法) ---
    const settlements: Settlement[] = [];
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
        if (amount > 0.01) {
            creditors.push({ id, amount });
        } else if (amount < -0.01) {
            debtors.push({ id, amount: -amount });
        }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];
        const transferAmount = Math.min(creditor.amount, debtor.amount);

        if (transferAmount > 0.01) {
            const payerMember = members.find(m => m.id === debtor.id);
            const receiverMember = members.find(m => m.id === creditor.id);

            if (payerMember && receiverMember) {
                 settlements.push({
                    payer: payerMember,
                    receiver: receiverMember,
                    amount: Math.round(transferAmount * 100) / 100,
                 });
            } else {
                logger.error(`[WarikanService] Payer or Receiver not found during settlement calculation! Payer: ${debtor.id}, Receiver: ${creditor.id}`);
            }
        }

        creditor.amount -= transferAmount;
        debtor.amount -= transferAmount;

        if (creditor.amount < 0.01) creditorIndex++;
        if (debtor.amount < 0.01) debtorIndex++;
    }
    logger.info(`[WarikanService] Generated ${settlements.length} settlements for project ${projectId}`);

    return settlements;
  }

  /**
   * 支払い記録を削除する (認可チェックなし)
   */
  async deletePayment(projectId: string, paymentId: string, userId: string): Promise<void> {
    try {
      await this.repo.deletePayment(projectId, paymentId);
    } catch (error) {
      throw error;
    }
  }
}