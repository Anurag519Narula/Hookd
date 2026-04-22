import React, { useRef, useState, useEffect } from "react";

export interface CaptureBarProps {
  onSubmit: (text: string) => Promise<void> | void;
  autoFocus?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: { [key: number]: { [key: number]: { transcript: string } } };
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void; onerror: () => void;
  start: () => void; stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

const LINE_HEIGHT = 20;
const MAX_LINES = 3;

export function CaptureBar({ onSubmit, autoFocus }: CaptureBarProps) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = LINE_HEIGHT * MAX_LINES + 20;
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
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSubmit(); }
  }

  function handleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (recording) { recognitionRef.current?.stop(); setRecording(false); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onresult = (e: SpeechRecognitionEvent) => {
      setText((prev) => prev ? prev + " " + e.results[0][0].transcript : e.results[0][0].transcript);
    };
    r.onend = () => { setRecording(false); recognitionRef.current = null; };
    r.onerror = () => { setRecording(false); recognitionRef.current = null; };
    recognitionRef.current = r;
    r.start();
    setRecording(true);
  }

  async function handlePaste() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) { setText((prev) => prev ? prev + t : t); textareaRef.current?.focus(); }
    } catch { /* silently ignore */ }
  }

  const iconBtn: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 4,
    border: "1px solid var(--border)", background: "transparent",
    color: "var(--text-3)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "all 0.15s ease",
  };

  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: 6,
      padding: "10px 12px",
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 8,
    }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What's the idea?"
        data-capture-input
        rows={1}
        style={{
          flex: 1, resize: "none", border: "none", outline: "none",
          background: "transparent", color: "var(--text)",
          fontSize: 15, lineHeight: `${LINE_HEIGHT}px`,
          padding: "5px 0", overflowY: "hidden",
          minHeight: LINE_HEIGHT + 10, fontFamily: "inherit",
        }}
        disabled={submitting}
      />

      {/* Mic */}
      <button
        onClick={handleMic}
        aria-label={recording ? "Stop recording" : "Voice input"}
        style={{
          ...iconBtn,
          ...(recording ? {
            background: "rgba(20,184,166,0.1)",
            borderColor: "rgba(20,184,166,0.3)",
            color: "#14b8a6",
          } : {}),
        }}
        onMouseEnter={(e) => { if (!recording) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
        onMouseLeave={(e) => { if (!recording) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3"/>
          <path d="M5 10a7 7 0 0 0 14 0"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="8" y1="22" x2="16" y2="22"/>
        </svg>
      </button>

      {/* Paste */}
      <button
        onClick={handlePaste}
        aria-label="Paste from clipboard"
        style={iconBtn}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>

      {/* Save */}
      <button
        onClick={() => void handleSubmit()}
        disabled={submitting || !text.trim()}
        aria-label="Save idea"
        style={{
          height: 30, padding: "0 12px", borderRadius: 4, border: "none",
          background: text.trim() && !submitting ? "#14b8a6" : "var(--bg-subtle)",
          color: text.trim() && !submitting ? "#fff" : "var(--text-4)",
          fontSize: 14, fontWeight: 600,
          cursor: text.trim() && !submitting ? "pointer" : "default",
          flexShrink: 0, transition: "all 0.15s ease", whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          if (text.trim() && !submitting) (e.currentTarget as HTMLButtonElement).style.background = "#0d9488";
        }}
        onMouseLeave={(e) => {
          if (text.trim() && !submitting) (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6";
        }}
      >
        {submitting ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
