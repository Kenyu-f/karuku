import type { AnalysisResult } from "./types";

/** Replace this function with a real OpenAI call when ready. */
export async function analyzeImages(
  _problemBase64: string,
  _answerBase64: string
): Promise<AnalysisResult> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 2000));

  return {
    status: "incorrect",
    mistake: "3行目で符号が逆転しています。 −(x − 2) を展開する際に +2 が −2 になっています。",
    hint: "括弧の前にマイナスがある場合、括弧内の全ての項の符号を反転させてください。例: −(x − 2) = −x + 2",
    flowchart: ["式の展開", "同類項の整理", "移項", "両辺を係数で割る", "解の確認"],
    steps: [
      { label: "式の展開", ok: true },
      { label: "同類項の整理", ok: false, note: "符号ミス" },
      { label: "移項", ok: false, note: "前ステップの誤りが伝播" },
      { label: "両辺を係数で割る", ok: false },
      { label: "解の確認", ok: false },
    ],
  };
}
