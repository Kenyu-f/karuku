import { GoogleGenAI } from "@google/genai";
import { MATH_TUTOR_SYSTEM_PROMPT } from "@/lib/prompts";

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
