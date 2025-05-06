import ScheduleRepository from '../adapters/firestore/schedule.repo';
import { z } from 'zod';
import {
  createScheduleInputSchema,
  participantInputSchema,
  voteInputSchema,
} from '../controllers/schedule.controller';
import { ForbiddenError, NotFoundError } from '../errors/httpErrors';
import type { ScheduleDoc } from '@task/types/firestore-types';

type ScheduleResponse = ScheduleDoc & { id: string };

export default class ScheduleService {
  private repo = new ScheduleRepository();

  async createSchedule(userId: string, input: z.infer<typeof createScheduleInputSchema>): Promise<ScheduleResponse> {
    return this.repo.createSchedule(userId, input);
  }

  async getSchedule(id: string, userId: string): Promise<ScheduleResponse | null> {
    const hasPermission = await this.repo.isParticipantOrOwner(id, userId);
    const schedule = await this.repo.getScheduleById(id);

    if (!schedule) {
        return null;
    }
    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to access this schedule.');
    }
    return schedule;
  }

  async addParticipant(id: string, requesterUserId: string, input: z.infer<typeof participantInputSchema>): Promise<void> {
    if (!(await this.repo.isOwner(id, requesterUserId))) {
      throw new ForbiddenError('Only the owner can add participants.');
    }
    await this.repo.addParticipant(id, input);
  }

  async addCandidateDates(id: string, userId: string, isoDates: string[]): Promise<void> {
    if (!(await this.repo.isParticipantOrOwner(id, userId))) {
      throw new ForbiddenError('You do not have permission to add candidate dates.');
    }
    await this.repo.addCandidateDates(id, isoDates);
  }

  async addVote(id: string, userId: string, input: z.infer<typeof voteInputSchema>): Promise<void> {
    if (!(await this.repo.isParticipant(id, userId))) {
      throw new ForbiddenError('Only participants can vote.');
    }
    await this.repo.addOrUpdateVote(id, userId, input);
  }

  async confirmSchedule(id: string, userId: string): Promise<void> {
    if (!(await this.repo.isOwner(id, userId))) {
      throw new ForbiddenError('Only the owner can confirm the schedule.');
    }
    await this.repo.confirmSchedule(id);
  }

  async archiveSchedule(id: string, userId: string): Promise<void> {
      if (!(await this.repo.isOwner(id, userId))) {
          throw new ForbiddenError('Only the owner can archive the schedule.');
      }
      await this.repo.archiveSchedule(id);
  }
}