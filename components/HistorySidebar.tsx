"use client";

import { useEffect, useState } from "react";

type ConversationSummary = { id: string; title: string; updatedAt: string };

export default function HistorySidebar({
  selectedId,
  onSelect,
  refreshKey,
  onCloseMobile,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  refreshKey: number;
  onCloseMobile?: () => void;
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/history");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setConversations(data.conversations ?? []);
      } catch {
        setError("履歴を取得できませんでした。");
      }
    })();
  }, [refreshKey]);

  return (
    <div className="flex h-full flex-col bg-gray-50 border-r">
      <div className="px-4 py-3 font-semibold text-gray-700 border-b flex items-center justify-between">
        質問履歴
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="sm:hidden text-gray-400" aria-label="閉じる">
            ✕
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {error && <p className="p-4 text-sm text-red-500">{error}</p>}
        {conversations.length === 0 && !error && (
          <p className="p-4 text-sm text-gray-400">まだ会話がありません。</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              onSelect(c.id);
              onCloseMobile?.();
            }}
            className={`block w-full text-left px-4 py-3 text-sm border-b hover:bg-gray-100 truncate ${
              selectedId === c.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          onSelect("");
          onCloseMobile?.();
        }}
        className="m-3 rounded-lg bg-indigo-600 text-white text-sm py-2"
      >
        + 新しい質問
      </button>
    </div>
  );
}
