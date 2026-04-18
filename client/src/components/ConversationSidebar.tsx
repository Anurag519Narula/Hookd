import { useState } from "react";
import type { ConversationSession } from "../types";

function relativeDate(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 86400000);
  const h = Math.floor((Date.now() - ts) / 3600000);
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (h < 1) return `${m}m ago`;
  if (d < 1) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface ConversationSidebarProps {
  sessions: ConversationSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function ConversationSidebar({ sessions, activeId, onSelect, onNew, onDelete, loading = false }: ConversationSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const sorted = [...sessions].sort((a, b) => b.updated_at - a.updated_at);

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .sidebar-toggle { display: flex !important; }
          .sidebar-backdrop { display: block !important; }
          .conversation-sidebar {
            position: fixed !important; top: 0; left: 0;
            height: 100vh; z-index: 40;
            transform: translateX(${isOpen ? "0" : "-100%"});
            transition: transform 0.2s ease;
          }
        }
      `}</style>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="sidebar-toggle"
        style={{
          display: "none", position: "fixed",
          top: 72, left: isOpen ? 236 : 12, zIndex: 50,
          width: 24, height: 24, borderRadius: "50%",
          border: "1px solid var(--border)", background: "var(--bg-card)",
          color: "var(--text-3)", cursor: "pointer",
          alignItems: "center", justifyContent: "center",
          fontSize: 11, transition: "left 0.2s ease",
        }}
      >
        {isOpen ? "‹" : "›"}
      </button>

      {isOpen && (
        <div
          aria-hidden="true"
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            display: "none", position: "fixed", inset: 0,
            zIndex: 39, background: "rgba(0,0,0,0.4)",
          }}
        />
      )}

      <aside
        className="conversation-sidebar"
        style={{
          width: 240, flexShrink: 0,
          background: "var(--bg)",
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          height: "100%", overflow: "hidden",
        }}
        aria-label="Conversations"
      >
        {/* Header */}
        <div style={{ padding: "12px 10px", borderBottom: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={onNew}
            style={{
              width: "100%", padding: "7px 12px",
              borderRadius: 6, border: "1px solid var(--border)",
              background: "transparent", color: "var(--text-2)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
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
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New conversation
          </button>
        </div>

        {/* Session list */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "6px 6px" }} aria-label="Past conversations">
          {loading && sorted.length === 0 ? (
            [80, 60, 90, 70].map((w, i) => (
              <div key={i} style={{ padding: "8px 8px", marginBottom: 2, display: "flex", flexDirection: "column", gap: 5 }}>
                <div className="shimmer-line" style={{ width: `${w}%`, height: 12, borderRadius: 3 }} />
                <div className="shimmer-line" style={{ width: "35%", height: 9, borderRadius: 3 }} />
              </div>
            ))
          ) : sorted.length === 0 ? (
            <p style={{ padding: "12px 8px", fontSize: 12, color: "var(--text-4)", textAlign: "center" }}>
              No conversations yet
            </p>
          ) : (
            sorted.map((session) => {
              const isActive = session.id === activeId;
              return (
                <div key={session.id} style={{
                  display: "flex", alignItems: "center", gap: 2,
                  borderRadius: 6,
                  background: isActive ? "rgba(20,184,166,0.08)" : "transparent",
                  marginBottom: 1,
                }}>
                  <button
                    type="button"
                    onClick={() => onSelect(session.id)}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      flex: 1, padding: "7px 8px",
                      background: "transparent", border: "none",
                      borderRadius: 6, cursor: "pointer",
                      textAlign: "left", display: "flex",
                      flexDirection: "column", gap: 2, minWidth: 0,
                    }}
                  >
                    <span style={{
                      fontSize: 12, fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#14b8a6" : "var(--text)",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", display: "block",
                    }}>
                      {session.title}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-4)" }}>
                      {relativeDate(session.updated_at)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }}
                    aria-label={`Delete: ${session.title}`}
                    style={{
                      flexShrink: 0, width: 24, height: 24, borderRadius: 4,
                      border: "none", background: "transparent",
                      color: "var(--text-4)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, transition: "all 0.15s ease", marginRight: 4,
                    }}
                    onMouseEnter={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.color = "var(--error)";
                      b.style.background = "rgba(248,113,113,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.color = "var(--text-4)";
                      b.style.background = "transparent";
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </nav>
      </aside>

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div
          role="dialog" aria-modal="true"
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", padding: 16,
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "20px 24px",
              maxWidth: 340, width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              Delete conversation?
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 18, lineHeight: 1.6 }}>
              This will permanently delete this conversation and all its messages.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  padding: "6px 14px", borderRadius: 4,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-2)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { if (confirmDeleteId) { onDelete(confirmDeleteId); setConfirmDeleteId(null); } }}
                style={{
                  padding: "6px 14px", borderRadius: 4, border: "none",
                  background: "var(--error)", color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
