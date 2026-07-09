"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

/**
 * AIの回答（Markdown + $...$ / $$...$$ 記法）を安全に描画する。
 * - remark-math: $...$ / $$...$$ を数式ノードとして認識
 * - rehype-katex: 数式ノードをKaTeXでHTMLに変換
 * - remark-gfm: 見出し・番号付きリストなど、プロンプトが出す構造を綺麗に整形
 */
export default function MathRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 break-words">
      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
