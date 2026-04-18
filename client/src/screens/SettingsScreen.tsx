import { useState, useEffect } from "react";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import { NichePicker } from "../components/NichePicker";
import { SubNicheInput } from "../components/SubNicheInput";
import { Navbar } from "../components/Navbar";
import { DangerZone } from "../components/DangerZone";
import type { Platform } from "../types/index";

const LANGUAGES = ["English","Spanish","French","German","Portuguese","Italian","Dutch","Japanese","Korean","Chinese"];

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "reels", label: "Reels" },
  { id: "youtube_shorts", label: "YouTube Shorts" },
];

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label htmlFor={htmlFor} style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "-0.005em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", fontSize: 13,
  color: "var(--text)", background: "var(--bg-input)",
  border: "1px solid var(--border)", borderRadius: 6,
  outline: "none", transition: "border-color 0.15s ease",
  boxSizing: "border-box" as const,
};

export function SettingsScreen() {
  const { profile, loading, updateProfile } = useCreatorProfile();
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [subNiche, setSubNiche] = useState("");
  const [language, setLanguage] = useState("English");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setNiche(profile.niche ?? "");
      setSubNiche(profile.sub_niche ?? "");
      setLanguage(profile.language ?? "English");
      setPlatforms(profile.platform_priority ?? []);
    }
  }, [profile]);

  function togglePlatform(id: Platform) {
    setPlatforms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true); setSaveSuccess(false); setSaveError("");
    try {
      await updateProfile({ name: name.trim(), niche: niche.trim() || null, sub_niche: subNiche.trim() || null, language, platform_priority: platforms });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
          {[160, 220, 140].map((h, i) => (
            <div key={i} className="shimmer-line" style={{ height: h, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 6px" }}>
            Settings
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
            Manage your profile and content preferences.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Profile */}
          <div>
            <SectionHeader label="Profile" />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Display Name" htmlFor="settings-name">
                <input
                  id="settings-name" type="text" value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80} placeholder="e.g. Alex Rivera"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
              </Field>
              <Field label="Email" htmlFor="settings-email">
                <div style={{ position: "relative" }}>
                  <input
                    id="settings-email" type="email" value={profile?.email ?? ""} readOnly
                    style={{ ...inputStyle, color: "var(--text-3)", background: "var(--bg-subtle)", cursor: "default", paddingRight: 80 }}
                  />
                  <span style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    fontSize: 10, fontWeight: 600, color: "var(--text-4)",
                    background: "var(--bg-hover)", border: "1px solid var(--border)",
                    borderRadius: 3, padding: "2px 6px", letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>
                    read-only
                  </span>
                </div>
              </Field>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <SectionHeader label="Preferences" />
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Field label="Niche">
                <NichePicker value={niche} onChange={setNiche} />
              </Field>
              <Field label="Sub-Niche">
                <SubNicheInput niche={niche} value={subNiche} onChange={setSubNiche} />
              </Field>
              <Field label="Language" htmlFor="settings-language">
                <div style={{ position: "relative" }}>
                  <select
                    id="settings-language" value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 32, appearance: "none", cursor: "pointer" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </Field>
              <Field label="Platform Priority">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }} role="group">
                  {PLATFORMS.map(({ id, label }) => {
                    const active = platforms.includes(id);
                    return (
                      <button
                        key={id} type="button" onClick={() => togglePlatform(id)} aria-pressed={active}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", borderRadius: 6,
                          border: `1px solid ${active ? "rgba(20,184,166,0.4)" : "var(--border)"}`,
                          background: active ? "rgba(20,184,166,0.06)" : "var(--bg-subtle)",
                          color: active ? "#14b8a6" : "var(--text-2)",
                          cursor: "pointer", textAlign: "left",
                          transition: "all 0.15s ease", width: "100%",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.borderColor = "var(--border-strong)";
                            b.style.color = "var(--text)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.borderColor = "var(--border)";
                            b.style.color = "var(--text-2)";
                          }
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, flex: 1 }}>{label}</span>
                        <span style={{
                          width: 16, height: 16, borderRadius: 3,
                          border: active ? "none" : "1.5px solid var(--border)",
                          background: active ? "#14b8a6" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "all 0.15s ease",
                        }}>
                          {active && (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </div>

          {/* Save */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button" onClick={handleSave} disabled={saving}
              style={{
                padding: "9px 20px", fontSize: 13, fontWeight: 600,
                borderRadius: 6, border: "none",
                background: saving ? "var(--bg-hover)" : "#14b8a6",
                color: saving ? "var(--text-3)" : "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.15s ease", alignSelf: "flex-start",
              }}
              onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
              onMouseLeave={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>

            {saveSuccess && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 6, background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <p style={{ fontSize: 12, color: "#14b8a6", margin: 0 }}>Changes saved.</p>
              </div>
            )}
            {saveError && (
              <p style={{ fontSize: 12, color: "var(--error)", margin: 0 }}>{saveError}</p>
            )}
          </div>

          {/* Danger Zone */}
          <div>
            <SectionHeader label="Danger Zone" />
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 8, padding: "18px 20px",
            }}>
              <DangerZone />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
