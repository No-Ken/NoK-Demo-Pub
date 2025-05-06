import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import PersonalMemoService from '../services/personalMemo.service';
import { HttpError } from '../errors/httpErrors';

export const createMemoSchema = z.object({
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});
export const updateMemoSchema = z.object({
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
});

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default class PersonalMemoController {
  private service = new PersonalMemoService();

  createMemo = asyncHandler(async (req: Request, res: Response) => {
    const body = createMemoSchema.parse(req.body);
    const memo = await this.service.createMemo(req.auth!.uid, body);
    res.status(201).json(memo);
  });

  getMemoById = asyncHandler(async (req: Request, res: Response) => {
    const memo = await this.service.getMemo(req.params.id, req.auth!.uid);
    if (!memo) throw new HttpError(404, 'Not found');
    res.json(memo);
  });

  listMemos = asyncHandler(async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);
    const list = await this.service.listMemos(req.auth!.uid, query.limit, query.cursor);
    res.json(list);
  });

  updateMemo = asyncHandler(async (req: Request, res: Response) => {
    const body = updateMemoSchema.parse(req.body);
    await this.service.updateMemo(req.params.id, req.auth!.uid, body);
    res.status(204).end();
  });

  deleteMemo = asyncHandler(async (req: Request, res: Response) => {
    await this.service.deleteMemo(req.params.id, req.auth!.uid);
    res.status(204).end();
  });
}