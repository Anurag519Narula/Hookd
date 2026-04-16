import React, { useRef, useEffect } from "react";

// ── Niche → sub-niche suggestion map ──────────────────────────────────────────

const SUBNICHE_MAP: Record<string, string[]> = {
  "Fitness & Health":            ["Calisthenics", "Weight Loss", "Yoga", "Nutrition", "Running", "Strength Training"],
  "Finance & Investing":         ["Crypto", "Stock Market", "Personal Finance", "Real Estate Investing", "Budgeting"],
  "Technology":                  ["AI & Machine Learning", "Web Development", "Gadgets & Reviews", "Cybersecurity", "Startups"],
  "Business & Entrepreneurship": ["Side Hustles", "E-commerce", "Marketing", "Leadership", "Freelancing"],
  "Food & Cooking":              ["Meal Prep", "Vegan", "Baking", "Restaurant Reviews", "Quick Recipes"],
  "Travel":                      ["Budget Travel", "Luxury Travel", "Solo Travel", "Digital Nomad", "Adventure"],
  "Fashion & Beauty":            ["Skincare", "Streetwear", "Makeup", "Sustainable Fashion", "Thrifting"],
  "Gaming":                      ["FPS Games", "RPGs", "Mobile Gaming", "Game Reviews", "Esports"],
  "Education & Learning":        ["Language Learning", "Study Tips", "Online Courses", "Science", "History"],
  "Parenting":                   ["Newborns", "Toddlers", "Homeschooling", "Teen Parenting", "Single Parenting"],
  "Mental Health & Wellness":    ["Anxiety", "Mindfulness", "Therapy", "Self-Care", "Depression Awareness"],
  "Sports":                      ["Football", "Basketball", "Tennis", "Swimming", "Cycling"],
  "Music":                       ["Music Production", "Guitar", "Singing", "Music Theory", "DJ & Electronic"],
  "Comedy & Entertainment":      ["Stand-up", "Skits", "Reaction Videos", "Memes", "Improv"],
  "Real Estate":                 ["House Flipping", "Rental Properties", "Commercial Real Estate", "First-Time Buyers", "REITs"],
  "Spirituality & Motivation":   ["Meditation", "Law of Attraction", "Stoicism", "Morning Routines", "Journaling"],
  "Photography & Videography":   ["Portrait Photography", "Landscape", "Video Editing", "Drone", "Street Photography"],
  "Career & Productivity":       ["Remote Work", "Time Management", "Job Hunting", "Networking", "Promotions"],
  "Relationships":               ["Dating", "Marriage", "Breakups", "Communication", "Self-Love"],
  "DIY & Crafts":                ["Home Improvement", "Woodworking", "Knitting", "Upcycling", "3D Printing"],
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface SubNicheInputProps {
  niche: string;
  value: string;
  onChange: (subNiche: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SubNicheInput({ niche, value, onChange }: SubNicheInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = SUBNICHE_MAP[niche] ?? [];

  // When niche changes, clear the current value if it was a chip from the old niche
  useEffect(() => {
    if (value && suggestions.length > 0 && !suggestions.includes(value)) {
      // Value is a custom typed value — keep it. Only clear if it was a chip from a different niche.
      // We can't distinguish here, so we leave it as-is to avoid losing user input.
    }
  }, [niche]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChipClick(suggestion: string) {
    onChange(suggestion);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  const isChipSelected = (suggestion: string) => value === suggestion;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Suggestion chips */}
      {suggestions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
          role="group"
          aria-label="Sub-niche suggestions"
        >
          {suggestions.map((suggestion) => {
            const selected = isChipSelected(suggestion);
            return (
              <Chip
                key={suggestion}
                label={suggestion}
                selected={selected}
                onClick={() => handleChipClick(suggestion)}
              />
            );
          })}
        </div>
      )}

      {/* Free-text input */}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          maxLength={80}
          placeholder={
            suggestions.length > 0
              ? "Or type a custom sub-niche…"
              : "e.g. Sustainable Living"
          }
          value={value}
          onChange={handleInputChange}
          aria-label="Custom sub-niche"
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: 14,
            color: "var(--text)",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            outline: "none",
            transition: "border-color var(--transition), box-shadow var(--transition)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20,184,166,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {value.length > 0 && (
          <span
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 11,
              color: "var(--text-4)",
              pointerEvents: "none",
            }}
          >
            {value.length}/80
          </span>
        )}
      </div>

      {/* Helper text when no niche is selected */}
      {!niche && (
        <p
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            margin: 0,
          }}
        >
          Select a niche above to see suggestions.
        </p>
      )}
    </div>
  );
}

// ── Chip sub-component ────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: selected ? 600 : 500,
        cursor: "pointer",
        transition: "all var(--transition)",
        border: selected
          ? "1px solid var(--accent)"
          : "1px solid var(--border)",
        background: selected
          ? "var(--accent-subtle)"
          : "var(--bg-card)",
        color: selected
          ? "var(--accent-text)"
          : "var(--text-2)",
        outline: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          const el = e.currentTarget;
          el.style.borderColor = "var(--border-strong)";
          el.style.background = "var(--bg-hover)";
          el.style.color = "var(--text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          const el = e.currentTarget;
          el.style.borderColor = "var(--border)";
          el.style.background = "var(--bg-card)";
          el.style.color = "var(--text-2)";
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20,184,166,0.2)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {label}
    </button>
  );
}
