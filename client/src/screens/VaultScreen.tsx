import { useState, useMemo } from "react";
import { Navbar } from "../components/Navbar";
import { CaptureBar } from "../components/CaptureBar";
import { IdeaCard } from "../components/IdeaCard";
import { useVault } from "../hooks/useVault";
import { createIdea, updateIdea, deleteIdea } from "../api/ideas";
import type { Idea } from "../types/index";

// ── Filter / Sort types ────────────────────────────────────────────────────────
type FilterChip = "All" | "High potential" | "Medium" | "Story" | "Talking head" | "Unused";
type SortOption = "Newest" | "Highest potential" | "Oldest";

const FILTER_CHIPS: FilterChip[] = ["All", "High potential", "Medium", "Story", "Talking head", "Unused"];
const SORT_OPTIONS: SortOption[] = ["Newest", "Highest potential", "Oldest"];

const SCORE_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function applyFilter(ideas: Idea[], filter: FilterChip): Idea[] {
  switch (filter) {
    case "All":           return ideas;
    case "High potential": return ideas.filter((i) => i.potential_score === "high");
    case "Medium":        return ideas.filter((i) => i.potential_score === "medium");
    case "Story":         return ideas.filter((i) => i.format_type?.toLowerCase() === "story");
    case "Talking head":  return ideas.filter((i) => i.format_type?.toLowerCase() === "talking head");
    case "Unused":        return ideas.filter((i) => i.status === "raw");
    default:              return ideas;
  }
}

function applySort(ideas: Idea[], sort: SortOption): Idea[] {
  const copy = [...ideas];
  switch (sort) {
    case "Newest":
      return copy.sort((a, b) => b.created_at - a.created_at);
    case "Oldest":
      return copy.sort((a, b) => a.created_at - b.created_at);
    case "Highest potential":
      return copy.sort((a, b) => {
        const aScore = SCORE_ORDER[a.potential_score ?? "low"] ?? 2;
        const bScore = SCORE_ORDER[b.potential_score ?? "low"] ?? 2;
        return aScore - bScore;
      });
    default:
      return copy;
  }
}


// ── Error state ────────────────────────────────────────────────────────────────
type ErrorConfig = {
  icon: string;
  iconBg: string;
  iconBorder: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryAction: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
};

function getErrorConfig(
  code: string,
  onRetry: () => void,
  onSignIn: () => void
): ErrorConfig {
  switch (code) {
    case "AUTH_ERROR":
      return {
        icon: "🔒",
        iconBg: "rgba(251,191,36,0.12)",
        iconBorder: "rgba(251,191,36,0.4)",
        title: "Session expired",
        description:
          "Your session has expired or you're not signed in. Sign in again to access your vault.",
        primaryLabel: "Sign in",
        primaryAction: onSignIn,
      };
    case "NETWORK_ERROR":
      return {
        icon: "📡",
        iconBg: "rgba(99,102,241,0.1)",
        iconBorder: "rgba(99,102,241,0.35)",
        title: "No connection",
        description:
          "Couldn't reach the server. Check your internet connection and try again.",
        primaryLabel: "Retry",
        primaryAction: onRetry,
      };
    case "SERVER_ERROR":
      return {
        icon: "🛠",
        iconBg: "rgba(239,68,68,0.1)",
        iconBorder: "rgba(239,68,68,0.35)",
        title: "Server hiccup",
        description:
          "Something went wrong on our end. This is temporary — please try again in a moment.",
        primaryLabel: "Retry",
        primaryAction: onRetry,
        secondaryLabel: "Reload page",
        secondaryAction: () => window.location.reload(),
      };
    default:
      return {
        icon: "⚠️",
        iconBg: "rgba(239,68,68,0.1)",
        iconBorder: "rgba(239,68,68,0.35)",
        title: "Couldn't load your vault",
        description:
          "An unexpected error occurred. Try retrying or reloading the page.",
        primaryLabel: "Retry",
        primaryAction: onRetry,
        secondaryLabel: "Reload page",
        secondaryAction: () => window.location.reload(),
      };
  }
}

