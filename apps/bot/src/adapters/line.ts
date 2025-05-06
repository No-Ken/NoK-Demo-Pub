import * as dotenv from 'dotenv';
import * as path from 'path';
// モノレポルートの .env を読み込む想定
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { MiddlewareConfig, ClientConfig, middleware as createLineMiddleware, Client } from '@line/bot-sdk';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;

if (!channelAccessToken || !channelSecret) {
  console.error(
    '🔴 Error: LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET must be set in environment variables.'
  );
  process.exit(1);
}

// MiddlewareConfig には channelSecret のみ必須
export const lineMiddlewareConfig: MiddlewareConfig = {
  channelSecret: channelSecret,
};

// ClientConfig には channelAccessToken のみ必須
export const lineClientConfig: ClientConfig = {
  channelAccessToken: channelAccessToken,
};

/**
 * LINE SDK ミドルウェアインスタンス (署名検証用)
 */
export const lineMiddleware = createLineMiddleware(lineMiddlewareConfig);

/**
 * LINE SDK クライアントインスタンス (メッセージ送信等に利用)
 */
export const lineClient = new Client(lineClientConfig);

console.log('✅ LINE Adapter Initialized');