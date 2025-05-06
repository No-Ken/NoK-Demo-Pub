import admin from 'firebase-admin';
import LineAdapter from '../adapters/line.adapter';
import { UnauthorizedError, InternalServerError, HttpError } from '../errors/httpErrors';
import type { AppLogger } from '../utils/logger';

export default class AuthService {
  private lineAdapter = new LineAdapter();

  async createFirebaseCustomToken(lineAccessToken: string): Promise<string> {
    try {
      const lineUserId = await this.lineAdapter.verifyLineAccessToken(lineAccessToken);

      const firebaseCustomToken = await admin.auth().createCustomToken(lineUserId);

      return firebaseCustomToken;

    } catch (error: any) {
      if (error instanceof UnauthorizedError || error instanceof HttpError) {
        throw error;
      }
      throw new InternalServerError(`Failed to create Firebase custom token: ${error.message}`);
    }
  }
} 