import type { StepDetail } from "@/lib/types";

export default function StepList({ steps }: { steps: StepDetail[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <li key={i} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${step.ok ? "bg-emerald-50" : "bg-red-50"}`}>
          <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step.ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {step.ok ? "✓" : "✗"}
          </span>
          <div>
            <p className={`text-sm font-medium ${step.ok ? "text-emerald-800" : "text-red-800"}`}>
              {step.label}
            </p>
            {step.note && (
              <p className="text-xs text-red-600 mt-0.5">{step.note}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
