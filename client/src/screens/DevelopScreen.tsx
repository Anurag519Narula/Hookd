import React, { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useDevelop } from "../hooks/useDevelop";
import { useSettings } from "../hooks/useSettings";
import { HookCard } from "../components/HookCard";
import { CopyButton } from "../components/CopyButton";
import { Navbar } from "../components/Navbar";
import { SettingsSlideOver } from "../components/SettingsSlideOver";
import { createIdea, updateIdea } from "../api/ideas";
import { authHeaders } from "../api/auth";
import type { Hook, Platform, Idea } from "../types/index";

// ── Constants ──────────────────────────────────────────────────────────────────
const PLATFORMS: Platform[] = ["instagram", "linkedin", "reels", "youtube_shorts"];

const PLATFORM_META: Record<Platform, { name: string; format: string; icon: string; color: string }> = {
  instagram:      { name: "Instagram",      format: "Caption",      icon: "📸", color: "#e1306c" },
  linkedin:       { name: "LinkedIn",       format: "Post",         icon: "💼", color: "#0a66c2" },
  reels:          { name: "Instagram Reels", format: "Script",       icon: "🎬", color: "#833ab4" },
  youtube_shorts: { name: "YouTube Shorts", format: "Short Script", icon: "▶️", color: "#ff0000" },
};

// ── Icons ──────────────────────────────────────────────────────────────────────
const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

