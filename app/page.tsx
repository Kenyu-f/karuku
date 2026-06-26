"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import Flowchart from "@/components/Flowchart";
import StepList from "@/components/StepList";
import ImageUploader from "@/components/ImageUploader";
import Header from "@/components/Header";

type Screen = "home" | "problem" | "answer" | "analyzing" | "result";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [problemImage, setProblemImage] = useState<string | null>(null);
  const [answerImage, setAnswerImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    if (!problemImage || !answerImage) return;
    setScreen("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemImage, answerImage }),
      });
      if (!res.ok) throw new Error("解析リクエストが失敗しました");
      const data: AnalysisResult = await res.json();
      setResult(data);
      setScreen("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
      setScreen("answer");
    }
  }

  function reset() {
    setProblemImage(null);
    setAnswerImage(null);
    setResult(null);
    setError(null);
    setScreen("home");
  }

  return (
    <div className="flex flex-col flex-1">
      {screen === "home" && (
        <HomeScreen onStart={() => setScreen("problem")} />
      )}
      {screen === "problem" && (
        <UploadScreen
          title="① 問題を選択"
          subtitle="数学の問題が写った画像を選んでください"
          image={problemImage}
          onImage={setProblemImage}
          onNext={() => setScreen("answer")}
          onBack={reset}
          nextLabel="次へ → 解答を選択"
        />
      )}
      {screen === "answer" && (
        <UploadScreen
          title="② 解答を選択"
          subtitle="ノートに書いた解答の画像を選んでください"
          image={answerImage}
          onImage={setAnswerImage}
          onNext={runAnalysis}
          onBack={() => setScreen("problem")}
          nextLabel="AIに解析させる"
          error={error}
        />
      )}
      {screen === "analyzing" && <AnalyzingScreen />}
      {screen === "result" && result && (
        <ResultScreen result={result} onReset={reset} />
      )}
    </div>
  );
}

/* ── Home ─────────────────────────────────────────── */
function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
            <text x="7" y="33" fontSize="28" fontFamily="serif" fill="white">∫</text>
            <circle cx="34" cy="10" r="8" fill="#60a5fa" />
            <path d="M30 10L34 14L39 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">MathCheck</h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            写真を撮るだけで<br />AIが途中式の誤りを発見します
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {["計算ミス検出", "別解提示", "段階的ヒント", "解答フロー可視化"].map((f) => (
          <span key={f} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
            {f}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full max-w-xs py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-2xl shadow-md shadow-blue-200 transition-all duration-150 text-base"
      >
        問題を選択する →
      </button>

      <p className="text-xs text-slate-400">画像はサーバーに保存されません</p>
    </div>
  );
}

/* ── Upload (problem & answer) ────────────────────── */
function UploadScreen({
  title, subtitle, image, onImage, onNext, onBack, nextLabel, error,
}: {
  title: string;
  subtitle: string;
  image: string | null;
  onImage: (src: string) => void;
  onNext: () => void;
  onBack: () => void;
  nextLabel: string;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col flex-1">
      <Header title={title} onBack={onBack} />
      <div className="flex flex-col flex-1 gap-4 p-5">
        <p className="text-sm text-slate-500">{subtitle}</p>
        <ImageUploader image={image} onImage={onImage} />
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}
        <div className="mt-auto">
          <button
            type="button"
            disabled={!image}
            onClick={onNext}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold rounded-2xl transition-colors duration-150 text-base"
          >
            {nextLabel}
          </button>
          {!image && (
            <p className="text-xs text-slate-400 text-center mt-2">画像を選択すると次へ進めます</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Analyzing ────────────────────────────────────── */
function AnalyzingScreen() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-6 p-8">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl select-none">∫</div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-800">AIが解析中…</p>
        <p className="text-sm text-slate-400 mt-1">途中式を読み取っています</p>
      </div>
    </div>
  );
}

/* ── Result ───────────────────────────────────────── */
function ResultScreen({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const statusConfig = {
    correct:   { label: "正解",   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "✓" },
    partial:   { label: "部分正解", bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  icon: "△" },
    incorrect: { label: "不正解", bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     icon: "✗" },
  }[result.status];

  return (
    <div className="flex flex-col flex-1">
      <Header title="解析結果" showBack={false} />
      <div className="flex flex-col gap-4 p-5 pb-8 overflow-y-auto">

        {/* Status */}
        <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${statusConfig.bg} ${statusConfig.border}`}>
          <span className={`text-xl font-bold mt-0.5 ${statusConfig.text}`}>{statusConfig.icon}</span>
          <div>
            <p className={`font-bold ${statusConfig.text}`}>{statusConfig.label}</p>
            {result.mistake && (
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{result.mistake}</p>
            )}
          </div>
        </div>

        {/* Hint */}
        <Section title="💡 ヒント">
          <p className="text-sm text-slate-700 leading-relaxed">{result.hint}</p>
        </Section>

        {/* Flowchart */}
        <Section title="📊 解答フロー">
          <Flowchart steps={result.flowchart} stepDetails={result.steps} />
        </Section>

        {/* Step detail */}
        <Section title="🔍 ステップ詳細">
          <StepList steps={result.steps} />
        </Section>

        <button
          type="button"
          onClick={onReset}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-2xl transition-all duration-150"
        >
          もう一度解析する
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <h2 className="font-semibold text-slate-700 mb-3 text-sm">{title}</h2>
      {children}
    </div>
  );
}
