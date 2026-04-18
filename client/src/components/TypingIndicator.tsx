export function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "8px 12px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "8px 8px 8px 2px", width: "fit-content",
        }}
        aria-label="AI is generating a response"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "#14b8a6", display: "inline-block",
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </>
  );
}
