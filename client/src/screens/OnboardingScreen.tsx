import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { patchMe } from "../api/users";
import { NichePicker } from "../components/NichePicker";
import { SubNicheInput } from "../components/SubNicheInput";
import type { Platform } from "../types/index";

const TOTAL_STEPS = 4;

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "reels", label: "Reels" },
  { id: "youtube_shorts", label: "YouTube Shorts" },
];

const STEP_META = [
  { title: "What's your name?", subtitle: "How should we address you?" },
  { title: "Pick your niche", subtitle: "What kind of content do you create?" },
  { title: "Narrow it down", subtitle: "Add a sub-niche to sharpen your content (optional)" },
  { title: "Preferred platforms", subtitle: "Where do you publish? (optional)" },
];

export function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name ?? "");
  const [niche, setNiche] = useState(user?.niche ?? "");
  const [subNiche, setSubNiche] = useState(user?.sub_niche ?? "");
  const [platforms, setPlatforms] = useState<Platform[]>(user?.platform_priority ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function canAdvance() {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return niche.trim().length > 0;
    return true;
  }

  async function handleFinish() {
    if (submitting) return;
    setError(""); setSubmitting(true);
    try {
      await patchMe({ name: name.trim(), niche: niche.trim() || null, sub_niche: subNiche.trim() || null, platform_priority: platforms, onboarding_complete: true });
      await refreshProfile();
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isSkippable = step === 3 || step === 4;
  const isLastStep = step === TOTAL_STEPS;
  const meta = STEP_META[step - 1];

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      {/* Card */}
      <div style={{
        width: "100%", maxWidth: step === 2 ? 620 : 460,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "32px 28px",
        transition: "max-width 0.3s ease",
      }}>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28, justifyContent: "center" }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const s = i + 1;
            const active = s === step;
            const done = s < step;
            return (
              <div key={s} style={{
                width: active ? 20 : 6, height: 6, borderRadius: 99,
                background: active || done ? "#14b8a6" : "var(--border)",
                transition: "all 0.3s ease",
              }} />
            );
          })}
        </div>

        {/* Step counter */}
        <p style={{ fontSize: 10, fontWeight: 700, color: "#14b8a6", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
          Step {step} of {TOTAL_STEPS}
        </p>

        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 5, textAlign: "center" }}>
          {meta.title}
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
          {meta.subtitle}
        </p>

        {/* Step content */}
        {step === 1 && (
          <div>
            <label htmlFor="onboarding-name" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 7 }}>
              Display name
            </label>
            <input
              id="onboarding-name" type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera" autoFocus maxLength={80}
              style={{
                width: "100%", padding: "9px 12px", fontSize: 13,
                borderRadius: 6, border: "1px solid var(--border)",
                background: "var(--bg-input)", color: "var(--text)",
                outline: "none", transition: "border-color 0.15s ease",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>
        )}

        {step === 2 && <NichePicker value={niche} onChange={setNiche} />}
        {step === 3 && <SubNicheInput niche={niche} value={subNiche} onChange={setSubNiche} />}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }} role="group">
            {PLATFORMS.map(({ id, label }) => {
              const active = platforms.includes(id);
              return (
                <button
                  key={id} type="button"
                  onClick={() => setPlatforms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])}
                  aria-pressed={active}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 14px", borderRadius: 6,
                    border: `1px solid ${active ? "rgba(20,184,166,0.4)" : "var(--border)"}`,
                    background: active ? "rgba(20,184,166,0.06)" : "var(--bg-subtle)",
                    color: active ? "#14b8a6" : "var(--text-2)",
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s ease", width: "100%",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, flex: 1 }}>{label}</span>
                  {active && (
                    <span style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: "#14b8a6", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 14, padding: "8px 12px", borderRadius: 6, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <p style={{ fontSize: 12, color: "var(--error)", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
          {isSkippable && !isLastStep && (
            <button
              type="button" onClick={() => setStep((s) => s + 1)}
              style={{
                padding: "9px 18px", fontSize: 13, fontWeight: 500,
                borderRadius: 6, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-3)", cursor: "pointer",
              }}
            >
              Skip
            </button>
          )}

          {isLastStep ? (
            <button
              type="button" onClick={handleFinish} disabled={submitting}
              style={{
                flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600,
                borderRadius: 6, border: "none",
                background: submitting ? "var(--bg-subtle)" : "#14b8a6",
                color: submitting ? "var(--text-3)" : "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
              onMouseLeave={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
            >
              {submitting ? "Saving…" : "Finish"}
            </button>
          ) : (
            <button
              type="button" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}
              style={{
                flex: isSkippable ? undefined : 1,
                padding: "10px 24px", fontSize: 13, fontWeight: 600,
                borderRadius: 6, border: "none",
                background: canAdvance() ? "#14b8a6" : "var(--bg-subtle)",
                color: canAdvance() ? "#fff" : "var(--text-4)",
                cursor: canAdvance() ? "pointer" : "not-allowed",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { if (canAdvance()) (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
              onMouseLeave={(e) => { if (canAdvance()) (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
            >
              Next →
            </button>
          )}
        </div>

        {isLastStep && isSkippable && (
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <button
              type="button" onClick={handleFinish} disabled={submitting}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 12, padding: 0 }}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
