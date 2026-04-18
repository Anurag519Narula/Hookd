import { useState, useMemo } from "react";
import { Navbar } from "../components/Navbar";
import { CaptureBar } from "../components/CaptureBar";
import { IdeaCard } from "../components/IdeaCard";
import { useVault } from "../hooks/useVault";
import { createIdea, updateIdea, deleteIdea } from "../api/ideas";
import type { Idea } from "../types/index";

type FilterChip = "All" | "High potential" | "Medium" | "Story" | "Talking head" | "Unused";
type SortOption = "Newest" | "Highest potential" | "Oldest";

const FILTER_CHIPS: FilterChip[] = ["All", "High potential", "Medium", "Story", "Talking head", "Unused"];
const SORT_OPTIONS: SortOption[] = ["Newest", "Highest potential", "Oldest"];
const SCORE_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function applyFilter(ideas: Idea[], filter: FilterChip): Idea[] {
  switch (filter) {
    case "All":            return ideas;
    case "High potential": return ideas.filter((i) => i.potential_score === "high");
    case "Medium":         return ideas.filter((i) => i.potential_score === "medium");
    case "Story":          return ideas.filter((i) => i.format_type?.toLowerCase() === "story");
    case "Talking head":   return ideas.filter((i) => i.format_type?.toLowerCase() === "talking head");
    case "Unused":         return ideas.filter((i) => i.status === "raw");
    default:               return ideas;
  }
}

