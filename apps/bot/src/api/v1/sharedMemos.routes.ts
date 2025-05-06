import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/auth.middleware';
import SharedMemoController from '../../controllers/sharedMemo.controller';

const router = Router();
const controller = new SharedMemoController();

// メモのCRUD操作
router.post('/', ensureAuthenticated, controller.createSharedMemo);
router.get('/:id', ensureAuthenticated, controller.getSharedMemoById);
router.patch('/:id', ensureAuthenticated, controller.updateSharedMemo);
router.delete('/:id', ensureAuthenticated, controller.archiveSharedMemo);

// メモ一覧
router.get('/', ensureAuthenticated, controller.listSharedMemos);

// 編集者管理
router.post('/:id/editors', ensureAuthenticated, controller.addEditor);
router.delete('/:id/editors/:editorId', ensureAuthenticated, controller.removeEditor);

// 共有メモ関連
router.post('/memos', ensureAuthenticated, controller.createMemo);
router.get('/memos', ensureAuthenticated, controller.listMemos);
router.get('/memos/:memoId', ensureAuthenticated, controller.getMemo);
router.put('/memos/:memoId', ensureAuthenticated, controller.updateMemo);
router.delete('/memos/:memoId', ensureAuthenticated, controller.deleteMemo);

// メンバー関連
router.post('/memos/:memoId/members', ensureAuthenticated, controller.addMember);
router.get('/memos/:memoId/members', ensureAuthenticated, controller.listMembers);
router.delete('/memos/:memoId/members/:userId', ensureAuthenticated, controller.removeMember);

// コメント関連
router.post('/memos/:memoId/comments', ensureAuthenticated, controller.addComment);
router.get('/memos/:memoId/comments', ensureAuthenticated, controller.listComments);
router.put('/memos/:memoId/comments/:commentId', ensureAuthenticated, controller.updateComment);
router.delete('/memos/:memoId/comments/:commentId', ensureAuthenticated, controller.deleteComment);

// 要約・処理関連
router.post('/memos/:memoId/summarize', ensureAuthenticated, controller.triggerSummarization);
router.get('/memos/:memoId/summary', ensureAuthenticated, controller.getSummary);

export default router;