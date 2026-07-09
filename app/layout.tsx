import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "MathCheck — 解答解析AI",
  description: "写真を撮るだけでAIが途中式を解析します",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-800 antialiased">
        <Providers>
          <div className="mx-auto max-w-md min-h-screen flex flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
