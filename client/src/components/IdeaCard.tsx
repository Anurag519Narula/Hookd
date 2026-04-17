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
  low: "#8a8580",
  medium: "#EF9F27",
  high: "#D85A30",
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
      <span
        style={{
          display: "inline-block",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          cursor: "default",
        }}
      />
      {showTooltip && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--text)",
            color: "var(--bg-card)",
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {label} potential
        </span>
      )}
    </span>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        fontWeight: 500,
        color: "var(--text-2)",
        background: "var(--bg-subtle)",
        border: "1px solid var(--border)",
        borderRadius: 99,
        padding: "3px 10px",
        lineHeight: 1.4,
      }}
    >
      {label.toLowerCase().replace(/^#/, "")}
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

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Auto-focus textarea when entering edit mode
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

  function handleMarkUsed() {
    setMenuOpen(false);
    onMarkUsed(idea.id);
  }

  function handleEditStart() {
    setMenuOpen(false);
    setEditText(idea.raw_text);
    setEditMode(true);
  }

  function handleEditSave() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== idea.raw_text) {
      onEdit(idea.id, trimmed);
    }
    setEditMode(false);
  }

  function handleEditCancel() {
    setEditText(idea.raw_text);
    setEditMode(false);
  }

  const isUsed = idea.status === "used";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        transition: `box-shadow var(--transition), transform var(--transition), opacity 0.3s ease`,
        opacity: fading ? 0 : isUsed ? 0.6 : 1,
        transform: fading ? "translateY(8px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        if (fading) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "var(--shadow-md)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        if (fading) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "var(--shadow-sm)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px 0",
          gap: 8,
        }}
      >
        {/* Score dot + format type */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <ScoreDot score={idea.potential_score} />
          {idea.format_type && (
            <span
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                fontWeight: 400,
                textTransform: "capitalize",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {idea.format_type}
            </span>
          )}
          {isUsed && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: "var(--text-3)",
              background: "var(--bg-hover)", border: "1px solid var(--border)",
              borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap",
            }}>
              Used
            </span>
          )}
        </div>

        {/* ··· overflow menu */}
        <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-3)",
              fontSize: 18,
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
              transition: "background var(--transition), color var(--transition)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
            }}
          >
            ···
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                minWidth: 148,
                zIndex: 20,
                overflow: "hidden",
              }}
            >
              {[
                { label: isUsed ? "Mark as unused" : "Mark as used", action: handleMarkUsed },
                { label: "Edit", action: handleEditStart },
                { label: "Delete", action: handleDelete, danger: true },
              ].map(({ label, action, danger }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "9px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: danger ? "var(--error)" : "var(--text-2)",
                    cursor: "pointer",
                    transition: "background var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "none";
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Raw text / edit area */}
      <div style={{ padding: "10px 16px 12px", flex: 1 }}>
        {editMode ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleEditSave();
              }
              if (e.key === "Escape") handleEditCancel();
            }}
            style={{
              width: "100%",
              resize: "none",
              border: "1px solid var(--accent)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 10px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--text)",
              background: "var(--bg-input)",
              outline: "none",
              fontFamily: "inherit",
              minHeight: 72,
            }}
          />
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--text)",
              wordBreak: "break-word",
            }}
          >
            {idea.raw_text}
          </p>
        )}
      </div>

      {/* Tags row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: "0 16px 12px",
          alignItems: "center",
        }}
      >
        {idea.tags?.slice(0, 3).map((tag) => <TagChip key={tag} label={tag} />)}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: editMode ? "flex-end" : "space-between",
          gap: 8,
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-subtle)",
        }}
      >
        {editMode ? (
          <>
            <button
              onClick={handleEditCancel}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-2)",
                cursor: "pointer",
                transition: "all var(--transition)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--accent)",
                background: "var(--accent)",
                color: "#fff",
                cursor: "pointer",
                transition: "all var(--transition)",
              }}
            >
              Save
            </button>
          </>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Always show: open in Studio to validate */}
            <button
              onClick={() => navigate(`/studio?ideaId=${idea.id}`)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "7px 14px", fontSize: 13, fontWeight: 500,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-2)",
                cursor: "pointer", transition: "all var(--transition)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
              }}
            >
              🔬 Validate
            </button>

            {/* Only show if insights are cached */}
            {idea.insights && (
              <button
                onClick={() => navigate(`/insights/${idea.id}`, { state: { idea } })}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "7px 14px", fontSize: 13, fontWeight: 500,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--accent)",
                  background: "var(--accent-subtle)",
                  color: "var(--accent-text)",
                  cursor: "pointer", transition: "all var(--transition)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-subtle)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-text)";
                }}
              >
                Insights →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
