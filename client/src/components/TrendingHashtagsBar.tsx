import { useTrending } from "../hooks/useTrending";

interface TrendingHashtagsBarProps {
  /** Called when user clicks a hashtag — e.g. to pre-fill the Amplify input */
  onSelect?: (hashtag: string) => void;
  /** Max number of hashtags to show */
  limit?: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function TrendingHashtagsBar({ onSelect, limit = 15 }: TrendingHashtagsBarProps) {
  const { hashtags, loading } = useTrending();

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[80, 100, 70, 90, 110, 75].map((w, i) => (
          <div
            key={i}
            className="shimmer-line"
            style={{ width: w, height: 28, borderRadius: 99 }}
          />
        ))}
      </div>
    );
  }

  if (hashtags.length === 0) return null;

  const visible = hashtags.slice(0, limit);

  return (
    <div>
      <p style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text-3)",
        margin: "0 0 10px",
      }}>
        Trending on Instagram
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {visible.map(({ hashtag, postCount }) => (
          <button
            key={hashtag}
            type="button"
            onClick={() => onSelect?.(hashtag)}
            title={postCount > 0 ? `${formatCount(postCount)} posts` : undefined}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 99,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--accent-text)",
              fontSize: 12,
              fontWeight: 500,
              cursor: onSelect ? "pointer" : "default",
              transition: "all var(--transition)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!onSelect) return;
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "var(--accent)";
              el.style.background = "var(--accent-subtle)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "var(--border)";
              el.style.background = "var(--bg-card)";
            }}
          >
            {hashtag}
            {postCount > 0 && (
              <span style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 400 }}>
                {formatCount(postCount)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
