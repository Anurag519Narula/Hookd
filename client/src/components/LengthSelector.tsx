import type { CaptionLength } from "../types";

const OPTIONS: { value: CaptionLength; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

interface LengthSelectorProps {
  value: CaptionLength;
  onChange: (length: CaptionLength) => void;
}

export function LengthSelector({ value, onChange }: LengthSelectorProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--bg-subtle)",
        border: "1px solid var(--border)",
        borderRadius: 6, padding: 2, gap: 2,
      }}
      role="group"
      aria-label="Caption length"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            style={{
              padding: "4px 12px", borderRadius: 4, border: "none",
              background: active ? "var(--bg-card)" : "transparent",
              color: active ? "var(--text)" : "var(--text-3)",
              fontSize: 14, fontWeight: active ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s ease",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
