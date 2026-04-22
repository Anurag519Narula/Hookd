import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Idea } from "../types/index";

interface IdeaCardProps {
  idea: Idea;
  onMarkUsed: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
}

const SCORE_COLORS: Record<string, string> = {
  low: "#94a3b8",
  medium: "#f59e0b",
  high: "#34d399",
};

function ScoreDot({ score }: { score: "low" | "medium" | "high" | null }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = score ? SCORE_COLORS[score] : SCORE_COLORS.low;
  const label = score ?? "low";

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span style={{
        display: "inline-block", width: 7, height: 7,
        borderRadius: "50%", background: color, flexShrink: 0, cursor: "default",
      }} />
      {showTooltip && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          background: "var(--text)", color: "var(--bg-card)",
          fontSize: 13, fontWeight: 500, padding: "3px 8px",
          borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 10,
        }}>
          {label} potential
        </span>
      )}
    </span>
  );
}

export function IdeaCard({ idea, onMarkUsed, onEdit, onDelete }: IdeaCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(idea.raw_text);
  const [fading, setFading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (editMode && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editMode]);

  function handleDelete() {
    setMenuOpen(false);
    setFading(true);
    setTimeout(() => onDelete(idea.id), 300);
  }

  const isUsed = idea.status === "used";

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      overflow: "hidden",
      transition: "opacity 0.3s ease, border-color 0.15s ease",
      opacity: fading ? 0 : isUsed ? 0.55 : 1,
      display: "flex", flexDirection: "column",
    }}
    onMouseEnter={(e) => {
      if (!fading) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-strong)";
    }}
    onMouseLeave={(e) => {
      if (!fading) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
    }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px 0", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <ScoreDot score={idea.potential_score} />
          {idea.format_type && (
            <span style={{
              fontSize: 13, color: "var(--text-3)", fontWeight: 500,
              textTransform: "capitalize", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {idea.format_type}
            </span>
          )}
          {isUsed && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: "var(--text-4)",
              background: "var(--bg-subtle)", border: "1px solid var(--border)",
              borderRadius: 3, padding: "1px 6px", whiteSpace: "nowrap",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              Used
            </span>
          )}
        </div>

        {/* Overflow menu */}
        <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-4)", fontSize: 16, lineHeight: 1,
              padding: "2px 5px", borderRadius: 4,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-4)"; }}
          >
            ···
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 6, minWidth: 140, zIndex: 20, overflow: "hidden",
            }}>
              {[
                { label: isUsed ? "Mark as unused" : "Mark as used", action: () => { setMenuOpen(false); onMarkUsed(idea.id); } },
                { label: "Edit", action: () => { setMenuOpen(false); setEditText(idea.raw_text); setEditMode(true); } },
                { label: "Delete", action: handleDelete, danger: true },
              ].map(({ label, action, danger }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: "none", border: "none",
                    padding: "8px 12px", fontSize: 14, fontWeight: 500,
                    color: danger ? "var(--error)" : "var(--text-2)",
                    cursor: "pointer", transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "8px 14px 10px", flex: 1 }}>
        {editMode ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); const t = editText.trim(); if (t && t !== idea.raw_text) onEdit(idea.id, t); setEditMode(false); }
              if (e.key === "Escape") { setEditText(idea.raw_text); setEditMode(false); }
            }}
            style={{
              width: "100%", resize: "none",
              border: "1px solid #14b8a6", borderRadius: 6,
              padding: "8px 10px", fontSize: 15, lineHeight: 1.6,
              color: "var(--text)", background: "var(--bg-input)",
              outline: "none", fontFamily: "inherit", minHeight: 64,
              boxSizing: "border-box",
            }}
          />
        ) : (
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--text)", wordBreak: "break-word" }}>
            {idea.raw_text}
          </p>
        )}
      </div>

      {/* Tags */}
      {idea.tags && idea.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "0 14px 10px" }}>
          {idea.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{
              display: "inline-block", fontSize: 13, fontWeight: 500,
              color: "var(--text-3)", background: "var(--bg-subtle)",
              border: "1px solid var(--border)", borderRadius: 3,
              padding: "2px 7px", lineHeight: 1.4,
            }}>
              {tag.toLowerCase().replace(/^#/, "")}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: editMode ? "flex-end" : "flex-start",
        gap: 8, padding: "8px 14px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-subtle)",
      }}>
        {editMode ? (
          <>
            <button
              onClick={() => { setEditText(idea.raw_text); setEditMode(false); }}
              style={{
                padding: "5px 12px", fontSize: 14, fontWeight: 500,
                borderRadius: 4, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-2)", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => { const t = editText.trim(); if (t && t !== idea.raw_text) onEdit(idea.id, t); setEditMode(false); }}
              style={{
                padding: "5px 12px", fontSize: 14, fontWeight: 600,
                borderRadius: 4, border: "none",
                background: "#14b8a6", color: "#fff", cursor: "pointer",
              }}
            >
              Save
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate(`/studio?ideaId=${idea.id}`)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 12px", fontSize: 14, fontWeight: 600,
              borderRadius: 4, border: "1px solid var(--border)",
              background: "transparent", color: "var(--text-2)",
              cursor: "pointer", transition: "all 0.15s ease",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "#14b8a6";
              b.style.color = "#14b8a6";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "var(--border)";
              b.style.color = "var(--text-2)";
            }}
          >
            Validate
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
