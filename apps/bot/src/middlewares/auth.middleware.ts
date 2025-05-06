// 認証ミドルウェア
import type { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { HttpError } from '../errors/httpErrors';
import { logger } from '../utils/logger';

/**
 * Firebase Auth ID トークンを検証し、認証済みユーザーか確認する Express ミドルウェア
 *
 * - Authorization ヘッダーから Bearer トークンを取得します。
 * - Firebase Admin SDK を使用して ID トークンを検証します。
 * - 検証に成功した場合、デコードされたトークン情報 (DecodedIdToken) を
 * `req.auth` に格納し、次のミドルウェアまたはルートハンドラを呼び出します。
 * - トークンがない、形式が不正、無効、または期限切れの場合は 401 Unauthorized エラーを返します。
 *
 * @throws {HttpError(401)} 認証に失敗した場合
 */
export const ensureAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authorizationHeader = req.headers.authorization;

  // 1. Authorization ヘッダーと Bearer トークンの存在・形式チェック
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    logger?.warn('Auth Middleware: Missing or invalid Authorization header format.');
    return next(new HttpError(401, 'Unauthorized: Missing or invalid token format.'));
  }

  // 2. トークン文字列の抽出
  const idToken = authorizationHeader.split('Bearer ')[1];
  if (!idToken) {
    logger?.warn('Auth Middleware: Token string is empty.');
    return next(new HttpError(401, 'Unauthorized: Token not provided.'));
  }

  // 3. Firebase Admin SDK によるトークン検証
  try {
    // IDトークンを検証
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 4. 検証成功: デコードされた情報を req.auth に格納
    req.auth = decodedToken;
    logger?.info(`Authenticated user: ${decodedToken.uid}`);

    // 5. 次の処理へ
    next();

  } catch (error: any) {
    // 6. 検証失敗: エラーログを出力し、401エラーを返す
    let errorMessage = 'Invalid or expired token.';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token has expired.';
    }
    logger?.error(`Auth Middleware: Failed to verify ID token - ${error.code || 'Unknown error'}`, error.message);
    return next(new HttpError(401, `Unauthorized: ${errorMessage}`));
  }
};

// 特定のロールを持つユーザーのみアクセスを許可するミドルウェア
export const ensureRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 認証済みかチェック
      if (!req.auth?.uid) {
        throw new HttpError(401, 'Authentication required');
      }

      // ユーザー情報取得（Firestoreなどから）
      // const userDoc = await getUserById(req.auth.uid);
      
      // ロールチェック
      // if (!userDoc.roles || !allowedRoles.some(role => userDoc.roles.includes(role))) {
      //   throw new HttpError(403, 'You do not have permission to access this resource');
      // }

      next();
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
};

// Express の Request 型拡張
declare global {
  namespace Express {
    interface Request {
      auth?: {
        uid: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}