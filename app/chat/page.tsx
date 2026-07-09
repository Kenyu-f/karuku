"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import ChatWindow from "@/components/ChatWindow";
import HistorySidebar from "@/components/HistorySidebar";

// このアプリは layout.tsx で max-w-md (スマホ幅) に固定されているため、
// PC/スマホ問わず「常時ドロワー」で統一する(横に並べるスペースが無いため)。
export default function ChatPage() {
  const { data: session, status } = useSession();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") {
    return <div className="flex flex-1 items-center justify-center text-gray-400">読み込み中...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-lg font-semibold">ログインしてください</h1>
        <button onClick={() => signIn()} className="rounded-lg bg-indigo-600 px-5 py-2 text-white text-sm">
          ログイン
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col relative min-h-0">
      <div className="flex items-center gap-3 border-b px-3 py-2 bg-white shrink-0">
        <button onClick={() => setSidebarOpen(true)} aria-label="履歴を開く" className="text-gray-600 text-lg">
          ☰
        </button>
        <span className="font-medium text-gray-700 text-sm">数学サポートAI</span>
      </div>

      {sidebarOpen && (
        <div className="absolute inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-xs bg-white">
            <HistorySidebar
              selectedId={conversationId}
              onSelect={(id) => setConversationId(id || null)}
              refreshKey={refreshKey}
              onCloseMobile={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <ChatWindow
          conversationId={conversationId}
          onNewConversation={(id) => {
            setConversationId(id);
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    </div>
  );
}
