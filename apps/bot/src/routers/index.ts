import { Router } from 'express';
import webhookRouter from './webhook';
import healthRouter from './health';
import warikanRoutes from '../api/v1/warikan.routes';
import scheduleRoutes from '../api/v1/schedules.routes';
import personalMemoRoutes from '../api/v1/personalMemos.routes';

const router = Router();

// ヘルスチェック
router.use('/health', healthRouter);

// LINE Webhook
router.use('/webhook', webhookRouter);

// API routes
router.use('/api/v1/warikan', warikanRoutes);
router.use('/api/v1/schedules', scheduleRoutes);
router.use('/api/v1/personal-memos', personalMemoRoutes);

export default router;