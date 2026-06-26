"use client";

import { useRef, useState } from "react";

interface Props {
  image: string | null;
  onImage: (src: string) => void;
}

export default function ImageUploader({ image, onImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function readFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center w-full aspect-[4/3] rounded-2xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden
        ${dragging
          ? "border-blue-500 bg-blue-50"
          : image
          ? "border-slate-200 bg-slate-50"
          : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
    >
      {/* Hidden file input — no capture attribute so Mac shows file dialog */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="プレビュー" className="w-full h-full object-contain" />
          <div className="absolute bottom-3 right-3">
            <span className="text-xs text-white bg-black/50 px-2.5 py-1 rounded-full">
              クリックして変更
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 p-8 select-none">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
              <path d="M14 5v13M14 5l-4 4M14 5l4 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 19v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">クリックして画像を選択</p>
            <p className="text-xs text-slate-400 mt-1">またはここにドラッグ&amp;ドロップ</p>
            <p className="text-xs text-slate-300 mt-1">JPG・PNG・HEIC 対応</p>
          </div>
        </div>
      )}

      {dragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 rounded-2xl">
          <p className="text-blue-600 font-semibold text-sm">ここにドロップ</p>
        </div>
      )}
    </div>
  );
}
