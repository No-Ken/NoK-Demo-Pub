import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GoogleAuth } from 'google-auth-library';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import * as path from 'path';
import * as dotenv from 'dotenv';
// Worker 用の .env も考慮 (ルートの .env を読むか、worker ディレクトリの .env を読むか)
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Adjust path as needed

const app = express();
app.use(express.json({ limit: '1mb' })); // JSONボディパースを先に行う
// レートリミットを適用
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1分
    max: 25, // 1分あたり25リクエストまで (Gemini無料枠30RPMへの配慮)
    message: 'Too many requests, please try again later.',
    standardHeaders: true, // RFC 6585 HTTP headers (RateLimit-Limit, etc.)
    legacyHeaders: false,  // X-RateLimit-* headers
  })
);

// --- OIDC verification middleware ---
// 環境変数で検証を有効化する場合
if (process.env.VERIFY_OIDC === 'true') {
    const expectedAudience = process.env.GEMINI_WORKER_URL!;
    if (!expectedAudience) {
        console.error('🔴 Error: GEMINI_WORKER_URL must be set for OIDC verification.');
        process.exit(1);
    }
    const googleAuthClient = new GoogleAuth(); // Use GoogleAuth instance

    app.use(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authorizationHeader = req.headers.authorization || '';
            const token = authorizationHeader.startsWith('Bearer ') ? authorizationHeader.slice(7) : null;

            if (!token) {
                console.warn('⚠️ OIDC Verification: Missing token.');
                return res.status(401).send('Missing or invalid Authorization header');
            }

            // google-auth-library を使ってトークンを検証
            const ticket = await googleAuthClient.verifyIdToken({
                idToken: token,
                audience: expectedAudience,
            });

            const payload = ticket.getPayload();
            if (!payload) {
                // 通常は verifyIdToken でエラーになるはずだが念のため
                throw new Error('Failed to get payload from verified token.');
            }
            // (任意) 検証済みペイロードをリクエストオブジェクトに添付
            // (req as any).verifiedPayload = payload;
            console.log('✅ OIDC token verified successfully.');
            return next(); // 検証成功、次のミドルウェア/ハンドラへ
        } catch (err) {
            console.error('🔴 OIDC verification failed:', err);
            return res.status(401).send('Invalid or expired OIDC token');
        }
    });
    console.log('🔒 OIDC verification middleware enabled.');
} else {
    console.log('⚠️ OIDC verification is disabled (VERIFY_OIDC is not "true").');
}
// --------------------------------------

// Firestore と Gemini クライアントの初期化
// 環境変数チェックを追加
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    console.error('🔴 Error: GEMINI_API_KEY environment variable is not set.');
    process.exit(1);
}
const firestore = new Firestore(); // GCP環境では自動で認証情報が使われる
const gemini = new GoogleGenerativeAI(geminiApiKey);

// Gemini応答のZodスキーマ
const geminiRespSchema = z.object({
    summary: z.string().min(5, { message: "Summary must be at least 5 characters" }), // 文字数制限例
    tags: z.array(z.string().min(1)).max(10, { message: "Cannot exceed 10 tags" }), // タグは1文字以上、最大10個
});

// POST / ルートハンドラ (Cloud Tasks からの呼び出し)
app.post('/', async (req: Request, res: Response) => {
    console.log('Received task request'); // リクエスト受信ログ
    try {
        // ペイロードの存在チェックとデコード
        const { payload } = req.body;
        if (!payload || typeof payload !== 'string') {
            console.error('🔴 Invalid request: Missing or invalid payload.');
            return res.status(400).send('Bad Request: Invalid payload');
        }
        let job;
        try {
            job = JSON.parse(Buffer.from(payload, 'base64').toString());
            console.log(`Processing job for docPath: ${job?.docPath}`);
        } catch(e) {
            console.error('🔴 Invalid request: Failed to parse payload JSON.', e);
            return res.status(400).send('Bad Request: Cannot parse payload');
        }

        // 必須パラメータのチェック
        const { docPath, content, userId } = job;
        if (!docPath || !content || !userId || typeof docPath !== 'string' || typeof content !== 'string' || typeof userId !== 'string') {
            console.error('🔴 Invalid job data:', job);
            return res.status(400).send('Bad Request: Invalid job parameters');
        }

        // 1. Gemini Flash 呼び出し
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const prompt = [ // プロンプトを分かりやすく分離
            { role: 'system', parts: [{ text: `以下のテキストを要約し、関連するタグを5つ提案してください。結果は必ず {"summary":"要約文","tags":["タグ1", "タグ2", ...]} のJSON形式で返してください。` }] },
            { role: 'user', parts: [{ text: `テキスト:\n${content.slice(0, 20000)}` }] } // 文字数制限
        ];
        console.log(`Calling Gemini for docPath: ${docPath}`);
        const result = await model.generateContent({ contents: prompt });

        let geminiResponseText: string | undefined;
        try {
            // candidate が存在するか、text() が呼び出せるか確認
            geminiResponseText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!geminiResponseText) {
                console.error('🔴 Gemini response text is empty or invalid structure:', JSON.stringify(result?.response, null, 2));
                throw new Error('Gemini did not return valid text content.');
            }
            console.log(`Gemini raw response for ${docPath}: ${geminiResponseText}`);
        } catch (e: any) {
             console.error('🔴 Failed to get text from Gemini response:', e);
             // Gemini API 自体のエラーかもしれない (例: safety ratings)
             console.error('Gemini Full Response:', JSON.stringify(result?.response, null, 2));
             return res.status(500).send('Gemini response error');
        }

        // 応答テキストのJSONパースとZod検証
        let parsedGeminiData;
        try {
            // Geminiが ```json ... ``` のようにマークダウンで返す場合があるので除去
            const jsonString = geminiResponseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            const jsonData = JSON.parse(jsonString);
            parsedGeminiData = geminiRespSchema.parse(jsonData);
            console.log(`Successfully parsed Gemini response for ${docPath}`);
        } catch (e) {
            console.error(`🔴 Gemini JSON parse/validation failed for ${docPath}. Raw text: "${geminiResponseText}"`, e);
            return res.status(500).send('Gemini response validation error');
        }

        // 2. Firestore 書き込み (set merge: true)
        const updatePayload = {
            aiAnalysis: {
                summary: parsedGeminiData.summary,
                suggestedTags: parsedGeminiData.tags,
                updatedAt: Timestamp.now(), // Firestore Timestamp を使用
                model: 'gemini-1.5-flash-latest', // どのモデルで生成したか記録 (任意)
                status: 'completed' // 処理ステータス (任意)
            }
        };
        console.log(`Updating Firestore for ${docPath}`);
        await firestore.doc(docPath).set(updatePayload, { merge: true });
        console.log(`✅ Successfully processed and updated Firestore for ${docPath}`);

        // 3. (任意) クライアントへのPush通知など - ここでは省略

        // Cloud Tasks へ成功を伝える (2xx系ならリトライされない)
        res.status(204).end();

    } catch (err: any) {
        console.error(`🔴 Worker error processing task:`, err);
        // エラー内容に応じてリトライさせるか判断 (5xx系エラーを返す)
        res.status(500).send(`Worker failed: ${err.message}`);
    }
});

// サーバー起動
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✨ Gemini worker listening on port ${PORT}`));