import type { StepDetail } from "@/lib/types";

interface Props {
  steps: string[];
  stepDetails?: StepDetail[];
}

const NODE_W = 200;
const NODE_H = 40;
const ARROW_H = 28;
const PADDING_X = 20;
const TOTAL_H_PER_STEP = NODE_H + ARROW_H;

export default function Flowchart({ steps, stepDetails }: Props) {
  const svgH = steps.length * NODE_H + (steps.length - 1) * ARROW_H + 16;
  const svgW = NODE_W + PADDING_X * 2;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      aria-label="解答フローチャート"
      role="img"
    >
      {steps.map((label, i) => {
        const y = 8 + i * TOTAL_H_PER_STEP;
        const cx = svgW / 2;
        const detail = stepDetails?.[i];
        const isOk = detail?.ok ?? true;

        return (
          <g key={i}>
            {/* Node */}
            <rect
              x={cx - NODE_W / 2}
              y={y}
              width={NODE_W}
              height={NODE_H}
              rx={10}
              fill={isOk ? "#eff6ff" : "#fef2f2"}
              stroke={isOk ? "#93c5fd" : "#fca5a5"}
              strokeWidth={1.5}
            />
            {/* Step number */}
            <text
              x={cx - NODE_W / 2 + 14}
              y={y + NODE_H / 2 + 5}
              fontSize={11}
              fill={isOk ? "#3b82f6" : "#ef4444"}
              fontWeight="600"
              fontFamily="monospace"
            >
              {i + 1}
            </text>
            {/* Label */}
            <text
              x={cx}
              y={y + NODE_H / 2 + 5}
              fontSize={13}
              fill={isOk ? "#1e3a5f" : "#7f1d1d"}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {label}
            </text>
            {/* Status icon */}
            {detail && (
              <text
                x={cx + NODE_W / 2 - 16}
                y={y + NODE_H / 2 + 5}
                fontSize={13}
                textAnchor="middle"
              >
                {isOk ? "✓" : "✗"}
              </text>
            )}
            {/* Arrow (not after last) */}
            {i < steps.length - 1 && (
              <g>
                <line
                  x1={cx}
                  y1={y + NODE_H}
                  x2={cx}
                  y2={y + NODE_H + ARROW_H - 6}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                />
                {/* Arrowhead */}
                <polygon
                  points={`${cx},${y + NODE_H + ARROW_H} ${cx - 5},${y + NODE_H + ARROW_H - 7} ${cx + 5},${y + NODE_H + ARROW_H - 7}`}
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
