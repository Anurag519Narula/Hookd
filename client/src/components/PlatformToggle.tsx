import type { Platform } from "../types";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "reels", label: "Reels" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
];

interface PlatformToggleProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

export function PlatformToggle({ selected, onChange }: PlatformToggleProps) {
  const toggle = (p: Platform) => {
    onChange(selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p]);
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="group" aria-label="Select platforms">
        {PLATFORMS.map(({ value, label }) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              aria-pressed={active}
              style={{
                padding: "5px 12px", borderRadius: 4,
                border: `1px solid ${active ? "rgba(20,184,166,0.5)" : "var(--border)"}`,
                background: active ? "rgba(20,184,166,0.1)" : "transparent",
                color: active ? "#14b8a6" : "var(--text-3)",
                fontSize: 12, fontWeight: active ? 600 : 500,
                cursor: "pointer", transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "var(--border-strong)";
                  b.style.color = "var(--text-2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "var(--border)";
                  b.style.color = "var(--text-3)";
                }
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p style={{ marginTop: 5, fontSize: 11, color: "var(--error)" }} role="alert">
          Select at least one platform to generate captions.
        </p>
      )}
    </div>
  );
}
