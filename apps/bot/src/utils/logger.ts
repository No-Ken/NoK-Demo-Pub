// ロガーの定義
import { createLogger, format, transports } from 'winston';

// ロガーインターフェース
export interface AppLogger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// ウィンストンフォーマッター
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// 環境変数からログレベルを取得
const logLevel = process.env.LOG_LEVEL || 'info';

// ロガーインスタンスの作成
const logger = createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'task-bot' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(info => {
          const { timestamp, level, message, ...rest } = info;
          return `${timestamp} ${level}: ${message} ${
            Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''
          }`;
        })
      ),
    }),
    // 必要に応じてファイルトランスポートも追加可能
    // new transports.File({ filename: 'error.log', level: 'error' }),
    // new transports.File({ filename: 'combined.log' }),
  ],
});

// ロガーの取得関数
export function getLogger(context?: string): AppLogger {
  if (context) {
    return logger.child({ context });
  }
  return logger;
}

export default logger;