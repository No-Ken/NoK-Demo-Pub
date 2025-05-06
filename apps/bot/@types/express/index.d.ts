// firebase-admin の型定義から DecodedIdToken をインポート
import type { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      // ★ auth プロパティを追加し、型を DecodedIdToken または undefined とする
      auth?: DecodedIdToken;
    }
  }
}

// モジュールとして認識させるための export {}
export {}; 