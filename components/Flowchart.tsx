import type { StepDetail } from "@/lib/types";

interface Props {
  steps: string[];
  stepDetails?: StepDetail[];
}

const NODE_W = 240;
const MIN_NODE_H = 40;
const ARROW_H = 28;
const PADDING_X = 20;
const FONT_SIZE = 12.5;
const LINE_HEIGHT = 16;
const MAX_LINES = 4;
// 左に番号(step number)、右にアイコン(✓/✗)を置くため、テキストが使える横幅は少し狭める
const TEXT_INNER_WIDTH = NODE_W - 64;

// 日本語(全角)は概ね正方形、半角英数字はそれより細いという前提で概算する。
// SVGはDOM計測なしでも折り返し位置をだいたい合わせられればよいため、簡易近似で十分。
function charWidth(ch: string, fontSize: number): number {
  const code = ch.codePointAt(0) ?? 0;
  const isWide =
    (code >= 0x3000 && code <= 0x30ff) || // 日本語の記号・ひらがな・カタカナ
    (code >= 0x3400 && code <= 0x9fff) || // CJK漢字
    (code >= 0xff00 && code <= 0xffef); // 全角英数記号
  return isWide ? fontSize * 1.0 : fontSize * 0.58;
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = [];
  let current = "";
  let currentWidth = 0;

  for (const ch of Array.from(text)) {
    const w = charWidth(ch, fontSize);
    if (currentWidth + w > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
      currentWidth = w;
    } else {
      current += ch;
      currentWidth += w;
    }
  }
  if (current) lines.push(current);
  if (lines.length === 0) lines.push("");

  // 長すぎる場合は末尾を省略(見た目の破綻を防ぐ)
  if (lines.length > MAX_LINES) {
    const truncated = lines.slice(0, MAX_LINES);
    truncated[MAX_LINES - 1] = truncated[MAX_LINES - 1].slice(0, -1) + "…";
    return truncated;
  }
  return lines;
}

export default function Flowchart({ steps, stepDetails }: Props) {
  const svgW = NODE_W + PADDING_X * 2;
  const cx = svgW / 2;

  // 各ステップのラベルを折り返し、必要な高さを個別に計算する
  const layout = steps.map((label, i) => {
    const lines = wrapText(label, TEXT_INNER_WIDTH, FONT_SIZE);
    const nodeH = Math.max(MIN_NODE_H, lines.length * LINE_HEIGHT + 18);
    const detail = stepDetails?.[i];
    return { lines, nodeH, isOk: detail?.ok ?? true, hasDetail: Boolean(detail) };
  });

  // 累積Y座標を計算(ノードの高さがバラバラなため、事前に積み上げる)
  const ys: number[] = [];
  let cursor = 8;
  layout.forEach((item) => {
    ys.push(cursor);
    cursor += item.nodeH + ARROW_H;
  });
  const svgH = cursor - ARROW_H + 8;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      aria-label="解答フローチャート"
      role="img"
    >
      {layout.map((item, i) => {
        const y = ys[i];
        const { lines, nodeH, isOk, hasDetail } = item;
        const textStartY = y + nodeH / 2 - ((lines.length - 1) * LINE_HEIGHT) / 2 + FONT_SIZE * 0.35;

        return (
          <g key={i}>
            {/* Node */}
            <rect
              x={cx - NODE_W / 2}
              y={y}
              width={NODE_W}
              height={nodeH}
              rx={10}
              fill={isOk ? "#eff6ff" : "#fef2f2"}
              stroke={isOk ? "#93c5fd" : "#fca5a5"}
              strokeWidth={1.5}
            />
            {/* Step number */}
            <text
              x={cx - NODE_W / 2 + 14}
              y={y + nodeH / 2 + 4}
              fontSize={11}
              fill={isOk ? "#3b82f6" : "#ef4444"}
              fontWeight="600"
              fontFamily="monospace"
            >
              {i + 1}
            </text>
            {/* Label(複数行対応) */}
            <text
              x={cx}
              y={textStartY}
              fontSize={FONT_SIZE}
              fill={isOk ? "#1e3a5f" : "#7f1d1d"}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {lines.map((line, li) => (
                <tspan key={li} x={cx} dy={li === 0 ? 0 : LINE_HEIGHT}>
                  {line}
                </tspan>
              ))}
            </text>
            {/* Status icon */}
            {hasDetail && (
              <text
                x={cx + NODE_W / 2 - 16}
                y={y + nodeH / 2 + 4}
                fontSize={13}
                textAnchor="middle"
              >
                {isOk ? "✓" : "✗"}
              </text>
            )}
            {/* Arrow (not after last) */}
            {i < layout.length - 1 && (
              <g>
                <line
                  x1={cx}
                  y1={y + nodeH}
                  x2={cx}
                  y2={y + nodeH + ARROW_H - 6}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                />
                <polygon
                  points={`${cx},${y + nodeH + ARROW_H} ${cx - 5},${y + nodeH + ARROW_H - 7} ${cx + 5},${y + nodeH + ARROW_H - 7}`}
                  fill="#94a3b8"
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
