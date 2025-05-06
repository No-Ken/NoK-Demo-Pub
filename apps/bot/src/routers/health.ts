import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    service: 'task-bot',
    version: process.env.npm_package_version || 'dev'
  });
});

export const healthRouter = router;
