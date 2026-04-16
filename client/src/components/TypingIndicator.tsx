const dotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "var(--accent)",
  display: "inline-block",
};

const keyframes = `
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%            { transform: translateY(-6px); opacity: 1; }
}
`;

export function TypingIndicator() {
  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          width: "fit-content",
          boxShadow: "var(--shadow-sm)",
        }}
        aria-label="AI is generating a response"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              ...dotStyle,
              animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}
