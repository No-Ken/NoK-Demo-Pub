# Gemini Worker

このサービスは、Cloud Tasksからのリクエストを受け取り、Gemini APIを使用してテキスト（メモなど）の要約とタグ付けを行い、結果をFirestoreに保存します。

## 機能

- Cloud Tasksからの非同期ジョブ処理
- OIDCトークン検証によるセキュリティ強化
- Gemini APIによるテキスト要約とタグ付け
- Zod検証によるGemini応答の型安全性確保
- レート制限によるAPI使用量制御（Gemini APIの無料枠に対応）
- Firestoreへの結果保存

## 環境変数

- `GEMINI_API_KEY`: Gemini APIキー
- `GCP_PROJECT`: Google Cloud Projectのプロジェクトid
- `GCP_LOCATION`: Google Cloudのロケーション（例：us-central1）
- `GEMINI_WORKER_URL`: このワーカーのCloud Run URL
- `VERIFY_OIDC`: OIDCトークン検証を有効にするかどうか（"true"/"false"）
- `WORKER_INVOKER_SA`: ワーカーを呼び出すサービスアカウントのメールアドレス
- `PORT`: サーバーポート（ローカル開発用、Cloud Runでは自動設定）

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番環境での起動
npm start
```

## デプロイ

### Cloud Runへのデプロイ例

```bash
# ビルド
npm run build

# Dockerイメージのビルド
gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/gemini-worker

# Cloud Runへのデプロイ
gcloud run deploy gemini-worker \
  --image gcr.io/[YOUR_PROJECT_ID]/gemini-worker \
  --platform managed \
  --region [REGION] \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=[YOUR_API_KEY],VERIFY_OIDC=true
```

## セキュリティ

このサービスはCloud Tasksからのリクエストのみを処理するように設計されています。OIDCトークン検証ミドルウェアにより、認証されたリクエストのみを受け付けます。

## 関連サービス

- **Producer**: `apps/bot/src/adapters/cloudTasks.adapter.ts` - Cloud Tasksにジョブをエンキューする関数
- **Firestore**: 処理結果が保存されるデータベース