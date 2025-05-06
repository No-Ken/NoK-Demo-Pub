import axios from 'axios';
import { getAuth, User } from 'firebase/auth';
import { firebaseApp } from '../firebase';

// ロガーの設定（仮実装）
const logger = {
  debug: (message: string, ...args: any[]) => console.debug(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args),
  warn: (message: string, ...args: any[]) => console.warn(message, ...args),
};

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター: 認証トークンをヘッダーに自動付与
apiClient.interceptors.request.use(
  async (config) => {
    const auth = getAuth(firebaseApp);
    const user: User | null = auth.currentUser;

    if (user) {
      try {
        const idToken = await user.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
        logger.debug('[Axios Interceptor] Attaching ID token to request header.');
      } catch (error) {
        logger.error('[Axios Interceptor] Failed to get ID token:', error);
      }
    } else {
      logger.warn('[Axios Interceptor] No authenticated user found for API request.');
    }
    return config;
  },
  (error) => {
    logger.error('[Axios Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター: 共通エラー処理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('[Axios Interceptor] API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      // TODO: 認証エラー時の処理（ログアウトなど）
    }
    return Promise.reject(error);
  }
);

export default apiClient; 