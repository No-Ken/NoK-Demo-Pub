# AI秘書「TASK」(task-mvp)

[![CI Status](https://github.com/your-org/task-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/task-mvp/actions/workflows/ci.yml)
LINE上で動作するAI秘書サービス「TASK」のMVPリポジトリです。日程調整、割り勘、メモなどの機能をAIがサポートし、コミュニケーションコストの削減と生産性向上を目指します。

## ✨ 機能一覧 (MVP)

* **日程調整:** 基本的な候補日提案と投票機能
* **割り勘:** 均等割り計算、支払い記録、ゲストアクセス、LINE連携
* **個人メモ:** 3ビュー(タイムライン、構造、グラフ)、AI整理提案
* **共有メモ:** 基本的なテキスト共同編集、テンプレート(食事会、外出)

## 🚀 技術スタック

* **言語:** TypeScript
* **モノレポ:** pnpmワークスペース, Turborepo
* **バックエンド:** Node.js (Express/Fastify等), Cloud Run / Cloud Functions
* **フロントエンド (LIFF):** React, Vite
* **データベース:** Firebase Firestore
* **非同期処理:** Cloud Tasks
* **AI:** Google Gemini API
* **インフラ:** Google Cloud Platform (GCP), Terraform
* **CI/CD:** GitHub Actions, Google Cloud Build
* **型定義/バリデーション:** Zod / TypeBox (検討中)
* **テスト:** Vitest (Unit), Supertest (Integration), Playwright (E2E, 任意)
* **CSS:** SCSS, Tailwind CSS
* **フォーマッタ/リンター:** Prettier, ESLint (AirBnB base), StyleLint

## 📁 ディレクトリ構成
```
apps/
├─ bot/              … Cloud Run (Webhook)
├─ worker/           … Cloud Run Job (Gemini)
├─ liff/             … React + Vite
└─ web/ (任意)       … 公開Web UI
libs/
├─ types/            … Firestore 型・Zod スキーマ
└─ validators/       … 入力検証関数
firestore/           … セキュリティルール・インデックス定義
infra/               … Terraform/CI定義
docs/                … 追加ドキュメント/API定義
```

## 🛠️ セットアップ手順

1. **前提条件:**
   * **Node.js (v20推奨)**
   * **pnpm (v8推奨)** (`npm install -g pnpm`)
   * Docker
   * Google Cloud SDK (`gcloud` CLI)
   * Terraform CLI
   * Firebase CLI (`npm install -g firebase-tools`)
2. **リポジトリのクローン:**
   ```bash
   git clone https://github.com/your-org/task-mvp.git
   cd task-mvp
   ```
3. **依存関係のインストール:**
   ```bash
   pnpm install
   ```
4. **環境変数の設定:**
   * ルートおよび各 `apps/*` 内の `.env.example` をコピーして `.env` を作成し、必要な値を設定。
5. **Firebase/GCP設定:**
   * Firebase プロジェクトを作成し、Firestore を有効化
   * サービスアカウントキーを取得し、環境変数に設定
6. **LINE Developers設定:**
   * チャネルを作成し、Messaging API と LIFF を設定
   * チャネルアクセストークンとチャネルシークレットを取得
   * Webhook URL を設定
7. **インフラ構築 (Terraform):**
   ```bash
   cd infra/terraform
   terraform init
   terraform apply
   cd ../..
   ```
8. **Firestore設定 & ローカル開発:**
   * Firestoreルール/インデックスのデプロイ:
     ```bash
     cd firestore
     firebase deploy --only firestore:rules
     firebase deploy --only firestore:indexes
     cd ..
     ```
   * **Firestoreエミュレータの起動 (ローカル開発時):**
     ```bash
     firebase emulators:start --only firestore
     ```
   * (必要であれば Seed データ投入スクリプトを実行)

## 💻 開発コマンド (ルートディレクトリで実行)

* **ビルド:** `pnpm turbo run build`
* **開発モード起動 (例):** `pnpm turbo run dev --filter=!@task-mvp/worker...`
* **リンティング (TS/JS):** `pnpm turbo run lint`
* **リンティング (SCSS):** `pnpm turbo run lint:style` (package.jsonに定義想定)
* **フォーマットチェック:** `pnpm turbo run format:check`
* **フォーマット修正:** `pnpm turbo run format:fix`
* **ユニットテスト:** `pnpm test` (または `pnpm turbo run test`)
* **結合テスト (例):** `pnpm test:integration` (package.jsonに定義想定)

(各アプリ固有のコマンドは `apps/*/package.json` を参照)

## 🚀 デプロイ

Cloud Build を使用して GCP にデプロイします。

```bash
gcloud builds submit --config=infra/cloudbuild.yaml \
  --substitutions=_REGION=asia-northeast1,_PROJECT=$GCLOUD_PROJECT
```

また、GitHub Actions によるCI/CDも構成されています。Pull Requestに対してテストとリンティングが実行され、mainブランチへのマージ後に自動デプロイが行われます。

## 🤝 コントリビューション

コントリビューションを歓迎します！詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## 📜 ライセンス

[MIT](./LICENSE)
