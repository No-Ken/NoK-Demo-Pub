import PersonalMemoRepository from '../adapters/firestore/personalMemo.repo';
import { z } from 'zod';
import { createMemoSchema, updateMemoSchema } from '../controllers/personalMemo.controller';
import { ForbiddenError, NotFoundError } from '../errors/httpErrors';
import type { PersonalMemoDoc } from '@task/types/firestore-types';

type PersonalMemoResponse = PersonalMemoDoc & { id: string };
type ListMemosResponse = { data: PersonalMemoResponse[], nextCursor: string | null };

export default class PersonalMemoService {
  private repo = new PersonalMemoRepository();

  async createMemo(userId: string, input: z.infer<typeof createMemoSchema>): Promise<PersonalMemoResponse> {
    return this.repo.createMemo(userId, input);
  }

  async getMemo(id: string, userId: string): Promise<PersonalMemoResponse | null> {
    const memo = await this.repo.getMemoById(id);
    if (!memo) {
        return null;
    }
    if (memo.userId !== userId) {
      return null;
    }
    return memo;
  }

  async listMemos(userId: string, limit: number, cursor?: string): Promise<ListMemosResponse> {
    return this.repo.listMemos(userId, limit, cursor);
  }

  async updateMemo(id: string, userId: string, input: z.infer<typeof updateMemoSchema>): Promise<void> {
    const memo = await this.repo.getMemoById(id);
    if (!memo) {
        throw new NotFoundError('Personal memo not found or archived.');
    }
    if (memo.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this memo.');
    }
    await this.repo.updateMemo(id, input);
  }

  async deleteMemo(id: string, userId: string): Promise<void> {
    const memo = await this.repo.getMemoById(id);
    if (!memo) {
        throw new NotFoundError('Personal memo not found or archived.');
    }
    if (memo.userId !== userId) {
      throw new ForbiddenError('You do not have permission to archive this memo.');
    }
    await this.repo.archiveMemo(id);
  }
}