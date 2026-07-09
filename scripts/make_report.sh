#!/usr/bin/env bash
#
# make_report.sh
# Markdownを1コマンドできれいなPDFに変換する(報告書作成用)
#
# 使い方:
#   ./make_report.sh 報告書.md
#   ./make_report.sh 報告書.md 出力名.pdf
#
# 必要なもの (初回のみインストール):
#   macOS : brew install pandoc; brew install --cask mactex-no-gui
#   Ubuntu: sudo apt install pandoc texlive-luatex texlive-lang-japanese fonts-noto-cjk
#
# ポイント:
#  - "markdown+hard_line_breaks" 拡張を使うことで、
#    Markdown内の単発の改行(空行を挟まない改行)もPDF上で
#    そのまま改行として反映される(通常のpandocは単発改行を無視して1行に連結してしまう)。
#  - 日本語対応のため lualatex + ltjsarticle(LuaTeX-ja) + Noto CJK フォントを使用。

set -euo pipefail

if ! command -v pandoc >/dev/null 2>&1; then
  echo "エラー: pandoc がインストールされていません。" >&2
  echo "  macOS : brew install pandoc" >&2
  echo "  Ubuntu: sudo apt install pandoc" >&2
  exit 1
fi

INPUT="${1:-}"
if [[ -z "$INPUT" ]]; then
  echo "使い方: $0 <input.md> [output.pdf]" >&2
  exit 1
fi
if [[ ! -f "$INPUT" ]]; then
  echo "エラー: ファイルが見つかりません: $INPUT" >&2
  exit 1
fi

# 出力ファイル名: 指定がなければ 同名.pdf (日付サフィックス付き)
if [[ -n "${2:-}" ]]; then
  OUTPUT="$2"
else
  BASE="$(basename "$INPUT" .md)"
  OUTPUT="${BASE}_$(date +%Y%m%d_%H%M).pdf"
fi

# 日本語が使えるCJKフォント名を自動検出(なければNoto系にフォールバック)
CJK_FONT="Noto Sans CJK JP"
if command -v fc-list >/dev/null 2>&1; then
  if fc-list | grep -qi "Hiragino"; then
    CJK_FONT="Hiragino Sans"
  elif fc-list | grep -qi "Yu Gothic"; then
    CJK_FONT="Yu Gothic"
  fi
fi

echo "変換中: $INPUT -> $OUTPUT (CJKフォント: $CJK_FONT)"

pandoc "$INPUT" \
  -o "$OUTPUT" \
  --pdf-engine=lualatex \
  --from=markdown+hard_line_breaks \
  -V documentclass=ltjsarticle \
  -V mainfont="$CJK_FONT" \
  -V geometry:margin=25mm \
  -V linkcolor=blue \
  --toc=false

echo "完了: $OUTPUT"

# 生成後すぐ開く(任意。不要ならこのブロックごと削除してよい)
if [[ "${OSTYPE:-}" == "darwin"* ]]; then
  open "$OUTPUT" 2>/dev/null || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$OUTPUT" 2>/dev/null || true
fi
