import { useState } from "react";
import type { ConversationSession } from "../types";

function relativeDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface ConversationSidebarProps {
  sessions: ConversationSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function ConversationSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  loading = false,
}: ConversationSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...sessions].sort((a, b) => b.updated_at - a.updated_at);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      onDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={isOpen}
        style={{
          display: "none",
          position: "fixed",
          top: 72,
          left: isOpen ? 244 : 12,
          zIndex: 50,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
          color: "var(--text-2)",
          cursor: "pointer",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          transition: "left var(--transition)",
        }}
        className="sidebar-toggle"
      >
        {isOpen ? "‹" : "›"}
      </button>

      {/* Mobile backdrop — tap outside to close sidebar */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            zIndex: 39,
            background: "rgba(0,0,0,0.4)",
          }}
        />
      )}

      <style>{`
        @media (max-width: 640px) {
          .sidebar-toggle { display: flex !important; }
          .sidebar-backdrop { display: block !important; }
          .conversation-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 40;
            transform: translateX(${isOpen ? "0" : "-100%"});
            transition: transform var(--transition);
          }
        }
      `}</style>

      <aside
        className="conversation-sidebar"
        style={{
          width: 256,
          flexShrink: 0,
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
        aria-label="Conversations"
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 12px 12px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={onNew}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--accent)",
              background: "transparent",
              color: "var(--accent-text)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--transition)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-subtle)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <span aria-hidden="true">+</span>
            New conversation
          </button>
        </div>

        {/* Session list */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 6px",
          }}
          aria-label="Past conversations"
        >
          {loading && sorted.length === 0 ? (
            /* Skeleton items while loading */
            <>
              {[80, 60, 90, 70].map((width, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    marginBottom: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    className="shimmer-line"
                    style={{ width: `${width}%`, height: 13, borderRadius: 4 }}
                  />
                  <div
                    className="shimmer-line"
                    style={{ width: "40%", height: 10, borderRadius: 4 }}
                  />
                </div>
              ))}
            </>
          ) : sorted.length === 0 ? (
            <p
              style={{
                padding: "12px 8px",
                fontSize: 13,
                color: "var(--text-4)",
                textAlign: "center",
              }}
            >
              No conversations yet
            </p>
          ) : (
            sorted.map((session) => {
              const isActive = session.id === activeId;
              return (
                <div
                  key={session.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    borderRadius: "var(--radius-sm)",
                    background: isActive ? "var(--accent-subtle)" : "transparent",
                    marginBottom: 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(session.id)}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      background: "transparent",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "var(--accent-text)" : "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {session.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-4)",
                      }}
                    >
                      {relativeDate(session.updated_at)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, session.id)}
                    aria-label={`Delete conversation: ${session.title}`}
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "none",
                      background: "transparent",
                      color: "var(--text-4)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      transition: "all var(--transition)",
                      marginRight: 4,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--error)";
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--error-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-4)";
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
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

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            padding: 16,
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: 24,
              maxWidth: 360,
              width: "100%",
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="delete-dialog-title"
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              Delete conversation?
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-2)",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              This will permanently delete this conversation and all its messages.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-2)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--error)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
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
