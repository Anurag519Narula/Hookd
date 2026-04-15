import React from "react";
import { CaptureBar } from "./CaptureBar";

export interface CaptureSlideOverProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void> | void;
}

const CloseIcon = () => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function CaptureSlideOver({ open, onClose, onSubmit }: CaptureSlideOverProps) {
  async function handleSubmit(text: string) {
    await onSubmit(text);
    onClose();
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    justifyContent: "flex-end",
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    transition: "opacity var(--transition)",
  };

  const backdropStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(2px)",
    WebkitBackdropFilter: "blur(2px)",
  };

  const panelStyle: React.CSSProperties = {
    position: "relative",
    width: 400,
    maxWidth: "100vw",
    height: "100%",
    background: "var(--bg-card)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderLeft: "1px solid var(--border)",
    borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    display: "flex",
    flexDirection: "column",
    transform: open ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  return (
    <div style={overlayStyle} aria-hidden={!open}>
      {/* Backdrop */}
      <div style={backdropStyle} onClick={onClose} />

      {/* Panel */}
      <div style={panelStyle} role="dialog" aria-modal="true" aria-label="Capture idea">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Capture idea</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
              Save it before it slips away
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-subtle)",
              color: "var(--text-2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all var(--transition)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)";
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, flex: 1 }}>
          <CaptureBar onSubmit={handleSubmit} autoFocus={open} />
        </div>
      </div>
    </div>
  );
}
