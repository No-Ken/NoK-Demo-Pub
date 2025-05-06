import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/auth.middleware';
import PersonalMemoController from '../../controllers/personalMemo.controller';

const router = Router();
const controller = new PersonalMemoController();

// 個人メモ関連
router.post('/memos', ensureAuthenticated, controller.createMemo);
router.get('/memos', ensureAuthenticated, controller.listMemos);
router.get('/memos/:memoId', ensureAuthenticated, controller.getMemo);
router.put('/memos/:memoId', ensureAuthenticated, controller.updateMemo);
router.delete('/memos/:memoId', ensureAuthenticated, controller.deleteMemo);

// タグ関連
router.post('/memos/:memoId/tags', ensureAuthenticated, controller.addTag);
router.get('/memos/:memoId/tags', ensureAuthenticated, controller.listTags);
router.delete('/memos/:memoId/tags/:tagId', ensureAuthenticated, controller.removeTag);

// 検索・フィルタリング
router.get('/memos/search', ensureAuthenticated, controller.searchMemos);
router.get('/memos/by-tag/:tagId', ensureAuthenticated, controller.getMemosByTag);

export default router;