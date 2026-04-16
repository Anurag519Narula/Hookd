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
        borderRadius: "var(--radius-sm)",
        padding: 3,
        gap: 2,
      }}
      role="group"
      aria-label="Caption length"
    >
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            style={{
              padding: "5px 14px",
              borderRadius: 6,
              border: "none",
              background: isActive ? "var(--bg-card)" : "transparent",
              color: isActive ? "var(--text)" : "var(--text-3)",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "all var(--transition)",
              boxShadow: isActive ? "var(--shadow-sm)" : "none",
              lineHeight: 1.4,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
