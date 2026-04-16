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
  const toggle = (platform: Platform) => {
    if (selected.includes(platform)) {
      onChange(selected.filter((p) => p !== platform));
    } else {
      onChange([...selected, platform]);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
        role="group"
        aria-label="Select platforms"
      >
        {PLATFORMS.map(({ value, label }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              aria-pressed={isSelected}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                background: isSelected ? "var(--accent)" : "transparent",
                color: isSelected ? "#fff" : "var(--text-2)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all var(--transition)",
                lineHeight: 1.4,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "var(--error)",
          }}
          role="alert"
        >
          Select at least one platform to generate captions.
        </p>
      )}
    </div>
  );
}
