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

## 8. 【今回追加】画像アップロード機能について

`hasImage`カラムを`Message`テーブルに追加したので、既にDBを作成済みの場合は再度マイグレーションが必要です。

```bash
npx prisma migrate dev --name add_has_image
```

チャット画面下部の 📷 ボタンから、数式・途中式の写真を撮影またはファイル選択できます。
- 画像のみ送信/画像+コメント送信のどちらも可能です。
- 画像そのものはDBに保存されません(プライバシー・容量の観点から、「添付した」という事実だけを記録します)。会話を読み込み直すと、AIの回答テキストは残りますが画像プレビューは表示されません(必要なら再送してください)。
- 手書きの途中式を送ると、AIが1ステップずつ検証し、最初に見つかった誤りを指摘・修正するか、全て正しければ「正しい」と判定します。

## 動作確認チェックリスト(追加分)

- [ ] 📷ボタンから画像を選択すると、送信欄にプレビューが出る
- [ ] 画像だけを送信できる(コメントなしでもOK)
- [ ] 手書きで意図的に間違えた途中式の画像を送ると、正しい判定(誤りありの指摘)が返る
- [ ] 正しい途中式の画像を送ると「正しい」という判定が返る
- [ ] 数学の質問を送るとAIが「問題の整理→方針→途中式→解答」の順で返す
- [ ] 数式が正しくレンダリングされる（$x^2$ などが崩れずに表示される）
- [ ] 一度送った質問がサイドバーの履歴に残り、クリックで再表示できる
- [ ] ブラウザの開発者ツールでスマホ幅（375px程度）にしてもレイアウトが崩れない
- [ ] `GEMINI_API_KEY` を一時的に間違った値にしてエラー時のフォールバック文言が出ることを確認