function applySort(ideas: Idea[], sort: SortOption): Idea[] {
  const copy = [...ideas];
  switch (sort) {
    case "Newest":           return copy.sort((a, b) => b.created_at - a.created_at);
    case "Oldest":           return copy.sort((a, b) => a.created_at - b.created_at);
    case "Highest potential": return copy.sort((a, b) => {
      const aS = SCORE_ORDER[a.potential_score ?? "low"] ?? 2;
      const bS = SCORE_ORDER[b.potential_score ?? "low"] ?? 2;
      return aS - bS;
    });
    default: return copy;
  }
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ code, onRetry, onSignIn }: { code: string; onRetry: () => void; onSignIn: () => void }) {
  const configs: Record<string, { title: string; body: string; primary: string; secondary?: string }> = {
    AUTH_ERROR:    { title: "Session expired", body: "Sign in again to access your vault.", primary: "Sign in" },
    NETWORK_ERROR: { title: "No connection", body: "Check your internet connection and try again.", primary: "Retry" },
    SERVER_ERROR:  { title: "Server hiccup", body: "Something went wrong on our end. Try again in a moment.", primary: "Retry", secondary: "Reload page" },
  };
  const cfg = configs[code] ?? { title: "Couldn't load your vault", body: "An unexpected error occurred.", primary: "Retry", secondary: "Reload page" };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16, textAlign: "center", padding: "0 24px" }}>
      <div style={{ maxWidth: 360 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>{cfg.title}</p>
        <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>{cfg.body}</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={code === "AUTH_ERROR" ? onSignIn : onRetry}
          style={{ padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 6, border: "none", background: "#14b8a6", color: "#fff", cursor: "pointer" }}
        >
          {cfg.primary}
        </button>
        {cfg.secondary && (
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}
          >
            {cfg.secondary}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onCaptureFocus }: { onCaptureFocus?: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: 16, textAlign: "center", padding: "0 24px" }}>
      <div style={{ maxWidth: 360 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>Your vault is empty</p>
        <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.65, margin: 0 }}>
          Capture ideas before they slip away. Type anything above — a hook, a topic, a rough thought.
        </p>
      </div>
      {onCaptureFocus && (
        <button
          onClick={onCaptureFocus}
          style={{ padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 6, border: "none", background: "#14b8a6", color: "#fff", cursor: "pointer" }}
        >
          Capture your first idea
        </button>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

export function VaultScreen() {
  const vault = useVault();
  const [filter, setFilter] = useState<FilterChip>("All");
  const [sort, setSort] = useState<SortOption>("Newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredAndSorted = useMemo(() => {
    return applySort(applyFilter(vault.ideas, filter), sort);
  }, [vault.ideas, filter, sort]);

  // Reset pagination when filter/sort changes
  const prevFilter = useMemo(() => filter, [filter]);
  const prevSort = useMemo(() => sort, [sort]);
  useMemo(() => { setVisibleCount(PAGE_SIZE); }, [prevFilter, prevSort]);

  const visibleIdeas = filteredAndSorted.slice(0, visibleCount);
  const hasMore = filteredAndSorted.length > visibleCount;

  async function handleCapture(text: string) {
    const idea = await createIdea(text);
    vault.addIdea(idea);
  }

  async function handleMarkUsed(id: string) {
    const idea = vault.ideas.find((i) => i.id === id);
    const newStatus = idea?.status === "used" ? "raw" : "used";
    const updated = await updateIdea(id, { status: newStatus });
    vault.updateIdea(id, updated);
  }

  async function handleEdit(id: string, newText: string) {
    const updated = await updateIdea(id, { raw_text: newText });
    vault.updateIdea(id, updated);
  }

  async function handleDelete(id: string) {
    await deleteIdea(id);
    vault.removeIdea(id);
  }

  function handleFocusCapture() {
    const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>("[data-capture-input]");
    input?.focus();
  }

  const isEmpty = !vault.loading && !vault.error && vault.ideas.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* ── Page header ── */}
      <div style={{
        maxWidth: 900, margin: "0 auto",
        padding: "32px 24px 24px",
        borderBottom: "1px solid var(--border)",
      }}>
        <h1 style={{
          fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700,
          letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 6px",
          lineHeight: 1.2,
        }}>
          Idea Vault
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>
          Capture raw ideas. AI scores and tags each one so you know what's worth developing.
        </p>
      </div>

      {/* ── Sticky capture + filter bar ── */}
      <div style={{
        position: "sticky", top: 60, zIndex: 50,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 24px 10px" }}>
          <CaptureBar onSubmit={handleCapture} />
        </div>

        {/* Filter + sort */}
        <div style={{
          maxWidth: 900, margin: "0 auto",
          padding: "0 24px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {FILTER_CHIPS.map((chip) => {
              const active = filter === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setFilter(chip)}
                  style={{
                    padding: "4px 10px", fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    borderRadius: 4,
                    border: active ? "1px solid rgba(20,184,166,0.4)" : "1px solid var(--border)",
                    background: active ? "rgba(20,184,166,0.08)" : "transparent",
                    color: active ? "#14b8a6" : "var(--text-3)",
                    cursor: "pointer", transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                    }
                  }}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{
              padding: "4px 8px", fontSize: 12, fontWeight: 500,
              borderRadius: 4, border: "1px solid var(--border)",
              background: "var(--bg-card)", color: "var(--text-2)",
              cursor: "pointer", outline: "none",
            }}
          >
            {SORT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 80px" }}>

        {vault.error && (
          <ErrorState
            code={vault.error}
            onRetry={() => window.location.reload()}
            onSignIn={() => window.location.replace("/")}
          />
        )}

        {vault.loading && !vault.error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }} className="vault-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "18px 16px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="shimmer-line" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%" }} />
                  <span className="shimmer-line" style={{ display: "inline-block", width: 70, height: 12, borderRadius: 4 }} />
                </div>
                <span className="shimmer-line" style={{ display: "block", width: "100%", height: 52, borderRadius: 6 }} />
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="shimmer-line" style={{ display: "inline-block", width: 50, height: 20, borderRadius: 4 }} />
                  <span className="shimmer-line" style={{ display: "inline-block", width: 70, height: 20, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {isEmpty && <EmptyState onCaptureFocus={handleFocusCapture} />}

        {!vault.loading && !vault.error && visibleIdeas.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }} className="vault-grid">
              {visibleIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id} idea={idea}
                  onMarkUsed={handleMarkUsed}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  style={{
                    padding: "8px 20px", fontSize: 12, fontWeight: 600,
                    borderRadius: 6, border: "1px solid var(--border)",
                    background: "transparent", color: "var(--text-2)",
                    cursor: "pointer", transition: "all 0.15s ease",
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
                  Load more ({filteredAndSorted.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {!vault.loading && !vault.error && vault.ideas.length > 0 && filteredAndSorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", fontSize: 13, color: "var(--text-3)" }}>
            No ideas match this filter.
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) { .vault-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
