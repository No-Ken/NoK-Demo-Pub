import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/auth.middleware';
import WarikanController from '../../controllers/warikan.controller';

const router = Router();
const controller = new WarikanController();

// プロジェクト関連
router.post('/projects', ensureAuthenticated, controller.createProject);
router.get('/projects', ensureAuthenticated, controller.listProjects);
router.get('/projects/:projectId', ensureAuthenticated, controller.getProject);
router.put('/projects/:projectId', ensureAuthenticated, controller.updateProject);
router.delete('/projects/:projectId', ensureAuthenticated, controller.deleteProject);

// 支払い関連
router.post('/projects/:projectId/payments', ensureAuthenticated, controller.addPayment);
router.get('/projects/:projectId/payments', ensureAuthenticated, controller.listPayments);
router.put('/projects/:projectId/payments/:paymentId', ensureAuthenticated, controller.updatePayment);
router.delete('/projects/:projectId/payments/:paymentId', ensureAuthenticated, controller.deletePayment);

// 精算関連
router.post('/projects/:projectId/settlements', ensureAuthenticated, controller.calculateSettlements);
router.get('/projects/:projectId/settlements', ensureAuthenticated, controller.getSettlements);

export default router;