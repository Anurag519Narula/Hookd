import type { ConversationMessage, CaptionResult } from "../types";
import { CaptionResultCard } from "./CaptionResultCard";

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (s < 60) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function parseCaptionResult(content: string): CaptionResult | null {
  try {
    const p = JSON.parse(content);
    if (p && typeof p === "object" && "captions" in p) return p as CaptionResult;
  } catch { /* not JSON */ }
  return null;
}

interface ChatMessageProps {
  message: ConversationMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const timeLabel = relativeTime(message.timestamp);

  if (isUser) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
        animation: "fadeUp 0.25s ease both",
      }}>
        <div style={{
          maxWidth: "72%", padding: "9px 13px",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
          borderRadius: "8px 8px 2px 8px",
          fontSize: 15, color: "var(--text)", lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {message.content}
        </div>
        <span style={{ fontSize: 12, color: "var(--text-4)", paddingRight: 2 }} aria-label={`Sent ${timeLabel}`}>
          {timeLabel}
        </span>
      </div>
    );
  }

  const captionResult = parseCaptionResult(message.content);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
      animation: "fadeUp 0.25s ease both",
    }}>
      {captionResult ? (
        <div style={{ width: "100%", maxWidth: 540 }}>
          <CaptionResultCard result={captionResult} />
        </div>
      ) : (
        <div style={{
          maxWidth: "72%", padding: "9px 13px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "8px 8px 8px 2px",
          fontSize: 15, color: "var(--text)", lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {message.content}
        </div>
      )}
      <span style={{ fontSize: 12, color: "var(--text-4)", paddingLeft: 2 }} aria-label={`Received ${timeLabel}`}>
        {timeLabel}
      </span>
    </div>
  );
}
