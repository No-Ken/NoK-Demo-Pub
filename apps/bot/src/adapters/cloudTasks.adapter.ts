import { CloudTasksClient } from '@google-cloud/tasks';
import { Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';
import * as dotenv from 'dotenv';
// ルートの .env を読み込む想定 (パスは要確認)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const tasksClient = new CloudTasksClient();
const parentQueuePath = tasksClient.queuePath(
    process.env.GCP_PROJECT!,
    process.env.GCP_LOCATION!,
    'gemini-queue' // Terraform等で作成するキュー名
);
const workerUrl = process.env.GEMINI_WORKER_URL!;
const invokerServiceAccount = process.env.WORKER_INVOKER_SA!;

if (!workerUrl || !invokerServiceAccount || !process.env.GCP_PROJECT || !process.env.GCP_LOCATION) {
    console.error("🔴 Error: GCP Project/Location, Worker URL, and Invoker SA must be configured for Cloud Tasks.");
    // エラー処理: ここでプロセスを終了するか、設定がない場合は機能を無効にするかなど
    // process.exit(1); // または throw new Error(...)
}

export interface GeminiJobParams {
    docPath: string;      // e.g. "personalMemos/abc" or "sharedMemos/xyz"
    content: string;      // raw markdown/text to summarise
    userId: string;       // who will receive summarised result (for potential notification)
}

/**
 * Enqueue a Gemini summarisation job for a memo.
 */
export async function enqueueGeminiJob(params: GeminiJobParams): Promise<string | null | undefined> {
    // 環境変数が不足している場合はエンキューしない (上のチェックで早期リターンも可)
    if (!workerUrl || !invokerServiceAccount || !parentQueuePath) {
        console.warn("⚠️ Cloud Tasks configuration missing, skipping enqueue Gemini job.");
        return;
    }

    const payload = Buffer.from(JSON.stringify(params)).toString('base64');
    const taskPayload = { payload }; // Worker が期待する { payload: '...' } 形式

    try {
        const [response] = await tasksClient.createTask({
            parent: parentQueuePath,
            task: {
                scheduleTime: { seconds: Timestamp.now().seconds + 30 }, // 30秒遅延
                httpRequest: {
                    url: workerUrl,
                    httpMethod: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: Buffer.from(JSON.stringify(taskPayload)).toString('base64'),
                    oidcToken: {
                        serviceAccountEmail: invokerServiceAccount,
                    },
                },
            },
        });
        console.log(`✅ Task ${response.name} enqueued for doc: ${params.docPath}`);
        return response.name; // 作成されたタスク名を返す (任意)
    } catch (error) {
        console.error(`🔴 Failed to enqueue Gemini job for ${params.docPath}:`, error);
        // エラーハンドリング: リトライするか、エラーを記録するかなど
        throw error; // 必要なら呼び出し元にエラーを伝える
    }
}