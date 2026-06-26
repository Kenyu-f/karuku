export type AnalysisStatus = "correct" | "incorrect" | "partial";

export interface AnalysisResult {
  status: AnalysisStatus;
  mistake: string | null;
  hint: string;
  flowchart: string[];
  steps: StepDetail[];
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
