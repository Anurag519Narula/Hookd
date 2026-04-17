import { useClipboard } from "../hooks/useClipboard";

const ClipboardIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export function CopyButton({ content }: { content: string }) {
  const { copied, copy } = useClipboard();

  return (
    <button
      onClick={() => copy(content)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", fontSize: 13, fontWeight: 500,
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${copied ? "var(--accent)" : "var(--border)"}`,
        background: copied ? "var(--accent-subtle)" : "var(--bg-card)",
        color: copied ? "var(--accent-text)" : "var(--text-2)",
        cursor: "pointer",
        transition: "all var(--transition)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
