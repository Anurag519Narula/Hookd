import React, { useState, useMemo } from "react";
import { Script } from "../types/index";
import { useClipboard } from "../hooks/useClipboard";

interface ScriptDraftProps {
  script: Script;
  onRegenerateWithFeedback: (feedback: string) => Promise<void>;
  onSaveToVault: (insights?: object | null) => Promise<void>;
  isRegenerating: boolean;
  insights?: object | null;
}

const ClipboardIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const VaultIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

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

  // Real-time word count from script content
  const wordCount = useMemo(() => {
    const allText = [
      script.selected_hook.hook_text,
      ...script.beats.map((b) => b.text),
      script.cta,
    ]
      .join(" ")
      .trim();
    return allText.split(/\s+/).filter(Boolean).length;
  }, [script]);

  const durationSeconds = Math.round((wordCount / 130) * 60);
  const durationLabel =
    durationSeconds >= 60
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

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-3)",
    marginBottom: 8,
  };

  const divider: React.CSSProperties = {
    height: 1,
    background: "var(--border)",
    margin: "20px 0",
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            Script Draft
          </span>
          {/* Word count + duration badges */}
          <span
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 99,
              padding: "2px 10px",
            }}
          >
            {wordCount} words
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--accent-text)",
              background: "var(--accent-subtle)",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              borderRadius: 99,
              padding: "2px 10px",
            }}
          >
            ~{durationLabel}
          </span>
        </div>

        {/* Copy buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => copyHook(script.selected_hook.hook_text)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${copiedHook ? "var(--accent)" : "var(--border)"}`,
              background: copiedHook ? "var(--accent-subtle)" : "transparent",
              color: copiedHook ? "var(--accent-text)" : "var(--text-3)",
              cursor: "pointer",
              transition: "all var(--transition)",
              whiteSpace: "nowrap",
            }}
          >
            {copiedHook ? <CheckIcon /> : <ClipboardIcon />}
            {copiedHook ? "Copied!" : "Copy hook"}
          </button>
          <button
            onClick={() => copyFull(formatFullScript(script))}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${copiedFull ? "var(--accent)" : "var(--border)"}`,
              background: copiedFull ? "var(--accent-subtle)" : "transparent",
              color: copiedFull ? "var(--accent-text)" : "var(--text-3)",
              cursor: "pointer",
              transition: "all var(--transition)",
              whiteSpace: "nowrap",
            }}
          >
            {copiedFull ? <CheckIcon /> : <ClipboardIcon />}
            {copiedFull ? "Copied!" : "Copy full script"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>
        {/* Hook section */}
        <div>
          <p style={sectionLabel}>Hook</p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              color: "var(--text)",
              margin: 0,
              fontWeight: 500,
              padding: "12px 14px",
              background: "var(--accent-subtle)",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {script.selected_hook.hook_text}
          </p>
        </div>

        <div style={divider} />

        {/* Beats section */}
        <div>
          <p style={sectionLabel}>Body</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {script.beats.map((beat, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                {/* Timestamp label */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-3)",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "3px 8px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    marginTop: 2,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {beat.timestamp}
                </span>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "var(--text-2)",
                    margin: 0,
                  }}
                >
                  {beat.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={divider} />

        {/* CTA section */}
        <div>
          <p style={sectionLabel}>Call to Action</p>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--text-2)",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            {script.cta}
          </p>
        </div>

        <div style={divider} />

        {/* Regenerate section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {feedbackOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional: tell the AI what to change (e.g. 'make it more energetic', 'shorter beats')"
                rows={3}
                style={{
                  width: "100%",
                  resize: "vertical",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--text)",
                  background: "var(--bg-input)",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color var(--transition)",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--accent)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border)";
                }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Regenerate button */}
            {feedbackOpen ? (
              <>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: isRegenerating ? "var(--bg-hover)" : "var(--accent)",
                    color: isRegenerating ? "var(--text-3)" : "#fff",
                    cursor: isRegenerating ? "not-allowed" : "pointer",
                    transition: "all var(--transition)",
                  }}
                >
                  <RefreshIcon />
                  {isRegenerating ? "Regenerating…" : "Regenerate"}
                </button>
                <button
                  onClick={() => {
                    setFeedbackOpen(false);
                    setFeedback("");
                  }}
                  disabled={isRegenerating}
                  style={{
                    padding: "9px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-3)",
                    cursor: isRegenerating ? "not-allowed" : "pointer",
                    transition: "all var(--transition)",
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-2)",
                  cursor: isRegenerating ? "not-allowed" : "pointer",
                  transition: "all var(--transition)",
                }}
                onMouseEnter={(e) => {
                  if (!isRegenerating) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
                }}
              >
                <RefreshIcon />
                Regenerate script
              </button>
            )}

            {/* Save to Vault button */}
            <button
              onClick={handleSave}
              disabled={saveLoading || saveDone}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${saveDone ? "var(--accent)" : "var(--border)"}`,
                background: saveDone ? "var(--accent-subtle)" : "transparent",
                color: saveDone ? "var(--accent-text)" : "var(--text-2)",
                cursor: saveLoading || saveDone ? "not-allowed" : "pointer",
                transition: "all var(--transition)",
                marginLeft: "auto",
              }}
              onMouseEnter={(e) => {
                if (!saveLoading && !saveDone) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!saveDone) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
                }
              }}
            >
              <VaultIcon />
              {saveLoading ? "Saving…" : saveDone ? "Saved!" : "Save to Vault"}
            </button>
          </div>

          {/* Save error */}
          {saveError && (
            <p
              style={{
                fontSize: 12,
                color: "var(--error)",
                background: "var(--error-subtle)",
                border: "1px solid rgba(248, 113, 113, 0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 10px",
                margin: 0,
              }}
            >
              {saveError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
