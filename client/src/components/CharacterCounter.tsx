import React from "react";

export function CharacterCounter({ value }: { value: string }) {
  const wordCount = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  const charCount = value.length;
  const isReady = wordCount >= 100;

  return (
    <span style={{
      fontSize: 12, fontWeight: 500,
      color: isReady ? "var(--accent-text)" : "var(--text-4)",
      transition: "color var(--transition)",
    }}>
      {wordCount} words · {charCount} chars
      {isReady && " ✓"}
    </span>
  );
}
