import type { ConversationMessage, CaptionResult } from "../types";
import { CaptionResultCard } from "./CaptionResultCard";

function relativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function parseCaptionResult(content: string): CaptionResult | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && "captions" in parsed) {
      return parsed as CaptionResult;
    }
  } catch {
    // not JSON
  }
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          animation: "fadeUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) both",
        }}
      >
        <div
          style={{
            maxWidth: "75%",
            padding: "10px 14px",
            background: "var(--bg-subtle)",
            borderRadius: "var(--radius-md)",
            borderBottomRightRadius: 4,
            fontSize: 14,
            color: "var(--text)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message.content}
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-4)",
            paddingRight: 2,
          }}
          aria-label={`Sent ${timeLabel}`}
        >
          {timeLabel}
        </span>
      </div>
    );
  }

  // Assistant message
  const captionResult = parseCaptionResult(message.content);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
        animation: "fadeUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) both",
      }}
    >
      {captionResult ? (
        <div style={{ width: "100%", maxWidth: 560 }}>
          <CaptionResultCard result={captionResult} />
        </div>
      ) : (
        <div
          style={{
            maxWidth: "75%",
            padding: "10px 14px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            borderBottomLeftRadius: 4,
            fontSize: 14,
            color: "var(--text)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {message.content}
        </div>
      )}
      <span
        style={{
          fontSize: 11,
          color: "var(--text-4)",
          paddingLeft: 2,
        }}
        aria-label={`Received ${timeLabel}`}
      >
        {timeLabel}
      </span>
    </div>
  );
}
