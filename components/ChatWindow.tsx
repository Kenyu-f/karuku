"use client";

import { useEffect, useRef, useState } from "react";
import MathRenderer from "./MathRenderer";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

export default function ChatWindow({
  conversationId,
  onNewConversation,
}: {
  conversationId: string | null;
  onNewConversation: (id: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 会話を切り替えたら履歴を読み込む
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/history?id=${conversationId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMessages(
          data.conversation.messages.map((m: Message) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            isError: m.isError,
          }))
        );
      } catch {
        setBanner("この会話の読み込みに失敗しました。");
      }
    })();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setBanner(null);
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: "user", content: question }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, question }),
      });

      if (res.status === 401) {
        setBanner("セッションが切れました。再度ログインしてください。");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setBanner(data.error ?? "エラーが発生しました。");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: data.answer, isError: data.isError },
      ]);

      if (!conversationId) onNewConversation(data.conversationId);
      if (data.isError) setBanner("AIの応答取得に問題がありました。内容をご確認ください。");
    } catch {
      setBanner("ネットワークエラーが発生しました。接続を確認して再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {banner && (
        <div className="mx-3 mt-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm px-3 py-2">
          {banner}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">
            数学の問題や質問を入力してみましょう。途中式つきで解説します。
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] sm:max-w-[75%] rounded-2xl px-4 py-2 text-sm sm:text-base ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : m.isError
                  ? "bg-red-50 border border-red-200 text-red-700 rounded-bl-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
              }`}
            >
              {m.role === "assistant" ? <MathRenderer content={m.content} /> : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-500 animate-pulse">
              考え中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white p-3 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="例: x^2 - 5x + 6 = 0 を解いて"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white text-sm sm:text-base disabled:opacity-40 shrink-0"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
