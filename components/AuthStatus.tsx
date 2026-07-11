"use client";

import { useSession, signIn, signOut } from "next-auth/react";

// eslint-disable-next-line @next/next/no-img-element
export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
      >
        ログイン
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut()}
      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-1.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
      title="ログアウト"
    >
      {session.user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.user.image} alt="" className="h-6 w-6 rounded-full" />
      ) : (
        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
          {session.user?.name?.[0] ?? "U"}
        </div>
      )}
      <span className="hidden sm:inline">ログアウト</span>
    </button>
  );
}