// ── Step badge ─────────────────────────────────────────────────────────────────
function StepBadge({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
        background: done ? "var(--accent)" : active ? "var(--accent)" : "var(--bg-subtle)",
        border: done || active ? "none" : "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700,
        color: done || active ? "#fff" : "var(--text-4)",
        transition: "all 0.25s ease",
      }}>
        {done ? <CheckIcon /> : num}
      </div>
      <span style={{
        fontSize: 13, fontWeight: active || done ? 600 : 400,
        color: active || done ? "var(--text)" : "var(--text-4)",
        transition: "all 0.25s ease",
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Shimmer Caption Card ───────────────────────────────────────────────────────
function ShimmerCaptionCard({ platform }: { platform: Platform }) {
  const meta = PLATFORM_META[platform];
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-subtle)",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `${meta.color}18`, border: `1px solid ${meta.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
        }}>{meta.icon}</div>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "block" }}>{meta.name}</span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>{meta.format}</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <div className="shimmer-line" style={{ width: 60, height: 12, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="shimmer-line" style={{ height: 13, width: "90%", borderRadius: 6 }} />
        <div className="shimmer-line" style={{ height: 13, width: "75%", borderRadius: 6 }} />
        <div className="shimmer-line" style={{ height: 13, width: "82%", borderRadius: 6 }} />
        <div className="shimmer-line" style={{ height: 13, width: "60%", borderRadius: 6 }} />
      </div>
      <div style={{
        padding: "12px 20px", borderTop: "1px solid var(--border)",
        background: "var(--bg-subtle)", display: "flex", gap: 8,
      }}>
        <div className="shimmer-line" style={{ width: 80, height: 30, borderRadius: 6 }} />
        <div className="shimmer-line" style={{ width: 100, height: 30, borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ── Caption Card ───────────────────────────────────────────────────────────────
interface CaptionCardProps {
  platform: Platform;
  content: string;
  anchorKeywords: string[];
  onKeywordsChange: (kws: string[]) => void;
  onRegenerate: (feedback: string) => void;
  regenerating: boolean;
}

function CaptionCard({ platform, content, anchorKeywords, onKeywordsChange, onRegenerate, regenerating }: CaptionCardProps) {
  const meta = PLATFORM_META[platform];
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showRegenInput, setShowRegenInput] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIdx !== null) editRef.current?.focus();
  }, [editingIdx]);

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditValue(anchorKeywords[idx]);
  }

  function commitEdit(idx: number) {
    const trimmed = editValue.trim();
    if (!trimmed) { setEditingIdx(null); return; }
    const updated = [...anchorKeywords];
    updated[idx] = trimmed;
    onKeywordsChange(updated);
    setEditingIdx(null);
    onRegenerate("");
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); commitEdit(idx); }
    else if (e.key === "Escape") { setEditingIdx(null); }
  }

  function submitRegen() {
    onRegenerate(regenFeedback);
    setRegenFeedback("");
    setShowRegenInput(false);
  }

  const charCount = content.length;

  return (
    <div
      className="fade-in"
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow var(--transition), transform var(--transition)",
      }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = "var(--shadow-md)"; el.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = "var(--shadow-sm)"; el.style.transform = "translateY(0)"; }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `${meta.color}18`, border: `1px solid ${meta.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
          }}>{meta.icon}</div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "block" }}>{meta.name}</span>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>{meta.format}</span>
          </div>
        </div>
        <span style={{
          fontSize: 11, color: "var(--text-4)", fontWeight: 500,
          background: "var(--bg-hover)", borderRadius: 99, padding: "3px 9px",
          border: "1px solid var(--border)",
        }}>
          {charCount} chars
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "18px 20px" }}>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-2)", margin: 0, whiteSpace: "pre-wrap" }}>
          {content}
        </p>
      </div>

      {/* Keywords */}
      <div style={{ padding: "0 20px 16px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={{
          fontSize: 10, color: "var(--text-4)", fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase", marginRight: 2,
        }}>
          Keywords
        </span>
        {anchorKeywords.map((kw, idx) => (
          editingIdx === idx ? (
            <input
              key={idx}
              ref={editRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onBlur={() => commitEdit(idx)}
              style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 99,
                border: "1.5px solid var(--accent)", background: "var(--accent-subtle)",
                color: "var(--accent-text)", outline: "none", width: 90,
              }}
            />
          ) : (
            <button
              key={idx}
              onClick={() => startEdit(idx)}
              title="Click to edit"
              style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 99,
                border: "1px solid var(--border)", background: "var(--bg-subtle)",
                color: "var(--text-3)", cursor: "pointer",
                transition: "all var(--transition)", display: "inline-flex", alignItems: "center", gap: 4,
              }}
              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--accent)"; b.style.color = "var(--accent-text)"; b.style.background = "var(--accent-subtle)"; }}
              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--border)"; b.style.color = "var(--text-3)"; b.style.background = "var(--bg-subtle)"; }}
            >
              {kw}
              <span style={{ opacity: 0.6, fontSize: 10 }}>✎</span>
            </button>
          )
        ))}
      </div>

      {/* Footer actions */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
        padding: "12px 20px", borderTop: "1px solid var(--border)",
        background: "var(--bg-subtle)",
      }}>
        <CopyButton content={content} />
        <button
          onClick={() => setShowRegenInput((v) => !v)}
          disabled={regenerating}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "6px 13px", fontSize: 12, fontWeight: 500,
            borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
            background: showRegenInput ? "var(--accent-subtle)" : "var(--bg-card)",
            color: regenerating ? "var(--text-4)" : showRegenInput ? "var(--accent-text)" : "var(--text-2)",
            cursor: regenerating ? "not-allowed" : "pointer", transition: "all var(--transition)",
          }}
          onMouseEnter={(e) => { if (!regenerating) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--accent)"; b.style.color = "var(--accent-text)"; b.style.background = "var(--accent-subtle)"; } }}
          onMouseLeave={(e) => { if (!showRegenInput) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--border)"; b.style.color = regenerating ? "var(--text-4)" : "var(--text-2)"; b.style.background = "var(--bg-card)"; } }}
        >
          {regenerating ? (
            <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>↻</span> Regenerating…</>
          ) : (
            <>↻ Regenerate</>
          )}
        </button>
      </div>

      {/* Regen input */}
      {showRegenInput && (
        <div style={{
          padding: "12px 20px 14px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-card)",
          display: "flex", gap: 8, alignItems: "center",
          animation: "fadeUp 0.18s ease both",
        }}>
          <input
            type="text"
            value={regenFeedback}
            onChange={(e) => setRegenFeedback(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitRegen(); }}
            placeholder="What to change? (leave blank for full regen)"
            style={{
              flex: 1, padding: "8px 12px", fontSize: 13,
              border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              background: "var(--bg-input)", color: "var(--text)", outline: "none",
              transition: "border-color var(--transition)",
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border)"; }}
            autoFocus
          />
          <button
            onClick={submitRegen}
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-sm)", flexShrink: 0,
              border: "none", background: "var(--accent)", color: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background var(--transition)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
          >
            <ArrowIcon />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Section title ──────────────────────────────────────────────────────────────
function SectionTitle({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(135deg, var(--accent), #5b5ef4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "#fff",
        boxShadow: "0 2px 8px rgba(13,148,136,0.25)",
      }}>
        {step}
      </div>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main DevelopScreen ─────────────────────────────────────────────────────────
export function DevelopScreen() {
  const { ideaId: routeIdeaId } = useParams<{ ideaId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationIdea = (location.state as { idea?: Idea } | null)?.idea;

  const [settings, setSettings] = useSettings();
  const { ideaId, rawText, hooks, hooksLoading, hooksError, selectedHook, captions, generateHooks, updateHooks, selectHook, generateCaption, regenerateCaption } = useDevelop(routeIdeaId || locationIdea?.id);

  const [ideaText, setIdeaText] = useState<string>(locationIdea?.raw_text ?? "");

  // Sync route if ideaId is generated
  useEffect(() => {
    if (ideaId && !routeIdeaId) {
      navigate(`/develop/${ideaId}`, { replace: true });
    }
  }, [ideaId, routeIdeaId, navigate]);

  // Sync idea text from cache if loaded
  useEffect(() => {
    if (rawText && !ideaText) {
      setIdeaText(rawText);
    }
  }, [rawText, ideaText]);
  const [ideaFocused, setIdeaFocused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [tryAnotherLoading, setTryAnotherLoading] = useState<Record<number, boolean>>({});
  const [localHooks, setLocalHooks] = useState<(Hook | null)[]>([null, null, null, null, null]);

  const [anchorKeywords, setAnchorKeywords] = useState<Record<Platform, string[]>>({
    instagram:      ["content", "creator", "growth"],
    linkedin:       ["content", "creator", "growth"],
    reels:          ["content", "creator", "growth"],
    youtube_shorts: ["content", "creator", "growth"],
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const captionsRef = useRef<HTMLDivElement>(null);

  const hooksGenerated = localHooks.some((h) => h !== null);
  const captionSectionVisible = !!selectedHook;
  const anyCaptionLoading = PLATFORMS.some((p) => captions[p]?.loading);
  const allCaptionsDone = PLATFORMS.every((p) => captions[p] && !captions[p].loading);

  // Sync localHooks
  useEffect(() => {
    if (hooks) setLocalHooks(hooks.map((h) => h));
    else if (hooksLoading) setLocalHooks([null, null, null, null, null]);
  }, [hooks, hooksLoading]);

  // Generate captions when hook selected
  useEffect(() => {
    if (!selectedHook) return;

    // Scroll to captions after a short delay to allow the DOM to update
    setTimeout(() => {
      captionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    PLATFORMS.forEach((platform) => {
      // Only generate if not already cached
      if (!captions[platform]?.content) {
        generateCaption({
          hook: selectedHook.hook_text,
          raw_idea: ideaText,
          platform,
          niche: settings.niche,
          anchor_keywords: anchorKeywords[platform],
          language: settings.language,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHook]);

  function handleGenerateHooks() {
    if (!ideaText.trim()) return;
    generateHooks({
      raw_idea: ideaText,
      niche: settings.niche,
      sub_niche: settings.sub_niche,
      language: settings.language,
    });
  }

  async function handleTryAnother(cardIndex: number) {
    setTryAnotherLoading((prev) => ({ ...prev, [cardIndex]: true }));
    try {
      const res = await fetch("/api/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          raw_idea: ideaText,
          niche: settings.niche,
          sub_niche: settings.sub_niche,
          language: settings.language,
          idea_id: ideaId,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const newHooks: Hook[] = await res.json();
      const currentTriggers = localHooks
        .filter((h, i) => i !== cardIndex && h !== null)
        .map((h) => (h as Hook).trigger);
      const replacement = newHooks.find((h) => !currentTriggers.includes(h.trigger)) ?? newHooks[0];
      setLocalHooks((prev) => {
        const updated = [...prev];
        updated[cardIndex] = replacement;
        // Sync full list back to DB to avoid rehydration mismatches
        updateHooks(updated.filter((h): h is Hook => h !== null));
        return updated;
      });
    } catch { /* silently fail */ }
    finally { setTryAnotherLoading((prev) => ({ ...prev, [cardIndex]: false })); }
  }

  function handleKeywordsChange(platform: Platform, kws: string[]) {
    setAnchorKeywords((prev) => ({ ...prev, [platform]: kws }));
  }

  function handleRegenerate(platform: Platform, feedback: string) {
    const captionState = captions[platform];
    if (!captionState?.content) return;
    regenerateCaption({
      original_caption: captionState.content,
      feedback,
      platform,
      niche: settings.niche,
      anchor_keywords: anchorKeywords[platform],
      language: settings.language,
    });
  }

  async function handleSaveToVault() {
    if (saveLoading || saved || !selectedHook) return;
    setSaveLoading(true);
    try {
      const captionsRecord: Record<string, string> = {};
      PLATFORMS.forEach((p) => {
        const c = captions[p];
        if (c?.content) captionsRecord[p] = c.content;
      });
      const fullHooks = localHooks.filter((h): h is Hook => h !== null);
      if (locationIdea?.id || ideaId) {
        const targetId = locationIdea?.id || ideaId;
        await updateIdea(targetId!, { hooks: fullHooks, captions: captionsRecord, status: "developed" });
      } else {
        const created = await createIdea(ideaText);
        await updateIdea(created.id, { hooks: fullHooks, captions: captionsRecord, status: "developed" });
      }
      setSaved(true);
    } catch { /* silently fail */ }
    finally { setSaveLoading(false); }
  }

  const canGenerate = !hooksLoading && !!ideaText.trim();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SettingsSlideOver open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onSave={setSettings} />

      {/* Background glows */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 600, height: 600,
        background: "radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -100, left: -100, width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <Navbar />

      {/* Page header */}
      <div style={{
        maxWidth: 860, margin: "0 auto",
        padding: "48px 24px 32px",
        borderBottom: "1px solid var(--border)",
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
      }}>
        <div>
          {locationIdea && (
            <button
              onClick={() => navigate("/vault")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 500, color: "var(--text-3)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                marginBottom: 12, transition: "color var(--transition)",
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-text)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
            >
              <BackIcon /> Back to Vault
            </button>
          )}
          {!locationIdea && (
            <p style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 12px",
            }}>
              Hook Engine
            </p>
          )}
          <h1 style={{
            fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800,
            letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 8px",
          }}>
            Develop an idea.
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-3)", margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
            Turn a rough thought into 5 scroll-stopping hooks, then get platform-ready captions for all four channels.
          </p>
        </div>

        {/* Progress pills */}
        <div style={{
          display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap",
          justifyContent: "flex-end", alignItems: "center", paddingTop: 4,
        }}>
          <StepBadge num={1} label="Idea" active={!hooksGenerated} done={hooksGenerated} />
          <div style={{ width: 20, height: 1, background: "var(--border)", flexShrink: 0 }} />
          <StepBadge num={2} label="Hook" active={hooksGenerated && !selectedHook} done={!!selectedHook} />
          <div style={{ width: 20, height: 1, background: "var(--border)", flexShrink: 0 }} />
          <StepBadge num={3} label="Captions" active={!!selectedHook} done={allCaptionsDone && !anyCaptionLoading} />
        </div>
      </div>

      {/* Page body */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 100px", position: "relative", zIndex: 1 }}>

        {/* ── Step 1: Idea input ── */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle step={1} title="Your idea" subtitle="Paste a rough thought, video concept, or content idea." />

          {/* Settings nudge — shown when niche is not set */}
          {!settings.niche && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, padding: "12px 16px", marginBottom: 12,
              background: "var(--accent-subtle)",
              border: "1px solid rgba(13,148,136,0.25)",
              borderRadius: "var(--radius-md)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>⚙️</span>
                <p style={{ fontSize: 13, color: "var(--accent-text)", margin: 0, fontWeight: 500 }}>
                  Set your niche and language first — it makes your hooks and captions way more specific.
                </p>
              </div>
              <button
                onClick={() => setSettingsOpen(true)}
                style={{
                  flexShrink: 0, padding: "6px 14px", fontSize: 12, fontWeight: 600,
                  borderRadius: "var(--radius-sm)", border: "1px solid var(--accent)",
                  background: "var(--accent)", color: "#fff",
                  cursor: "pointer", transition: "all var(--transition)", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
              >
                Set up settings →
              </button>
            </div>
          )}

          <div style={{
            background: "var(--bg-card)", border: `1.5px solid ${ideaFocused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-lg)", padding: "18px 20px",
            boxShadow: ideaFocused ? "0 0 0 3px rgba(13,148,136,0.08)" : "var(--shadow-sm)",
            transition: "border-color var(--transition), box-shadow var(--transition)",
            marginBottom: 12,
          }}>
            <textarea
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              onFocus={() => setIdeaFocused(true)}
              onBlur={() => setIdeaFocused(false)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerateHooks(); }}
              placeholder='e.g. "Why most content creators burn out - and the mindset shift that changed everything for me"'
              rows={4}
              style={{
                width: "100%", resize: "none", border: "none", outline: "none",
                background: "transparent", fontSize: 15, lineHeight: 1.75,
                color: "var(--text)", fontFamily: "inherit", letterSpacing: "-0.01em",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: 12, color: "var(--text-4)" }}>
                {ideaText.length > 0 ? `${ideaText.length} chars` : "Tip: ⌘ + Enter to generate"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {settings.niche && (
                  <span style={{
                    fontSize: 11, color: "var(--text-3)", fontWeight: 500,
                    background: "var(--bg-subtle)", border: "1px solid var(--border)",
                    borderRadius: 99, padding: "2px 9px",
                  }}>
                    {settings.niche}
                  </span>
                )}
                <button
                  onClick={() => setSettingsOpen(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", fontSize: 12, fontWeight: 500,
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                    background: "var(--bg-subtle)", color: "var(--text-3)",
                    cursor: "pointer", transition: "all var(--transition)",
                  }}
                  onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--accent)"; b.style.color = "var(--accent-text)"; b.style.background = "var(--accent-subtle)"; }}
                  onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--border)"; b.style.color = "var(--text-3)"; b.style.background = "var(--bg-subtle)"; }}
                >
                  <SettingsIcon /> Settings
                </button>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateHooks}
            disabled={!canGenerate}
            style={{
              width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 600,
              borderRadius: "var(--radius-md)", border: "none",
              background: canGenerate
                ? "linear-gradient(135deg, var(--accent) 0%, #5b5ef4 100%)"
                : "var(--bg-subtle)",
              color: canGenerate ? "#fff" : "var(--text-4)",
              cursor: canGenerate ? "pointer" : "not-allowed",
              transition: "all var(--transition)",
              boxShadow: canGenerate ? "0 4px 16px rgba(13,148,136,0.25)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
            onMouseEnter={(e) => { if (canGenerate) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            {hooksLoading ? (
              <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>↻</span> Generating hooks…</>
            ) : (
              <><SparkleIcon /> Generate hooks</>
            )}
          </button>
        </div>

        {/* ── Error ── */}
        {hooksError && (
          <div style={{
            background: "var(--error-subtle)", border: "1px solid rgba(220,38,38,0.2)",
            borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <p style={{ fontSize: 13, color: "var(--error)", margin: 0 }}>{hooksError}</p>
          </div>
        )}

        {/* ── Step 2: Hook cards ── */}
        {(hooksLoading || hooksGenerated) && (
          <div style={{ marginBottom: 32 }}>
            <SectionTitle
              step={2}
              title="Pick a hook"
              subtitle="Choose the framing that feels right — or swap any card for a fresh one."
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {localHooks.map((hook, idx) => (
                <HookCard
                  key={idx}
                  hook={hook}
                  isSelected={selectedHook !== null && hook !== null && selectedHook.hook_text === hook.hook_text}
                  isDimmed={selectedHook !== null && hook !== null && selectedHook.hook_text !== hook.hook_text}
                  onSelect={selectHook}
                  onTryAnother={() => handleTryAnother(idx)}
                  tryAnotherLoading={tryAnotherLoading[idx] ?? false}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Captions ── */}
        {captionSectionVisible && (
          <div ref={captionsRef} style={{ animation: "fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) both" }}>
            {/* Divider */}
            <div style={{
              height: 1,
              background: "linear-gradient(to right, transparent, var(--border), transparent)",
              margin: "8px 0 28px",
            }} />

            <SectionTitle
              step={3}
              title="Platform captions"
              subtitle="Generated from your selected hook. Edit keywords to refine or regenerate any caption."
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {PLATFORMS.map((platform) => {
                const state = captions[platform];
                if (!state || state.loading) return <ShimmerCaptionCard key={platform} platform={platform} />;
                if (state.error) return (
                  <div key={platform} style={{
                    background: "var(--error-subtle)", border: "1px solid rgba(220,38,38,0.15)",
                    borderRadius: "var(--radius-lg)", padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <p style={{ fontSize: 13, color: "var(--error)", margin: 0 }}>
                      <strong>{PLATFORM_META[platform].name}:</strong> {state.error}
                    </p>
                  </div>
                );
                if (state.content) return (
                  <CaptionCard
                    key={platform}
                    platform={platform}
                    content={state.content}
                    anchorKeywords={anchorKeywords[platform]}
                    onKeywordsChange={(kws) => handleKeywordsChange(platform, kws)}
                    onRegenerate={(feedback) => handleRegenerate(platform, feedback)}
                    regenerating={state.loading}
                  />
                );
                return null;
              })}
            </div>

            {/* ── Save to Vault ── */}
            {allCaptionsDone && !anyCaptionLoading && (
              <div style={{
                marginTop: 32,
                background: saved
                  ? "var(--accent-subtle)"
                  : "var(--bg-card)",
                border: `1px solid ${saved ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "20px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                boxShadow: "var(--shadow-sm)",
                animation: "fadeUp 0.35s ease both",
                transition: "all 0.3s ease",
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 3px" }}>
                    {saved ? "Saved to your Vault ✓" : "Save this to your Vault"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
                    {saved
                      ? "This idea and its captions are stored in your Vault."
                      : "Store the selected hook and all captions for later use."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  {saved && (
                    <button
                      onClick={() => navigate("/vault")}
                      style={{
                        padding: "9px 18px", fontSize: 13, fontWeight: 500,
                        borderRadius: "var(--radius-sm)", border: "1px solid var(--accent)",
                        background: "transparent", color: "var(--accent-text)",
                        cursor: "pointer", transition: "all var(--transition)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-subtle)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      Go to Vault →
                    </button>
                  )}
                  <button
                    onClick={handleSaveToVault}
                    disabled={saved || saveLoading}
                    style={{
                      padding: "9px 22px", fontSize: 13, fontWeight: 600,
                      borderRadius: "var(--radius-sm)", border: "none",
                      background: saved
                        ? "var(--accent)"
                        : "linear-gradient(135deg, var(--accent), #5b5ef4)",
                      color: "#fff",
                      cursor: saved || saveLoading ? "default" : "pointer",
                      transition: "all var(--transition)",
                      boxShadow: saved ? "none" : "0 2px 10px rgba(13,148,136,0.3)",
                      display: "flex", alignItems: "center", gap: 6,
                      opacity: saveLoading ? 0.8 : 1,
                    }}
                    onMouseEnter={(e) => { if (!saved && !saveLoading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                  >
                    {saveLoading ? (
                      <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>↻</span> Saving…</>
                    ) : saved ? (
                      <><CheckIcon /> Saved</>
                    ) : (
                      "Save to Vault"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
