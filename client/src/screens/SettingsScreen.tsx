import { useState, useEffect } from "react";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import { NichePicker } from "../components/NichePicker";
import { SubNicheInput } from "../components/SubNicheInput";
import { Navbar } from "../components/Navbar";
import { DangerZone } from "../components/DangerZone";
import type { Platform } from "../types/index";

// ── Constants ─────────────────────────────────────────────────────────────────

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Dutch",
  "Japanese",
  "Korean",
  "Chinese",
];

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: "instagram",      label: "Instagram",      icon: "📸" },
  { id: "linkedin",       label: "LinkedIn",        icon: "💼" },
  { id: "reels",          label: "Reels",           icon: "🎬" },
  { id: "youtube_shorts", label: "YouTube Shorts",  icon: "▶️" },
];

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
  danger,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${danger ? "rgba(248,113,113,0.2)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${danger ? "rgba(248,113,113,0.15)" : "var(--border)"}`,
          background: danger ? "rgba(248,113,113,0.04)" : undefined,
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: danger ? "var(--error)" : "var(--text)",
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-3)",
              margin: "4px 0 0",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Section body */}
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-2)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { profile, loading, updateProfile } = useCreatorProfile();

  // Form state
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [subNiche, setSubNiche] = useState("");
  const [language, setLanguage] = useState("English");
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Pre-populate fields when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setNiche(profile.niche ?? "");
      setSubNiche(profile.sub_niche ?? "");
      setLanguage(profile.language ?? "English");
      setPlatforms(profile.platform_priority ?? []);
    }
  }, [profile]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function togglePlatform(id: Platform) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      await updateProfile({
        name: name.trim(),
        niche: niche.trim() || null,
        sub_niche: subNiche.trim() || null,
        language,
        platform_priority: platforms,
      });
      setSaveSuccess(true);
      // Auto-dismiss success after 3s
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "48px 24px 80px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Skeleton header */}
          <div style={{ marginBottom: 8 }}>
            <div
              className="shimmer-line"
              style={{ width: 120, height: 14, marginBottom: 10 }}
            />
            <div className="shimmer-line" style={{ width: 200, height: 28 }} />
          </div>
          {/* Skeleton sections */}
          {[180, 240, 160].map((h, i) => (
            <div
              key={i}
              className="shimmer-line"
              style={{ height: h, borderRadius: "var(--radius-lg)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glows */}
      <div
        style={{
          position: "fixed",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Navbar />

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "48px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-3)",
              marginBottom: 8,
            }}
          >
            Account
          </p>
          <h1
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              margin: 0,
            }}
          >
            Settings
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* ── Profile section ── */}
          <Section
            title="Profile"
            description="Your public display name and account email."
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Display Name */}
              <Field label="Display Name" htmlFor="settings-name">
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  placeholder="e.g. Alex Rivera"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "var(--text)",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    outline: "none",
                    transition:
                      "border-color var(--transition), box-shadow var(--transition)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(20,184,166,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </Field>

              {/* Email (read-only) */}
              <Field label="Email" htmlFor="settings-email">
                <div style={{ position: "relative" }}>
                  <input
                    id="settings-email"
                    type="email"
                    value={profile?.email ?? ""}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: 14,
                      color: "var(--text-3)",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      outline: "none",
                      cursor: "default",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--text-4)",
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "2px 6px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    read-only
                  </span>
                </div>
              </Field>
            </div>
          </Section>

          {/* ── Preferences section ── */}
          <Section
            title="Preferences"
            description="Customise how Creator OS generates content for you."
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Niche */}
              <Field label="Niche">
                <NichePicker value={niche} onChange={setNiche} />
              </Field>

              {/* Sub-Niche */}
              <Field label="Sub-Niche">
                <SubNicheInput
                  niche={niche}
                  value={subNiche}
                  onChange={setSubNiche}
                />
              </Field>

              {/* Language */}
              <Field label="Language" htmlFor="settings-language">
                <div style={{ position: "relative" }}>
                  <select
                    id="settings-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 36px 10px 14px",
                      fontSize: 14,
                      color: "var(--text)",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      outline: "none",
                      appearance: "none",
                      cursor: "pointer",
                      transition:
                        "border-color var(--transition), box-shadow var(--transition)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(20,184,166,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  {/* Chevron icon */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-3)",
                      pointerEvents: "none",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </Field>

              {/* Platform Priority */}
              <Field label="Platform Priority">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  role="group"
                  aria-label="Platform priority selection"
                >
                  {PLATFORMS.map(({ id, label, icon }) => {
                    const isSelected = platforms.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => togglePlatform(id)}
                        aria-pressed={isSelected}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          borderRadius: "var(--radius-sm)",
                          border: isSelected
                            ? "1px solid var(--accent)"
                            : "1px solid var(--border)",
                          background: isSelected
                            ? "var(--accent-subtle)"
                            : "var(--bg-subtle)",
                          color: isSelected ? "var(--accent-text)" : "var(--text-2)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all var(--transition)",
                          width: "100%",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.borderColor = "var(--border-strong)";
                            el.style.background = "var(--bg-hover)";
                            el.style.color = "var(--text)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.borderColor = "var(--border)";
                            el.style.background = "var(--bg-subtle)";
                            el.style.color = "var(--text-2)";
                          }
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: isSelected ? 600 : 500,
                            flex: 1,
                          }}
                        >
                          {label}
                        </span>
                        {/* Checkbox indicator */}
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: isSelected
                              ? "none"
                              : "1.5px solid var(--border-strong)",
                            background: isSelected ? "var(--accent)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all var(--transition)",
                          }}
                        >
                          {isSelected && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </Section>

          {/* ── Save button + feedback ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "13px 28px",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: saving
                  ? "var(--bg-hover)"
                  : "linear-gradient(135deg, var(--accent), #6366f1)",
                color: saving ? "var(--text-3)" : "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "all var(--transition)",
                boxShadow: saving ? "none" : "0 4px 14px rgba(20,184,166,0.25)",
                alignSelf: "flex-start",
              }}
              onMouseEnter={(e) => {
                if (!saving)
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>

            {/* Success message */}
            {saveSuccess && (
              <div
                className="fade-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(20,184,166,0.08)",
                  border: "1px solid rgba(20,184,166,0.25)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p style={{ fontSize: 13, color: "var(--accent-text)", margin: 0 }}>
                  Changes saved successfully.
                </p>
              </div>
            )}

            {/* Error message */}
            {saveError && (
              <div
                className="fade-in"
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--error-subtle)",
                  border: "1px solid rgba(248,113,113,0.25)",
                }}
              >
                <p style={{ fontSize: 13, color: "var(--error)", margin: 0 }}>
                  {saveError}
                </p>
              </div>
            )}
          </div>

          {/* ── Danger Zone section ── */}
          <Section
            title="Danger Zone"
            description="Permanent actions that cannot be undone."
            danger
          >
            <DangerZone />
          </Section>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          .settings-save-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
