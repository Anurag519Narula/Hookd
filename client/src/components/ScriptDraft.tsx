import { useState, useMemo } from "react";
import { Script } from "../types/index";
import { useClipboard } from "../hooks/useClipboard";

interface ScriptDraftProps {
  script: Script;
  onRegenerateWithFeedback: (feedback: string) => Promise<void>;
  onSaveToVault: (insights?: object | null) => Promise<void>;
  isRegenerating: boolean;
  insights?: object | null;
}

function formatFullScript(script: Script): string {
  const lines: string[] = [];
  lines.push(`HOOK: ${script.selected_hook.hook_text}`);
  lines.push("");
  script.beats.forEach((beat) => {
    lines.push(`[${beat.timestamp}] ${beat.text}`);
  });
  lines.push("");
  lines.push(`CTA: ${script.cta}`);
  return lines.join("\n");
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
      <span style={{
        fontSize: 12, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--text-3)",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

export function ScriptDraft({
  script,
  onRegenerateWithFeedback,
  onSaveToVault,
  isRegenerating,
  insights,
}: ScriptDraftProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveDone, setSaveDone] = useState(false);

  const { copied: copiedFull, copy: copyFull } = useClipboard();
  const { copied: copiedHook, copy: copyHook } = useClipboard();

  const wordCount = useMemo(() => {
    const allText = [
      script.selected_hook.hook_text,
      ...script.beats.map((b) => b.text),
      script.cta,
    ].join(" ").trim();
    return allText.split(/\s+/).filter(Boolean).length;
  }, [script]);

  const durationSeconds = Math.round((wordCount / 130) * 60);
  const durationLabel = durationSeconds >= 60
    ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
    : `${durationSeconds}s`;

  async function handleRegenerate() {
    await onRegenerateWithFeedback(feedback);
    setFeedback("");
    setFeedbackOpen(false);
  }

  async function handleSave() {
    setSaveLoading(true);
    setSaveError(null);
    try {
      await onSaveToVault(insights);
      setSaveDone(true);
      setTimeout(() => setSaveDone(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 18px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Script Draft
          </span>
          <span style={{
            fontSize: 13, color: "var(--text-3)",
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1px 7px",
            fontVariantNumeric: "tabular-nums",
          }}>
            {wordCount}w
          </span>
          <span style={{
            fontSize: 13, color: "#14b8a6",
            background: "rgba(20,184,166,0.08)",
            border: "1px solid rgba(20,184,166,0.2)",
            borderRadius: 4,
            padding: "1px 7px",
          }}>
            ~{durationLabel}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => copyHook(script.selected_hook.hook_text)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 10px", fontSize: 13, fontWeight: 600,
              letterSpacing: "0.02em",
              borderRadius: 4,
              border: `1px solid ${copiedHook ? "rgba(20,184,166,0.4)" : "var(--border)"}`,
              background: copiedHook ? "rgba(20,184,166,0.08)" : "transparent",
              color: copiedHook ? "#14b8a6" : "var(--text-3)",
              cursor: "pointer", transition: "all 0.15s ease",
            }}
          >
            {copiedHook ? "✓ Copied" : "Copy hook"}
          </button>
          <button
            onClick={() => copyFull(formatFullScript(script))}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 10px", fontSize: 13, fontWeight: 600,
              letterSpacing: "0.02em",
              borderRadius: 4,
              border: `1px solid ${copiedFull ? "rgba(20,184,166,0.4)" : "var(--border)"}`,
              background: copiedFull ? "rgba(20,184,166,0.08)" : "transparent",
              color: copiedFull ? "#14b8a6" : "var(--text-3)",
              cursor: "pointer", transition: "all 0.15s ease",
            }}
          >
            {copiedFull ? "✓ Copied" : "Copy all"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "4px 18px 20px" }}>

        {/* Hook */}
        <SectionDivider label="Hook" />
        <div style={{
          padding: "14px 16px",
          background: "rgba(20,184,166,0.04)",
          border: "1px solid rgba(20,184,166,0.15)",
          borderLeft: "3px solid #14b8a6",
          borderRadius: 6,
        }}>
          <p style={{
            fontSize: 15, lineHeight: 1.7, color: "var(--text)",
            margin: 0, fontWeight: 500, letterSpacing: "-0.01em",
          }}>
            {script.selected_hook.hook_text}
          </p>
        </div>

        {/* Body beats */}
        <SectionDivider label="Body" />
        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", borderRadius: 6, overflow: "hidden" }}>
          {script.beats.map((beat, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: 0,
              background: "var(--bg-card)",
            }}>
              <div style={{
                padding: "12px 10px",
                borderRight: "1px solid var(--border)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: "var(--text-3)",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.02em",
                  paddingTop: 2,
                }}>
                  {beat.timestamp}
                </span>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <p style={{
                  fontSize: 15, lineHeight: 1.7, color: "var(--text-2)",
                  margin: 0,
                }}>
                  {beat.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <SectionDivider label="Call to Action" />
        <p style={{
          fontSize: 15, lineHeight: 1.7, color: "var(--text-2)",
          margin: 0, fontStyle: "italic",
          paddingLeft: 12,
          borderLeft: "2px solid var(--border)",
        }}>
          {script.cta}
        </p>

        {/* ── Actions ── */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          {feedbackOpen && (
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What to change? e.g. 'more energetic', 'shorter beats', 'different angle'"
              rows={3}
              style={{
                width: "100%", resize: "vertical",
                border: "1px solid var(--border)",
                borderRadius: 6, padding: "10px 12px",
                fontSize: 15, lineHeight: 1.6,
                color: "var(--text)", background: "var(--bg-input)",
                outline: "none", fontFamily: "inherit",
                transition: "border-color 0.15s ease",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {feedbackOpen ? (
              <>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", fontSize: 14, fontWeight: 600,
                    borderRadius: 4, border: "none",
                    background: isRegenerating ? "var(--bg-hover)" : "#14b8a6",
                    color: isRegenerating ? "var(--text-3)" : "#fff",
                    cursor: isRegenerating ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isRegenerating ? "Regenerating…" : "Regenerate"}
                </button>
                <button
                  onClick={() => { setFeedbackOpen(false); setFeedback(""); }}
                  disabled={isRegenerating}
                  style={{
                    padding: "8px 12px", fontSize: 14, fontWeight: 500,
                    borderRadius: 4, border: "1px solid var(--border)",
                    background: "transparent", color: "var(--text-3)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setFeedbackOpen(true)}
                disabled={isRegenerating}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", fontSize: 14, fontWeight: 500,
                  borderRadius: 4, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text-2)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "var(--border-strong)";
                  b.style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "var(--border)";
                  b.style.color = "var(--text-2)";
                }}
              >
                ↻ Regenerate
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={saveLoading || saveDone}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", fontSize: 14, fontWeight: 500,
                borderRadius: 4,
                border: `1px solid ${saveDone ? "rgba(20,184,166,0.4)" : "var(--border)"}`,
                background: saveDone ? "rgba(20,184,166,0.08)" : "transparent",
                color: saveDone ? "#14b8a6" : "var(--text-2)",
                cursor: saveLoading || saveDone ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                marginLeft: "auto",
              }}
              onMouseEnter={(e) => {
                if (!saveLoading && !saveDone) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "rgba(20,184,166,0.4)";
                  b.style.color = "#14b8a6";
                }
              }}
              onMouseLeave={(e) => {
                if (!saveDone) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "var(--border)";
                  b.style.color = "var(--text-2)";
                }
              }}
            >
              {saveLoading ? "Saving…" : saveDone ? "✓ Saved" : "Save to Vault"}
            </button>
          </div>

          {saveError && (
            <p style={{
              fontSize: 14, color: "var(--error)",
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 6, padding: "6px 10px", margin: 0,
            }}>
              {saveError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
