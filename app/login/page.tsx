"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold mb-2">MathCheck</h1>
      <p className="text-gray-500 mb-4 text-sm">ログインして問題を解析しましょう</p>
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-64 rounded-lg border px-5 py-2 hover:bg-gray-50"
      >
        Googleでログイン
      </button>
      <button
        onClick={() => signIn("github", { callbackUrl: "/" })}
        className="w-64 rounded-lg border px-5 py-2 hover:bg-gray-50"
      >
        GitHubでログイン
      </button>
    </div>
  );
}
