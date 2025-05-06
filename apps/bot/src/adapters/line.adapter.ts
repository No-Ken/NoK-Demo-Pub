import { lineClient, lineClientConfig } from './line';
import axios from 'axios';
import type { AppLogger } from '../utils/logger';
import { HttpError, UnauthorizedError } from '../errors/httpErrors';
// (Loggerインスタンスを取得する仕組みが必要)
// const logger: AppLogger = getLogger();

const LINE_VERIFY_API_URL = 'https://api.line.me/oauth2/v2.1/verify';

interface LineVerifyResponse {
    scope: string;
    client_id: string;
    expires_in: number;
}

interface LineVerifyErrorResponse {
    error: string;
    error_description: string;
}

export default class LineAdapter {
    /**
     * 指定されたグループIDのメンバーユーザーIDリストを取得する
     * @param groupId - グループID
     * @param logger - (任意) ログ出力用
     * @returns メンバーのLINE User IDの配列
     * @throws エラーが発生した場合 (例: Botがグループにいない、APIエラー)
     */
    async getGroupMemberIds(groupId: string, logger?: AppLogger): Promise<string[]> {
        logger?.info(`Workspaceing group members for: ${groupId}`);
        try {
            // 注意: このAPIを呼び出すには、Botが対象グループに参加している必要があります
            const memberIds = await lineClient.getGroupMemberIds(groupId);
            logger?.info(`Found ${memberIds?.length ?? 0} members for group ${groupId}.`);
            return memberIds ?? []; // API仕様によりnullが返る可能性も考慮
        } catch (error: any) {
            logger?.error(`LINE API Error in getGroupMemberIds for ${groupId}:`, {
                status: error.statusCode,
                message: error.statusMessage || error.message,
                // errorData: error.originalError?.response?.data // 詳細なエラー情報
            });
            // エラーの種類に応じて処理を分ける
            if (error.statusCode === 404) {
                // Botがグループにいない、またはグループが存在しない可能性
                throw new Error(`Group not found or Bot is not a member: ${groupId}`);
            } else if (error.statusCode === 403) {
                // 権限不足の可能性
                throw new Error(`Permission denied to get members for group ${groupId}.`);
            }
            // その他のAPIエラー
            throw new Error(`Failed to get group members from LINE API: ${error.statusMessage || error.message}`);
        }
    }

    async verifyLineAccessToken(accessToken: string, logger?: AppLogger): Promise<string> {
        logger?.debug(`[LineAdapter] Verifying LINE Access Token...`);
        if (!accessToken) {
            throw new UnauthorizedError('LINE Access Token is missing.');
        }
        try {
            const response = await axios.get<LineVerifyResponse>(LINE_VERIFY_API_URL, {
                params: { access_token: accessToken },
            });

            if (response.status !== 200 || !response.data?.client_id) {
                throw new Error('Verification failed with unexpected response.');
            }

            logger?.debug(`[LineAdapter] Token verified for client: ${response.data.client_id}. Getting profile...`);
            const profile = await lineClient.getProfile(accessToken);
            logger?.info(`[LineAdapter] Access token verified successfully for user: ${profile.userId}`);
            return profile.userId;

        } catch (error: any) {
            logger?.error(`[LineAdapter] Failed to verify LINE Access Token:`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data as LineVerifyErrorResponse;
                throw new UnauthorizedError(`LINE Token Verification Failed: ${errorData?.error_description || error.response.statusText}`);
            }
            throw new HttpError(500, `Failed to communicate with LINE API: ${error.message}`);
        }
    }

    // 他のLINE API連携メソッド...
}