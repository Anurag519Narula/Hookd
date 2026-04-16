import React, { useRef, useEffect } from "react";

interface NicheOption {
  label: string;
  icon: string;
}

const NICHES: NicheOption[] = [
  { label: "Fitness & Health",            icon: "💪" },
  { label: "Finance & Investing",         icon: "📈" },
  { label: "Technology",                  icon: "💻" },
  { label: "Business & Entrepreneurship", icon: "🚀" },
  { label: "Food & Cooking",              icon: "🍳" },
  { label: "Travel",                      icon: "✈️" },
  { label: "Fashion & Beauty",            icon: "👗" },
  { label: "Gaming",                      icon: "🎮" },
  { label: "Education & Learning",        icon: "📚" },
  { label: "Parenting",                   icon: "👶" },
  { label: "Mental Health & Wellness",    icon: "🧠" },
  { label: "Sports",                      icon: "⚽" },
  { label: "Music",                       icon: "🎵" },
  { label: "Comedy & Entertainment",      icon: "😂" },
  { label: "Real Estate",                 icon: "🏠" },
  { label: "Spirituality & Motivation",   icon: "🌟" },
  { label: "Photography & Videography",   icon: "📷" },
  { label: "Career & Productivity",       icon: "📋" },
  { label: "Relationships",               icon: "❤️" },
  { label: "DIY & Crafts",               icon: "🔨" },
];

const OTHER_VALUE = "__other__";

interface NichePickerProps {
  value: string;
  onChange: (niche: string) => void;
}

export function NichePicker({ value, onChange }: NichePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if the current value is a predefined niche or custom
  const isPredefined = NICHES.some((n) => n.label === value);
  const isOtherSelected = value !== "" && !isPredefined;
  const activeCard = isPredefined ? value : isOtherSelected ? OTHER_VALUE : value === "" ? "" : OTHER_VALUE;

  // Focus the input when "Other" is selected
  useEffect(() => {
    if (activeCard === OTHER_VALUE && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeCard]);

  function handleCardClick(label: string) {
    if (label === OTHER_VALUE) {
      // If already on Other, don't reset the typed value
      if (activeCard !== OTHER_VALUE) {
        onChange("");
      }
    } else {
      onChange(label);
    }
  }

  function handleOtherInput(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  const cardBase: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "16px 8px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    background: "var(--bg-card)",
    cursor: "pointer",
    transition: "all var(--transition)",
    userSelect: "none",
    minHeight: 88,
    textAlign: "center",
  };

  const cardSelected: React.CSSProperties = {
    border: "1px solid #14b8a6",
    background: "rgba(20, 184, 166, 0.08)",
  };

  const cardHover: React.CSSProperties = {
    border: "1px solid var(--border-strong)",
    background: "var(--bg-hover)",
  };

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        {NICHES.map((niche) => {
          const selected = activeCard === niche.label;
          return (
            <NicheCard
              key={niche.label}
              icon={niche.icon}
              label={niche.label}
              selected={selected}
              cardBase={cardBase}
              cardSelected={cardSelected}
              cardHover={cardHover}
              onClick={() => handleCardClick(niche.label)}
            />
          );
        })}

        {/* Other card */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={activeCard === OTHER_VALUE}
          onClick={() => handleCardClick(OTHER_VALUE)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick(OTHER_VALUE);
            }
          }}
          style={{
            ...cardBase,
            ...(activeCard === OTHER_VALUE ? cardSelected : {}),
            padding: activeCard === OTHER_VALUE ? "12px" : "16px 8px",
            gridColumn: activeCard === OTHER_VALUE ? "1 / -1" : undefined,
          }}
          onMouseEnter={(e) => {
            if (activeCard !== OTHER_VALUE) {
              Object.assign((e.currentTarget as HTMLDivElement).style, cardHover);
            }
          }}
          onMouseLeave={(e) => {
            if (activeCard !== OTHER_VALUE) {
              const el = e.currentTarget as HTMLDivElement;
              el.style.border = "1px solid var(--border)";
              el.style.background = "var(--bg-card)";
            }
          }}
        >
          {activeCard === OTHER_VALUE ? (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>✏️</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#14b8a6",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Other — type your own
                </span>
              </div>
              <input
                ref={inputRef}
                type="text"
                maxLength={60}
                placeholder="e.g. Sustainable Living"
                value={isOtherSelected ? value : ""}
                onChange={handleOtherInput}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 14,
                  color: "var(--text)",
                  background: "var(--bg-input)",
                  border: "1px solid #14b8a6",
                  borderRadius: "var(--radius-sm)",
                  outline: "none",
                  transition: "border-color var(--transition)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#14b8a6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20,184,166,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {isOtherSelected && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-4)",
                    textAlign: "right",
                  }}
                >
                  {value.length}/60
                </span>
              )}
            </div>
          ) : (
            <>
              <span style={{ fontSize: 22, lineHeight: 1 }}>✏️</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-2)",
                  lineHeight: 1.3,
                }}
              >
                Other — type your own
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────────

interface NicheCardProps {
  icon: string;
  label: string;
  selected: boolean;
  cardBase: React.CSSProperties;
  cardSelected: React.CSSProperties;
  cardHover: React.CSSProperties;
  onClick: () => void;
}

function NicheCard({ icon, label, selected, cardBase, cardSelected, cardHover, onClick }: NicheCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        ...cardBase,
        ...(selected ? cardSelected : {}),
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          Object.assign((e.currentTarget as HTMLDivElement).style, cardHover);
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.border = "1px solid var(--border)";
          el.style.background = "var(--bg-card)";
        }
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: selected ? 600 : 500,
          color: selected ? "#14b8a6" : "var(--text-2)",
          lineHeight: 1.3,
          transition: "color var(--transition)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
