export const LIFF_URLS = {
  WARIKAN: process.env.LIFF_WARIKAN_URL || 'https://liff.line.me/YOUR_LIFF_ID/warikan',
  SCHEDULE: process.env.LIFF_SCHEDULE_URL || 'https://liff.line.me/YOUR_LIFF_ID/schedule',
  SHARED_MEMO: process.env.LIFF_SHAREDMEMO_URL || 'https://liff.line.me/YOUR_LIFF_ID/shared-memo',
};

export const BOT_CONFIG = {
  NAME: process.env.BOT_NAME || 'AI秘書 TASK',
  USER_ID: process.env.LINE_BOT_USER_ID,
}; 