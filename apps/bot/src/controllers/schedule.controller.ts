import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scheduleService } from '../services';
import { HttpError } from '../errors/httpErrors';

// Input Schemas
export const createScheduleInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});
export const participantInputSchema = z.object({
  displayName: z.string().min(1),
  lineUserId: z.string().optional(),
});
export const candidateDatesInputSchema = z.object({
  dates: z.array(z.string().datetime()).min(1),
});
export const voteInputSchema = z.object({
  optionId: z.string().min(1),
  vote: z.enum(['ok', 'maybe', 'ng']),
  comment: z.string().optional(),
});

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const scheduleController = {
  async createSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new HttpError('Unauthorized', 401);
      }
      const schedule = await scheduleService.createSchedule(userId, req.body);
      res.status(201).json(schedule);
    } catch (error) {
      next(error);
    }
  },

  getScheduleById: asyncHandler(async (req: Request, res: Response) => {
    const data = await scheduleService.getSchedule(req.params.id, req.auth!.uid);
    if (!data) throw new HttpError(404, 'Not found');
    res.json(data);
  }),

  addParticipant: asyncHandler(async (req: Request, res: Response) => {
    const body = participantInputSchema.parse(req.body);
    await scheduleService.addParticipant(req.params.id, req.auth!.uid, body);
    res.status(201).end();
  }),

  addCandidateDates: asyncHandler(async (req: Request, res: Response) => {
    const body = candidateDatesInputSchema.parse(req.body);
    await scheduleService.addCandidateDates(req.params.id, req.auth!.uid, body.dates);
    res.status(204).end();
  }),

  addVote: asyncHandler(async (req: Request, res: Response) => {
    const body = voteInputSchema.parse(req.body);
    await scheduleService.addVote(req.params.id, req.auth!.uid, body);
    res.status(204).end();
  }),

  confirmSchedule: asyncHandler(async (req: Request, res: Response) => {
    await scheduleService.confirmSchedule(req.params.id, req.auth!.uid);
    res.status(204).end();
  }),
};
