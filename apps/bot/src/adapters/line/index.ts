// LINE Client の設定
import { Client } from '@line/bot-sdk';

// 環境変数から LINE 認証情報を取得
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

// LINE API クライアントのインスタンスを作成
export const lineClient = new Client(lineConfig);

// 環境変数が設定されているか確認
if (!lineConfig.channelAccessToken || !lineConfig.channelSecret) {
  console.warn('LINE API credentials are not properly configured in environment variables.');
}

export default lineClient;