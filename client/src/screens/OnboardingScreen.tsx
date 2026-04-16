import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { patchMe } from "../api/users";
import { NichePicker } from "../components/NichePicker";
import { SubNicheInput } from "../components/SubNicheInput";
import type { Platform } from "../types/index";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: "instagram",      label: "Instagram",       icon: "📸" },
  { id: "linkedin",       label: "LinkedIn",         icon: "💼" },
  { id: "reels",          label: "Reels",            icon: "🎬" },
  { id: "youtube_shorts", label: "YouTube Shorts",   icon: "▶️" },
];

// ── Step meta ─────────────────────────────────────────────────────────────────

const STEP_META = [
  { title: "What's your name?",          subtitle: "How should we address you?" },
  { title: "Pick your niche",            subtitle: "What kind of content do you create?" },
  { title: "Narrow it down",             subtitle: "Add a sub-niche to sharpen your content (optional)" },
  { title: "Preferred platforms",        subtitle: "Where do you publish? (optional)" },
];

// ── Component ─────────────────────────────────────────────────────────────────

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

  // ── Navigation helpers ──────────────────────────────────────────────────────

  function canAdvance(): boolean {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return niche.trim().length > 0;
    return true; // steps 3 & 4 are skippable
  }

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    }
  }

  function handleSkip() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    }
  }

  async function handleFinish() {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await patchMe({
        name: name.trim(),
        niche: niche.trim() || null,
        sub_niche: subNiche.trim() || null,
        platform_priority: platforms,
        onboarding_complete: true,
      });
      await refreshProfile();
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Platform toggle ─────────────────────────────────────────────────────────

  function togglePlatform(id: Platform) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const isSkippable = step === 3 || step === 4;
  const isLastStep = step === TOTAL_STEPS;
  const meta = STEP_META[step - 1];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
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
          background: "radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -150,
          left: -150,
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: step === 2 ? 640 : 480,
          background: "var(--bg-card, #111)",
          border: "1px solid var(--border, rgba(255,255,255,0.08))",
          borderRadius: "var(--radius-xl, 20px)",
          padding: "40px 36px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1,
          transition: "max-width 0.3s ease",
        }}
      >
        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
          }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label={`Step ${step} of ${TOTAL_STEPS}`}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const dotStep = i + 1;
            const isActive = dotStep === step;
            const isDone = dotStep < step;
            return (
              <div
                key={dotStep}
                style={{
                  width: isActive ? 24 : 8,
                  height: 8,
                  borderRadius: 999,
                  background: isActive || isDone ? "#14b8a6" : "rgba(255,255,255,0.15)",
                  transition: "all 0.3s ease",
                }}
              />
            );
          })}
        </div>

        {/* Step counter */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#14b8a6",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Step {step} of {TOTAL_STEPS}
        </p>

        {/* Title */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.02em",
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          {meta.title}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.45)",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          {meta.subtitle}
        </p>

        {/* ── Step content ── */}

        {step === 1 && (
          <StepName name={name} onChange={setName} />
        )}

        {step === 2 && (
          <NichePicker value={niche} onChange={setNiche} />
        )}

        {step === 3 && (
          <SubNicheInput niche={niche} value={subNiche} onChange={setSubNiche} />
        )}

        {step === 4 && (
          <StepPlatforms selected={platforms} onToggle={togglePlatform} />
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.25)",
            }}
          >
            <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 28,
            justifyContent: "flex-end",
          }}
        >
          {/* Skip button — only on skippable steps */}
          {isSkippable && !isLastStep && (
            <button
              type="button"
              onClick={handleSkip}
              style={{
                padding: "11px 20px",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "rgba(255,255,255,0.45)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              Skip
            </button>
          )}

          {/* Next / Finish button */}
          {isLastStep ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                background: submitting
                  ? "rgba(255,255,255,0.08)"
                  : "linear-gradient(135deg, #14b8a6, #6366f1)",
                color: submitting ? "rgba(255,255,255,0.3)" : "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: submitting ? "none" : "0 4px 14px rgba(20,184,166,0.3)",
              }}
              onMouseEnter={(e) => {
                if (!submitting) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              {submitting ? "Saving…" : "Finish"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance()}
              style={{
                flex: isSkippable ? undefined : 1,
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                background: canAdvance()
                  ? "linear-gradient(135deg, #14b8a6, #6366f1)"
                  : "rgba(255,255,255,0.08)",
                color: canAdvance() ? "#fff" : "rgba(255,255,255,0.3)",
                cursor: canAdvance() ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                boxShadow: canAdvance() ? "0 4px 14px rgba(20,184,166,0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                if (canAdvance()) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              Next →
            </button>
          )}
        </div>

        {/* Skip on last step */}
        {isLastStep && isSkippable && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              style={{
                background: "none",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                color: "rgba(255,255,255,0.35)",
                fontSize: 13,
                padding: 0,
              }}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Display Name ──────────────────────────────────────────────────────

interface StepNameProps {
  name: string;
  onChange: (v: string) => void;
}

function StepName({ name, onChange }: StepNameProps) {
  return (
    <div>
      <label
        htmlFor="onboarding-name"
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 8,
        }}
      >
        Display name
      </label>
      <input
        id="onboarding-name"
        type="text"
        value={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Alex Rivera"
        autoFocus
        maxLength={80}
        style={{
          width: "100%",
          padding: "11px 14px",
          fontSize: 15,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          color: "#fff",
          outline: "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#14b8a6";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20,184,166,0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ── Step 4: Preferred Platforms ───────────────────────────────────────────────

interface StepPlatformsProps {
  selected: Platform[];
  onToggle: (id: Platform) => void;
}

function StepPlatforms({ selected, onToggle }: StepPlatformsProps) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
      role="group"
      aria-label="Platform selection"
    >
      {PLATFORMS.map(({ id, label, icon }) => {
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            aria-pressed={isSelected}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderRadius: 10,
              border: isSelected
                ? "1px solid #14b8a6"
                : "1px solid rgba(255,255,255,0.1)",
              background: isSelected
                ? "rgba(20,184,166,0.08)"
                : "rgba(255,255,255,0.03)",
              color: isSelected ? "#14b8a6" : "rgba(255,255,255,0.6)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "rgba(255,255,255,0.2)";
                el.style.background = "rgba(255,255,255,0.06)";
                el.style.color = "rgba(255,255,255,0.8)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "rgba(255,255,255,0.1)";
                el.style.background = "rgba(255,255,255,0.03)";
                el.style.color = "rgba(255,255,255,0.6)";
              }
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 500 }}>
              {label}
            </span>
            {isSelected && (
              <span
                style={{
                  marginLeft: "auto",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#14b8a6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#fff",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
