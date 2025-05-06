/**
 * HTTPエラーを表す基底クラス
 */
export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

/**
 * 400 Bad Request エラー
 */
export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

/**
 * ★ 400 Bad Request (Validation Failed) エラー
 * Zodなどのバリデーションエラー時に使用
 */
export class ValidationError extends BadRequestError {
    // public readonly issues?: z.ZodIssue[]; // Zodのissuesを保持する場合
    constructor(message = 'Validation Failed' /*, issues?: z.ZodIssue[]*/) {
        super(message);
        // this.issues = issues;
    }
}

/**
 * 401 Unauthorized エラー
 */
export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

/**
 * 403 Forbidden エラー
 */
export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

/**
 * 404 Not Found エラー
 */
export class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

/**
 * 500 Internal Server Error エラー
 */
export class InternalServerError extends HttpError {
    constructor(message = 'Internal Server Error') {
        super(500, message);
    }
}

// 409 Conflict
export class ConflictError extends HttpError {
  constructor(message = 'Resource conflict') {
    super(409, message);
  }
}

// その他必要に応じて追加...