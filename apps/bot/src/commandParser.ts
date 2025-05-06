// apps/bot/src/index.ts
// S3‑rev3 – Webhook (mentions only) + 外部パーサー採用
// ───────────────────────────────────────────
// このファイルは I/O に徹し、コマンド解析は services/commandParser に委譲する
// ───────────────────────────────────────────

import express from 'express';
import * as line from '@line/bot-sdk';
import dotenv from 'dotenv';
import { parseMentionCommand, ParsedCommand } from './services/commandParser';

dotenv.config();

const {
  LINE_CHANNEL_SECRET,
  LINE_CHANNEL_ACCESS_TOKEN,
  BOT_USER_ID, // 公式アカウントの userId
  PORT = '8080',
} = process.env;

if (!LINE_CHANNEL_SECRET || !LINE_CHANNEL_ACCESS_TOKEN || !BOT_USER_ID) {
  // eslint-disable-next-line no-console
  console.error('❌ Missing LINE env vars (secret / token / bot user id)');
  process.exit(1);
}

const lineConfig: line.ClientConfig = {
  channelSecret: LINE_CHANNEL_SECRET,
  channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
};
const lineClient = new line.Client(lineConfig);
const lineMiddleware = line.middleware(lineConfig);

/** ****************************************
 * Dispatcher – 文脈判断とハンドオフ
 *****************************************/
async function dispatchCommand(ev: line.MessageEvent, cmd: ParsedCommand) {
  // 今はダミー応答。コマンド種別に応じてサービス層を呼び出す予定
  const message: line.TextMessage = {
    type: 'text',
    text: `📌 Command: ${cmd.type}\nArgs: ${cmd.args ?? '(none)'}`,
  };
  await lineClient.replyMessage(ev.replyToken, message);
}

/** ****************************************
 * Express + Webhook
 *****************************************/
const app = express();
app.get('/health', (_, res) => res.status(200).send('ok'));

app.post('/webhook', lineMiddleware, async (req, res) => {
  res.status(200).end();
  const events = req.body.events as line.WebhookEvent[];

  for (const ev of events) {
    if (ev.type !== 'message' || ev.message.type !== 'text') continue;

    // === ① メンション判定 ===
    const isDm = ev.source.type === 'user';
    const mentionees = (ev.message as line.TextMessage).mention?.mentionees;
    const isMentioned = mentionees?.some((m) => m.userId === BOT_USER_ID) ?? false;
    if (!isDm && !isMentioned) continue; // グループ / ルームはメンション必須

    // === ② メンション文字列除去 ===
    let plainText = ev.message.text;
    if (isMentioned && mentionees) {
      mentionees.forEach((m) => {
        if (m.userId === BOT_USER_ID) {
          plainText = plainText.slice(0, m.index) + plainText.slice(m.index + m.length);
        }
      });
    }

    // === ③ コマンド解析（状態非依存） ===
    const parsed = parseMentionCommand(plainText.trim());

    // === ④ dispatch ===
    try {
      await dispatchCommand(ev, parsed);
    } catch (err) {
      console.error('❌ dispatch error', err);
    }
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`🟢 Bot listening on :${PORT}`);
});

export default app;
