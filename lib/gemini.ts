import { GoogleGenAI, Type } from "@google/genai";
import { MATH_TUTOR_SYSTEM_PROMPT } from "@/lib/prompts";
import type { AnalysisResult } from "@/lib/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type ImageInput = { mimeType: string; data: string }; // data: base64(データURLのprefixは除く)

export class AiUnavailableError extends Error {
  code: "rate_limited" | "overloaded" | "auth" | "unknown";
  constructor(code: AiUnavailableError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

// gemini-2.5-flash: 無料枠あり、画像入力(マルチモーダル)にも対応
const MODEL = "gemini-2.5-flash";
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 800;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 数学の質問(+任意で画像)をGeminiに送り、回答を取得する。
 * 画像は「直近のユーザー発言」にのみ添付する(履歴の古い画像は再送しない=トークン節約)。
 *
 * - 429(レート制限) / 503(overloaded) は指数バックオフで自動リトライ
 * - それでも失敗したら AiUnavailableError を投げる(呼び出し側でフォールバック文言を出す)
 */
export async function askMathTutor(history: ChatTurn[], image?: ImageInput): Promise<string> {
  const lastIndex = history.length - 1;

  const contents = history.map((m, idx) => {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: m.content },
    ];
    if (image && idx === lastIndex && m.role === "user") {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: MATH_TUTOR_SYSTEM_PROMPT,
          maxOutputTokens: 2500,
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new AiUnavailableError("unknown", "AIから空の応答が返されました");
      }
      return text;
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;

      if (status === 429 || status === 503) {
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        throw new AiUnavailableError(
          status === 429 ? "rate_limited" : "overloaded",
          "AIサービスが混雑しています"
        );
      }
      if (status === 401 || status === 403) {
        throw new AiUnavailableError("auth", "APIキーが無効です");
      }
      throw new AiUnavailableError("unknown", "AI呼び出し中に予期しないエラーが発生しました");
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new AiUnavailableError("unknown", "不明なエラー");
}

/**
 * ユーザーに見せる、状況別のフォールバックメッセージ。
 */
export function fallbackMessageFor(err: unknown): string {
  if (err instanceof AiUnavailableError) {
    switch (err.code) {
      case "rate_limited":
        return "現在アクセスが集中しており(無料枠の上限の可能性があります)、AIからの応答が取得できませんでした。1分ほど待ってから再度お試しください。";
      case "overloaded":
        return "AIサービスが一時的に混雑しています。少し時間をおいて再度お試しください。";
      case "auth":
        return "AI機能の設定に問題があります(GEMINI_API_KEY未設定または無効)。管理者にお問い合わせください。";
      default:
        return "AIからの応答生成中にエラーが発生しました。時間をおいて再度お試しください。";
    }
  }
  return "予期しないエラーが発生しました。時間をおいて再度お試しください。";
}

/* ────────────────────────────────────────────────── */
/* ここから: ホーム画面フロー(問題画像×解答画像の採点)用   */
/* ────────────────────────────────────────────────── */

const ANALYZE_SYSTEM_PROMPT = `
あなたは数学の解答を採点する厳密な採点者AIです。
2枚の画像が渡されます。1枚目は「問題」、2枚目は「生徒がノートに書いた解答(途中式)」です。

手順:
1. 両方の画像を読み取る(数式はLaTeXとして正確に解釈すること)。
2. 生徒の解答を、論理的なステップ(3〜6個程度、例: 式の展開/同類項の整理/移項/両辺を係数で割る/解の確認 のように、その問題に応じた粒度で自分で区切ってよい)に分解する。
3. 各ステップが数学的に正しいかを判定する。
4. 最初に誤りが見つかったステップ以降は、生徒の記述を評価せず「前ステップの誤りが伝播」のように short note を付ける。
5. 全ステップ正しければ status は "correct"、一部だけ正しく完答していなければ "partial"、
   根本的な誤りがあれば "incorrect" とする。
6. hint は、誤りがある場合は答えを直接明かさずに気づきを与える一文。全問正解の場合は次の学習に繋がる一言で良い。
7. mistake は、誤りがある場合のみ「◯行目で〜」のように具体的に。誤りがなければ null。

必ず指定されたJSONスキーマの形式のみで出力し、説明文やMarkdownは一切付けないこと。
`.trim();

function dataUrlToInline(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new AiUnavailableError("unknown", "画像データの形式が不正です");
  return { mimeType: match[1], data: match[2] };
}

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: ["correct", "incorrect", "partial"] },
    mistake: { type: Type.STRING, nullable: true },
    hint: { type: Type.STRING },
    flowchart: { type: Type.ARRAY, items: { type: Type.STRING } },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          ok: { type: Type.BOOLEAN },
          note: { type: Type.STRING, nullable: true },
        },
        required: ["label", "ok"],
      },
    },
  },
  required: ["status", "mistake", "hint", "flowchart", "steps"],
};

/**
 * 問題画像 + 解答画像(どちらも data URL)をGeminiに送り、採点結果をJSONで受け取る。
 */
export async function analyzeMathImages(
  problemImageDataUrl: string,
  answerImageDataUrl: string
): Promise<AnalysisResult> {
  const problemImg = dataUrlToInline(problemImageDataUrl);
  const answerImg = dataUrlToInline(answerImageDataUrl);

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { text: "【問題】の画像:" },
              { inlineData: { mimeType: problemImg.mimeType, data: problemImg.data } },
              { text: "【生徒の解答】の画像:" },
              { inlineData: { mimeType: answerImg.mimeType, data: answerImg.data } },
            ],
          },
        ],
        config: {
          systemInstruction: ANALYZE_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA,
          maxOutputTokens: 2000,
        },
      });

      const text = response.text?.trim();
      if (!text) throw new AiUnavailableError("unknown", "AIから空の応答が返されました");
      return JSON.parse(text) as AnalysisResult;
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if (status === 429 || status === 503) {
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        throw new AiUnavailableError(status === 429 ? "rate_limited" : "overloaded", "AIサービスが混雑しています");
      }
      if (status === 401 || status === 403) {
        throw new AiUnavailableError("auth", "APIキーが無効です");
      }
      if (err instanceof AiUnavailableError) throw err;
      throw new AiUnavailableError("unknown", "AI解析中に予期しないエラーが発生しました(JSON解析失敗の可能性)");
    }
  }
  throw lastError instanceof Error ? lastError : new AiUnavailableError("unknown", "不明なエラー");
}
