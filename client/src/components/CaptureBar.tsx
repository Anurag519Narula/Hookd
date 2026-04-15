import React, { useRef, useState, useEffect } from "react";

export interface CaptureBarProps {
  onSubmit: (text: string) => Promise<void> | void;
  autoFocus?: boolean;
}

// Add types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

const MicIcon = ({ recording }: { recording: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: recording ? "var(--accent)" : "currentColor" }}
  >
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

const ClipboardIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="2" width="6" height="4" rx="1" />
    <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
  </svg>
);

// Line height in px for the textarea
const LINE_HEIGHT = 22;
const MAX_LINES = 3;

export function CaptureBar({ onSubmit, autoFocus }: CaptureBarProps) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-focus when requested
  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  // Adjust textarea height on text change
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = LINE_HEIGHT * MAX_LINES + 20; // +20 for padding
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [text]);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setText("");
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Shift+Enter: default behavior (newline) — no override needed
  }

  function handleMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onend = () => {
      setRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  async function handlePaste() {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText((prev) => (prev ? prev + clipText : clipText));
        textareaRef.current?.focus();
      }
    } catch {
      // Clipboard access denied — silently ignore
    }
  }

  const iconBtnStyle: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--bg-subtle)",
    color: "var(--text-2)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all var(--transition)",
  };

  const micBtnStyle: React.CSSProperties = {
    ...iconBtnStyle,
    ...(recording
      ? {
          background: "var(--accent-subtle)",
          borderColor: "var(--accent)",
          color: "var(--accent)",
          animation: "pulse-glow 1.4s ease-in-out infinite",
        }
      : {}),
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        padding: "12px 16px",
        background: "var(--bg-card)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What's the idea?"
        data-capture-input
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--text)",
          fontSize: 14,
          lineHeight: `${LINE_HEIGHT}px`,
          padding: "6px 0",
          overflowY: "hidden",
          minHeight: LINE_HEIGHT + 12,
        }}
        disabled={submitting}
      />

      {/* Mic button */}
      <button
        onClick={handleMic}
        aria-label={recording ? "Stop recording" : "Start voice input"}
        style={micBtnStyle}
        onMouseEnter={(e) => {
          if (!recording) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (!recording) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)";
        }}
      >
        <MicIcon recording={recording} />
      </button>

      {/* Clipboard paste button */}
      <button
        onClick={handlePaste}
        aria-label="Paste from clipboard"
        style={iconBtnStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)"; }}
      >
        <ClipboardIcon />
      </button>

      {/* Save idea button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !text.trim()}
        aria-label="Save idea"
        style={{
          height: 34,
          padding: "0 14px",
          borderRadius: "var(--radius-sm)",
          border: "none",
          background: text.trim() && !submitting ? "var(--accent)" : "var(--bg-subtle)",
          color: text.trim() && !submitting ? "#fff" : "var(--text-3)",
          fontSize: 13,
          fontWeight: 600,
          cursor: text.trim() && !submitting ? "pointer" : "default",
          flexShrink: 0,
          transition: "all var(--transition)",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          if (text.trim() && !submitting)
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
        }}
        onMouseLeave={(e) => {
          if (text.trim() && !submitting)
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
        }}
      >
        {submitting ? "Saving…" : "Save idea"}
      </button>
    </div>
  );
}
