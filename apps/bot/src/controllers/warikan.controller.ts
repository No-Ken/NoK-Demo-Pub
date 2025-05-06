import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { warikanService } from '../services';
import { HttpError } from '../errors/httpErrors';

// Input Schemas
export const createProjectInputSchema = z.object({
  projectName: z.string().min(1),
});
export const addPaymentInputSchema = z.object({
  payerMemberId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
  participants: z.array(z.string()).optional(),
});

const listWarikanQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
  cursor: z.string().optional(),
});

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  });

export const warikanController = {
  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new HttpError('Unauthorized', 401);
      }
      const project = await warikanService.createProject(userId, req.body.name);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  },

  async getProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new HttpError('Unauthorized', 401);
      }
      const project = await warikanService.getProject(req.params.id, userId);
      if (!project) {
        throw new HttpError('Project not found', 404);
      }
      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  addPayment: asyncHandler(async (req: Request, res: Response) => {
    const body = addPaymentInputSchema.parse(req.body);
    const id = await warikanService.addPayment(req.params.id, body, req.user!.uid);
    res.status(201).json({ id });
  }),

  listPayments: asyncHandler(async (req: Request, res: Response) => {
    const list = await warikanService.listPayments(req.params.id, req.user!.uid);
    res.json(list);
  }),

  listProjects: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.uid;
    if (!userId) {
      throw new HttpError('Unauthorized', 401);
    }
    const query = listWarikanQuerySchema.parse(req.query);
    const result = await warikanService.listProjects(userId, query.limit, query.cursor);
    res.json(result); // { data: [], nextCursor: null }
  }),

  /**
   * GET /projects/:id/settlements のハンドラ
   */
  getSettlements: asyncHandler(async (req: Request, res: Response) => {
    // 認証ミドルウェアで req.auth.uid は保証されている想定
    const settlements = await warikanService.getSettlements(req.params.id, req.auth!.uid);
    res.json(settlements);
  }),

  /**
   * DELETE /projects/:id/payments/:paymentId のハンドラ
   */
  deletePayment = asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId, paymentId } = req.params;
    await warikanService.deletePayment(projectId, paymentId, req.auth!.uid);
    res.status(204).end();
  }),
};
