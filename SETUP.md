# セットアップ手順（ローカル動作確認用）

このファイル一式は既存の `Kenyu-f/karuku` リポジトリに**追加・上書き**する想定です。
同名ファイルは中身をマージしてください（特に `app/layout.tsx` は既存の内容と統合が必要な場合があります）。

## 1. ファイルの配置

このzip（または個別ファイル）を、リポジトリのルート直下に展開してください。
既存の `package.json` を上書きする場合は、元々あった依存関係とマージしてください（今回は元の内容をベースに追記済みです）。

## 2. 依存パッケージのインストール

```bash
npm install
```

## 3. Tailwind typography プラグインを有効化

`tailwind.config.ts` の `plugins` 配列に追記してください:

```ts
plugins: [require("@tailwindcss/typography")],
```

## 4. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集し、以下を埋めてください:

- `NEXTAUTH_SECRET`: `openssl rand -base64 32` で生成
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`:
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials) でOAuthクライアントを作成し、
  リダイレクトURIに `http://localhost:3000/api/auth/callback/google` を登録
- `GITHUB_ID` / `GITHUB_SECRET`:
  [GitHub Developer Settings](https://github.com/settings/developers) でOAuth Appを作成し、
  Authorization callback URLに `http://localhost:3000/api/auth/callback/github` を登録
- `GEMINI_API_KEY`: [Google AI Studio](https://aistudio.google.com/apikey) で「Create API key」から発行(無料枠あり、クレジットカード登録不要)

## 5. データベース(SQLite + Prisma)の初期化

```bash
npx prisma migrate dev --name init
```

これで `prisma/dev.db` が作成され、User/Conversation/Message/QuestionHistory等のテーブルができます。

## 6. ローカルで起動

```bash
npm run dev
```

`http://localhost:3000/login` からログイン → `/chat` で数学AIチャットが使えます。

## 7. GitHubへの反映

```bash
git add .
git commit -m "AI機能・ログイン・履歴保存・数式レンダリング等を追加"
git push
```

**注意:** `.env` は `.gitignore` に含めて、APIキーやシークレットを絶対にコミットしないでください。
`prisma/dev.db` もローカル専用データなので `.gitignore` に追加することを推奨します。

## 動作確認チェックリスト

- [ ] ログイン(Google/GitHub)ができる
- [ ] 数学の質問を送るとAIが「問題の整理→方針→途中式→解答」の順で返す
- [ ] 数式が正しくレンダリングされる（$x^2$ などが崩れずに表示される）
- [ ] 一度送った質問がサイドバーの履歴に残り、クリックで再表示できる
- [ ] ブラウザの開発者ツールでスマホ幅（375px程度）にしてもレイアウトが崩れない
- [ ] `GEMINI_API_KEY` を一時的に間違った値にしてエラー時のフォールバック文言が出ることを確認
