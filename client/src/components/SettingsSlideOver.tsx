import React, { useEffect, useRef, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import type { Platform } from "../types/index";

const NICHE_SUGGESTIONS = [
  "Fitness", "Finance", "Travel", "Food", "Parenting",
  "Tech", "Beauty", "Mental Health", "Business", "Gaming",
  "Education", "Lifestyle", "Photography", "Music", "Art & Design",
  "Sports", "Cooking", "Fashion", "Real Estate", "Crypto & Web3",
  "Self Improvement", "Relationships", "Career & Productivity",
  "Comedy & Entertainment", "Spirituality & Wellness",
];

const LANGUAGES = ["English", "Hindi", "Spanish", "Portuguese", "French", "Arabic"];

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram:      "Instagram",
  linkedin:       "LinkedIn",
  reels:          "Instagram Reels",
  youtube_shorts: "YouTube Shorts",
};

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  instagram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  reels: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  youtube_shorts: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
    </svg>
  ),
};

const DragIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
    <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/>
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/>
    <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export interface SettingsSlideOverProps {
  open: boolean;
  onClose: () => void;
  settings?: ReturnType<typeof useSettings>[0];
  onSave?: (s: ReturnType<typeof useSettings>[0]) => void;
}

export function SettingsSlideOver({ open, onClose, settings: settingsProp, onSave }: SettingsSlideOverProps) {
  const [settingsInternal, setSettingsInternal] = useSettings();
  const settings = settingsProp ?? settingsInternal;
  const setSettings = onSave ?? setSettingsInternal;

  // Local state — committed to useSettings on close
  const [niche, setNiche] = useState(settings.niche);
  const [subNiche, setSubNiche] = useState(settings.sub_niche);
  const [language, setLanguage] = useState(settings.language);
  const [platforms, setPlatforms] = useState<Platform[]>(settings.platform_priority);

  // Autocomplete state
  const [nicheQuery, setNicheQuery] = useState(settings.niche);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nicheRef = useRef<HTMLInputElement>(null);

  // DnD state
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Sync local state when settings change externally (e.g. on mount)
  useEffect(() => {
    setNiche(settings.niche);
    setNicheQuery(settings.niche);
    setSubNiche(settings.sub_niche);
    setLanguage(settings.language);
    setPlatforms([...settings.platform_priority]);
  }, [open]); // re-sync when panel opens

  const filteredSuggestions = NICHE_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(nicheQuery.toLowerCase()) && s.toLowerCase() !== nicheQuery.toLowerCase()
  );

  function handleNicheChange(val: string) {
    setNicheQuery(val);
    setNiche(val);
    setShowSuggestions(val.length > 0);
  }

  function handleSuggestionClick(suggestion: string) {
    setNiche(suggestion);
    setNicheQuery(suggestion);
    setShowSuggestions(false);
    nicheRef.current?.blur();
  }

  function handleClose() {
    setSettings({ niche, sub_niche: subNiche, language, platform_priority: platforms });
    onClose();
  }

  // HTML5 DnD handlers
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOver(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === dropIndex) {
      setDragOver(null);
      return;
    }
    const updated = [...platforms];
    const [moved] = updated.splice(dragIndex.current, 1);
    updated.splice(dropIndex, 0, moved);
    setPlatforms(updated);
    dragIndex.current = null;
    setDragOver(null);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOver(null);
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    justifyContent: "flex-end",
    transition: `opacity var(--transition)`,
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
  };

  const backdropStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(2px)",
    WebkitBackdropFilter: "blur(2px)",
  };

  const panelStyle: React.CSSProperties = {
    position: "relative",
    width: 400,
    maxWidth: "100vw",
    height: "100%",
    background: "var(--bg-card)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderLeft: "1px solid var(--border)",
    borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    display: "flex",
    flexDirection: "column",
    transform: open ? "translateX(0)" : "translateX(100%)",
    transition: `transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)`,
    overflowY: "auto",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-2)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    color: "var(--text)",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    outline: "none",
    transition: "border-color var(--transition)",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8580' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 36,
  };

  return (
    <div style={overlayStyle} aria-hidden={!open}>
      {/* Backdrop */}
      <div style={backdropStyle} onClick={handleClose} />

      {/* Panel */}
      <div style={panelStyle} role="dialog" aria-modal="true" aria-label="Settings">
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Settings</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Personalize your content generation</div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close settings"
            style={{
              width: 32, height: 32, borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)", background: "var(--bg-subtle)",
              color: "var(--text-2)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all var(--transition)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)"; }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>

          {/* Niche */}
          <div>
            <label style={labelStyle}>Niche</label>
            <div style={{ position: "relative" }}>
              <input
                ref={nicheRef}
                type="text"
                value={nicheQuery}
                placeholder="e.g. Fitness, Finance, Tech…"
                onChange={(e) => handleNicheChange(e.target.value)}
                onFocus={() => setShowSuggestions(nicheQuery.length > 0 && filteredSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                style={inputStyle}
                onFocusCapture={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--accent)"; }}
                onBlurCapture={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border)"; }}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-md)",
                  zIndex: 10,
                  overflow: "hidden",
                }}>
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => handleSuggestionClick(s)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "9px 12px", fontSize: 14,
                        color: "var(--text)", background: "none",
                        border: "none", cursor: "pointer",
                        transition: "background var(--transition)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Quick-pick chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {NICHE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  style={{
                    fontSize: 12, padding: "4px 10px",
                    borderRadius: 99,
                    border: `1px solid ${niche === s ? "var(--accent)" : "var(--border)"}`,
                    background: niche === s ? "var(--accent-subtle)" : "var(--bg-subtle)",
                    color: niche === s ? "var(--accent-text)" : "var(--text-2)",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    fontWeight: niche === s ? 600 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-niche */}
          <div>
            <label style={labelStyle}>Sub-niche <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-3)" }}>(optional)</span></label>
            <input
              type="text"
              value={subNiche}
              placeholder="e.g. Calisthenics, Day trading…"
              onChange={(e) => setSubNiche(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border)"; }}
            />
          </div>

          {/* Language */}
          <div>
            <label style={labelStyle}>Language</label>
            <div style={{ position: "relative" }}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={selectStyle}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Platform priority */}
          <div>
            <label style={labelStyle}>Platform priority</label>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 10 }}>
              Drag to reorder — top platform gets the most attention
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {platforms.map((platform, index) => (
                <div
                  key={platform}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px",
                    background: dragOver === index ? "var(--accent-subtle)" : "var(--bg-subtle)",
                    border: `1px solid ${dragOver === index ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)",
                    cursor: "grab",
                    transition: "all var(--transition)",
                    userSelect: "none",
                  }}
                >
                  <DragIcon />
                  <span style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: "var(--bg-hover)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-2)", flexShrink: 0,
                  }}>
                    {PLATFORM_ICONS[platform]}
                  </span>
                  <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, flex: 1 }}>
                    {PLATFORM_LABELS[platform]}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: "var(--text-3)",
                    background: "var(--bg-hover)", borderRadius: 4,
                    padding: "2px 6px",
                  }}>
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <button
            onClick={handleClose}
            style={{
              width: "100%", padding: "11px 0",
              fontSize: 14, fontWeight: 600,
              color: "#fff",
              background: "var(--accent)",
              border: "none", borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "background var(--transition)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
          >
            Save &amp; close
          </button>
        </div>
      </div>
    </div>
  );
}
