"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Flowchart from "@/components/Flowchart";
import StepList from "@/components/StepList";
import type { RecordSummary } from "@/app/api/records/route";

const STATUS_CONFIG = {
  correct: { label: "正解", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "✓" },
  partial: { label: "部分正解", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "△" },
  incorrect: { label: "不正解", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "✗" },
} as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function HistoryPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [records, setRecords] = useState<RecordSummary[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch("/api/records");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setRecords(data.records);
      } catch {
        setError("履歴の取得に失敗しました。");
      }
    })();
  }, [session]);

  if (sessionStatus === "loading") {
    return <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">読み込み中...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="学習履歴" showBack={false} />
        <div className="flex flex-col flex-1 items-center justify-center gap-4 p-8 text-center">
          <p className="text-sm text-slate-500">学習履歴を見るにはログインしてください</p>
          <button
            onClick={() => signIn()}
            className="rounded-xl bg-blue-600 px-5 py-2 text-white text-sm font-semibold"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="学習履歴" showBack={false} />
      <div className="flex flex-col gap-3 p-5 pb-8 overflow-y-auto">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {records === null && !error && (
          <p className="text-sm text-slate-400 text-center mt-8">読み込み中...</p>
        )}

        {records?.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-8">
            まだ履歴がありません。問題を解析すると、ここに記録されます。
          </p>
        )}

        {records?.map((r) => {
          const cfg = STATUS_CONFIG[r.status];
          const isOpen = openId === r.id;
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : r.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                  {cfg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(r.createdAt)}</p>
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M4 6L8 10L12 6" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 flex flex-col gap-4 border-t border-slate-50 pt-3">
                  {r.mistake && (
                    <p className="text-sm text-slate-600 leading-relaxed">{r.mistake}</p>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2 text-xs">💡 ヒント</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{r.hint}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2 text-xs">📊 解答フロー</h3>
                    <Flowchart steps={r.flowchart} stepDetails={r.steps} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2 text-xs">🔍 ステップ詳細</h3>
                    <StepList steps={r.steps} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Link
          href="/"
          className="mt-4 text-center text-sm text-blue-600 font-medium"
        >
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
