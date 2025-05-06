import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express'; // type-only import
import rootRouter from './routers';
import { SignatureValidationFailed, JSONParseError } from '@line/bot-sdk';
import { HttpError } from './errors/httpErrors';

const app: Express = express();

// --- ミドルウェア設定 ---
// (express.json() 等は lineMiddleware が処理するため不要)

// --- ルーター設定 ---
app.use('/', rootRouter);

// --- エラーハンドリング ---
// 404 Not Found
app.use((req: Request, res: Response) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).send({ error: 'Not Found' }); // JSON形式で返す例
});

// グローバルエラーハンドラ
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('🔴 Unhandled Error:', err);

  if (err instanceof SignatureValidationFailed) {
    res.status(401).send({ error: 'Invalid signature' });
    return;
  }

  if (err instanceof JSONParseError) {
    // @line/bot-sdk v8 からは middleware がエラーを投げる場合がある
    res.status(400).send({ error: 'Invalid request body' });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).send({ error: err.message });
    return;
  }

  // その他の予期せぬエラー
  // TODO: エラーの種別に応じてステータスコードやレスポンスを変える
  res.status(500).send({ error: 'Internal Server Error' });
});

export default app;