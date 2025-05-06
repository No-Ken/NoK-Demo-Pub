import admin from 'firebase-admin';
import app from './app'; // Expressアプリ設定をインポート
import { lineClientConfig } from './adapters/line'; // 設定読み込み確認用

// Firebase Admin SDK の初期化
try {
    // 環境変数 GOOGLE_APPLICATION_CREDENTIALS が設定されていれば自動で読み込まれる
    admin.initializeApp({
        // credential: admin.credential.cert(require('path/to/your/serviceAccountKey.json')),
    });
    console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
    console.error('🔴 Firebase Admin SDK initialization failed:', error);
    process.exit(1);
}

// 環境変数からポート番号を取得、なければデフォルト8080
const PORT = process.env.PORT || 8080;

// サーバーを起動
const server = app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log('🟢 LINE Bot webhook server started successfully!');
  // 起動時に設定が読み込めているか簡単な確認
  if (!process.env.LINE_CHANNEL_SECRET || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      console.warn('⚠️ Warning: LINE environment variables might not be loaded correctly.');
  }
});

// Graceful Shutdown 設定
const GACEFUL_SHUTDOWN_TIMEOUT = 10000; // 10秒

const shutdown = (signal: string) => {
  console.log(`🚨 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed. Exiting process.');
    process.exit(0);
  });

  // 強制終了タイマー
  setTimeout(() => {
    console.error('🔴 Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, GACEFUL_SHUTDOWN_TIMEOUT);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT')); // Ctrl+C