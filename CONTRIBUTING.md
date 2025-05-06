# コントリビューションガイド

TASK-MVPプロジェクトへのコントリビューションに興味をお持ちいただき、ありがとうございます！このドキュメントでは、開発に参加するための手順とガイドラインを説明します。

## 開発プロセス

1. **Issues**: バグ報告や機能リクエストは、まずIssueとして登録してください。
2. **ブランチ**: 新機能やバグ修正には必ず新しいブランチを作成してください。
3. **Pull Request**: 変更が完了したら、Pull Requestを作成してレビューを依頼してください。
4. **レビュー**: 少なくとも1名のレビュー承認が必要です。
5. **マージ**: レビュー承認後、CIテストが通過したらマージされます。

## ブランチ命名規則

* **feature/**: 新機能開発用 (例: `feature/schedule-interface`)
* **bugfix/**: バグ修正用 (例: `bugfix/date-picker-error`)
* **hotfix/**: 緊急修正用 (例: `hotfix/security-vulnerability`)
* **docs/**: ドキュメント更新用 (例: `docs/api-reference`)
* **refactor/**: リファクタリング用 (例: `refactor/message-handler`)

## コミットメッセージ規則

[Conventional Commits](https://www.conventionalcommits.org/) の形式に従ってください:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

例:
- `feat(bot): LINE Messaging API実装`
- `fix(liff): 日付選択バグを修正`
- `docs(readme): セットアップ手順を更新`
- `test(worker): Gemini APIテストを追加`

### タイプ
- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント更新
- **style**: コードスタイルの修正（ロジック変更なし）
- **refactor**: リファクタリング（機能変更なし）
- **perf**: パフォーマンス改善
- **test**: テスト追加・修正
- **chore**: ビルドプロセスや補助ツールの変更

## コーディングルール

### 言語・構文
| 項目 | ルール |
|------|--------|
| **言語** | TypeScript 5.x 以上（`.ts` / `.tsx`） |
| **ES 標準** | ECMAScript 2022（`target:"ES2022"`） |
| **モジュール解決** | `import` / `export`、パスは `@/*` エイリアス（`tsconfig paths`） |
| **非同期** | `await` 前提。Promise チェーンは禁止 |

### スタイル
| ツール | 設定 |
|-------|------|
| **ESLint** | `@typescript-eslint/recommended` をベースに、プリセット `eslint-config-airbnb-typescript/base` を継承 |
| **Prettier** | 2 space, semi = true, singleQuote = true, trailingComma = all |
| **StyleLint** | LIFF の SCSS/Tailwind 用に `stylelint-config-standard` |

### 命名規則
| 対象 | 規則 | 例 |
|------|------|----|
| 変数 | `camelCase` | `userId`, `warikanProject` |
| クラス / 型 | `PascalCase` | `WarikanService`, `ScheduleDoc` |
| 定数 | `UPPER_SNAKE_CASE` | `MAX_RPM`, `DEFAULT_TIMEOUT_MS` |
| Firestore コレクション | `camelCase複数形` | `warikanProjects`, `memoPages` |
| ファイル名 | `kebab-case.ts` / `PascalCase.tsx` (Reactコンポーネント) |

## 型定義

- TypeScriptの型システムを最大限活用し、`any` を避ける
- `interface` / `type` を適切に使い分ける
- 共有ライブラリ (`libs/types`) で Zod/TypeBox 等によるスキーマ駆動開発を推奨

## テスト

- **ユニットテスト**: Vitest を使用。新規ロジック追加時には必須
- **結合テスト**: Supertest (+ Firestore Emulator) で主要APIエンドポイント検証
- **E2Eテスト** (任意): Playwright で主要ユーザーフローをカバー

## Pull Requestテンプレート

PRを作成する際は、以下の情報を含めてください:

1. **タイトル**: Conventional Commits 形式
2. **説明**:
   - 変更内容の概要
   - 関連するIssue番号
   - 動作確認方法
   - スクリーンショットや動画 (UI変更の場合)
3. **チェックリスト**:
   - コードスタイル確認
   - テスト追加/実行
   - ドキュメント更新

## 開発環境設定

1. リポジトリをクローン: `git clone https://github.com/your-org/task-mvp.git`
2. 依存関係をインストール: `pnpm install`
3. Husky フックを有効化: `pnpm prepare`
4. 開発サーバー起動: `pnpm dev`

## 質問・ヘルプ

質問や助けが必要な場合は、Issueを作成するか、既存のDiscussionsを確認してください。

ご協力ありがとうございます！
