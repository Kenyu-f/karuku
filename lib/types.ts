export type AnalysisStatus = "correct" | "incorrect" | "partial";

export interface AnalysisResult {
  status: AnalysisStatus;
  mistake: string | null;
  hint: string;
  flowchart: string[];
  steps: StepDetail[];
  saved?: boolean; // ログイン済みで学習履歴に保存された場合 true
}

export interface StepDetail {
  label: string;
  ok: boolean;
  note?: string;
}

export interface SessionState {
  problemImage: string | null; // base64 data URL
  answerImage: string | null;
  result: AnalysisResult | null;
}
