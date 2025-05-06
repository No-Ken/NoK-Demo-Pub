import type { Request, Response, NextFunction } from 'express'; // type-only import
import { z } from 'zod';
import SharedMemoService from '../services/sharedMemo.service';
import { HttpError, NotFoundError, ForbiddenError } from '../errors/httpErrors'; // エラークラス
// Input Schemas
export const createSharedMemoSchema = z.object({
  title: z.string().min(1),
  templateType: z.enum(['meeting', 'outing', 'free']).optional(), // default は Service/Repo で設定
  content: z.string().optional(),
  groupId: z.string().optional(), // グループID (任意)
});
export const updateSharedMemoSchema = z.object({
  title: z.string().min(1).optional(), // 更新時は最低1文字の制約は任意かも？
  content: z.string().optional(),
});
export const editorSchema = z.object({ // 編集者追加用
  editorUserId: z.string().min(1),
});
export const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
  cursor: z.string().optional(),
});
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export default class SharedMemoController {
  private service = new SharedMemoService();
  createSharedMemo = asyncHandler(async (req: Request, res: Response) => {
    // 認証ミドルウェアで req.auth.uid が設定されている前提
    if (!req.auth?.uid) throw new HttpError(401, 'Authentication required');
    const body = createSharedMemoSchema.parse(req.body);
    const memo = await this.service.createSharedMemo(req.auth.uid, body);
    res.status(201).json(memo);
  });
  getSharedMemoById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.uid) throw new HttpError(401, 'Authentication required');
    const memo = await this.service.getSharedMemo(req.params.id, req.auth.uid);
    // Service層で権限チェック済み & 存在しない場合はnullが返る
    if (!memo) throw new NotFoundError('Shared memo not found or access denied.');
    res.json(memo);
  });
  listSharedMemos = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.uid) throw new HttpError(401, 'Authentication required');
    const query = listQuerySchema.parse(req.query);
    const result = await this.service.listSharedMemos(req.auth.uid, query.limit, query.cursor);
    res.json(result); // { data: [], nextCursor: null }
  });
  updateSharedMemo = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.uid) throw new HttpError(401, 'Authentication required');
    const body = updateSharedMemoSchema.parse(req.body);
    // 更新するフィールドが1つもない場合はエラーにするか？ (任意)
    if (Object.keys(body).length === 0) {
        throw new HttpError(400, 'Request body must contain at least one field to update.');
    }
    await this.service.updateSharedMemo(req.params.id, req.auth.uid, body);
    res.status(204).end();
  });
  archiveSharedMemo = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.uid) throw new HttpError(401, 'Authentication required');
    await this.service.archiveSharedMemo(req.params.id, req.auth.uid);
    res.status(204).end();
  });
  addEditor = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.uid) throw new HttpError(401, 'Authentication required');
    const body = editorSchema.parse(req.body);
    await this.service.addEditor(req.params.id, req.auth.uid, body.editorUserId);
    res.status(201).send('Editor added.'); // 201 Created または 204 No Content
  });
  removeEditor = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth?.uid) throw new HttpError(401, 'Authentication required');
    await this.service.removeEditor(req.params.id, req.auth.uid, req.params.editorId);
    res.status(204).end();
  });
}