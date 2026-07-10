"use client";

import { useEffect, useRef, useState } from "react";
import MathRenderer from "./MathRenderer";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  imagePreviewUrl?: string; // 表示用(このセッション内のみ。DBには保存していない)
};

function fileToBase64(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // "data:image/png;base64,xxxx"
      const [, data] = result.split(",");
      resolve({ mimeType: file.type, data });
    };
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}

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
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBanner("画像ファイルを選択してください。");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBanner("画像サイズが大きすぎます(5MB以下にしてください)。");
      return;
    }
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
    e.target.value = ""; // 同じファイルを連続選択できるようにリセット
  }

  function clearPendingImage() {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  }

  async function handleSend() {
    const question = input.trim();
    if ((!question && !pendingImage) || loading) return;

    setBanner(null);
    setLoading(true);

    const imageToSend = pendingImage;
    setInput("");
    setPendingImage(null);

    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        role: "user",
        content: question || "(画像を送信)",
        imagePreviewUrl: imageToSend?.previewUrl,
      },
    ]);

    try {
      let imagePayload: { mimeType: string; data: string } | undefined;
      if (imageToSend) {
        imagePayload = await fileToBase64(imageToSend.file);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, question, image: imagePayload }),
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
            数学の問題を入力するか、途中式を撮影してアップロードしてください。
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
              {m.imagePreviewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.imagePreviewUrl}
                  alt="添付した画像"
                  className="mb-2 max-h-48 rounded-lg border border-white/30"
                />
              )}
              {m.role === "assistant" ? <MathRenderer content={m.content} /> : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-500 animate-pulse">
              解析中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white p-3 pb-[env(safe-area-inset-bottom)]">
        {pendingImage && (
          <div className="mb-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingImage.previewUrl} alt="選択した画像" className="h-14 w-14 rounded-lg object-cover border" />
            <button onClick={clearPendingImage} className="text-xs text-red-500 underline">
              画像を削除
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="画像を撮影・選択"
            className="shrink-0 rounded-xl border border-gray-300 px-3 py-2 text-lg"
          >
            📷
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="例: x^2 - 5x + 6 = 0 を解いて(または画像だけでもOK)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && !pendingImage)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white text-sm sm:text-base disabled:opacity-40 shrink-0"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