function ErrorState({
  code,
  onRetry,
  onSignIn,
}: {
  code: string;
  onRetry: () => void;
  onSignIn: () => void;
}) {
  const cfg = getErrorConfig(code, onRetry, onSignIn);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 20,
        textAlign: "center",
        padding: "0 24px",
        animation: "fadeUp 0.35s ease both",
      }}
    >
      {/* Icon badge */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: cfg.iconBg,
          border: `1.5px solid ${cfg.iconBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          boxShadow: `0 0 24px ${cfg.iconBg}`,
        }}
      >
        {cfg.icon}
      </div>

      {/* Text */}
      <div style={{ maxWidth: 380 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
          {cfg.title}
        </p>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>
          {cfg.description}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={cfg.primaryAction}
          style={{
            padding: "10px 26px",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--accent)",
            background: "var(--accent)",
            color: "#fff",
            cursor: "pointer",
            transition: "opacity var(--transition)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          {cfg.primaryLabel}
        </button>
        {cfg.secondaryLabel && cfg.secondaryAction && (
          <button
            onClick={cfg.secondaryAction}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-2)",
              cursor: "pointer",
              transition: "opacity var(--transition)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            {cfg.secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ onCaptureFocus }: { onCaptureFocus?: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "52vh",
        gap: 24,
        textAlign: "center",
        padding: "0 24px",
        animation: "fadeUp 0.4s ease both",
      }}
    >
      {/* Vault icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "linear-gradient(135deg, var(--accent-subtle), rgba(99,102,241,0.08))",
          border: "1.5px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          boxShadow: "0 4px 24px rgba(13,148,136,0.08)",
        }}
      >
        🗂️
      </div>

      <div style={{ maxWidth: 360 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 10px" }}>
          Your vault is empty
        </p>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, margin: 0 }}>
          Capture ideas before they slip away. Type anything in the bar above — a hook,
          a topic, a rough thought — and it'll be here when you're ready.
        </p>
      </div>

      {onCaptureFocus && (
        <button
          onClick={onCaptureFocus}
          style={{
            padding: "11px 28px",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--accent)",
            background: "var(--accent)",
            color: "#fff",
            cursor: "pointer",
            transition: "opacity var(--transition)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          + Capture your first idea
        </button>
      )}
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export function VaultScreen() {
  const vault = useVault();
  const [filter, setFilter] = useState<FilterChip>("All");
  const [sort, setSort] = useState<SortOption>("Newest");
  const filteredAndSorted = useMemo(() => {
    const filtered = applyFilter(vault.ideas, filter);
    return applySort(filtered, sort);
  }, [vault.ideas, filter, sort]);

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
    const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      "[data-capture-input]"
    );
    input?.focus();
  }

  const isEmpty = !vault.loading && !vault.error && vault.ideas.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Background glows */}
      <div
        style={{
          position: "fixed", top: -200, right: -200, width: 600, height: 600,
          background: "radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed", bottom: -100, left: -100, width: 400, height: 400,
          background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }}
      />

      <Navbar />

      {/* Page header */}
      <div style={{
        maxWidth: 900, margin: "0 auto",
        padding: "48px 24px 32px",
        borderBottom: "1px solid var(--border)",
        position: "relative", zIndex: 1,
      }}>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 12px",
        }}>
          Idea Vault
        </p>
        <h1 style={{
          fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800,
          letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 8px",
        }}>
          Your ideas, organised.
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
          Capture raw ideas before they disappear. The AI tags and scores each one so you know what's worth developing.
        </p>
      </div>

      {/* Sticky capture + filter bar */}
      <div
        style={{
          position: "sticky",
          top: 60,
          zIndex: 50,
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: 0,
        }}
      >
        {/* CaptureBar */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 24px 12px" }}>
          <CaptureBar onSubmit={handleCapture} />
        </div>

        {/* Filter + sort row */}
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "0 24px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Filter chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILTER_CHIPS.map((chip) => {
              const active = filter === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setFilter(chip)}
                  style={{
                    padding: "5px 12px",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    borderRadius: 99,
                    border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: active ? "var(--accent-subtle)" : "var(--bg-card)",
                    color: active ? "var(--accent-text)" : "var(--text-2)",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
                    }
                  }}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* Sort control */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{
              padding: "5px 10px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-2)",
              cursor: "pointer",
              outline: "none",
              transition: "all var(--transition)",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Page content */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "24px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Error state */}
        {vault.error && (
          <ErrorState
            code={vault.error}
            onRetry={() => window.location.reload()}
            onSignIn={() => window.location.replace("/")}
          />
        )}

        {/* Loading skeleton */}
        {vault.loading && !vault.error && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
            className="vault-grid"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="shimmer-line" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%" }} />
                  <span className="shimmer-line" style={{ display: "inline-block", width: 80, height: 13, borderRadius: 4 }} />
                </div>
                <span className="shimmer-line" style={{ display: "block", width: "100%", height: 60, borderRadius: 6 }} />
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="shimmer-line" style={{ display: "inline-block", width: 60, height: 22, borderRadius: 99 }} />
                  <span className="shimmer-line" style={{ display: "inline-block", width: 80, height: 22, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && <EmptyState onCaptureFocus={handleFocusCapture} />}

        {/* Idea cards grid */}
        {!vault.loading && !vault.error && filteredAndSorted.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
            className="vault-grid"
          >
            {filteredAndSorted.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onMarkUsed={handleMarkUsed}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Filtered empty state */}
        {!vault.loading && !vault.error && vault.ideas.length > 0 && filteredAndSorted.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              color: "var(--text-3)",
              fontSize: 14,
            }}
          >
            No ideas match this filter.
          </div>
        )}
      </div>

      {/* Responsive grid CSS */}
      <style>{`
        @media (max-width: 640px) {
          .vault-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
