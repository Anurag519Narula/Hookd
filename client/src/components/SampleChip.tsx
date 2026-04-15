import React, { useState } from "react";

interface SampleChipProps {
  label: string;
  sampleText: string;
  onSelect: (text: string) => void;
}

export function SampleChip({ label, sampleText, onSelect }: SampleChipProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(sampleText)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        fontSize: 13,
        borderRadius: 999,
        border: `1px solid ${hovered ? "#0d9488" : "#d4d0cb"}`,
        background: hovered ? "#f0fdfb" : "#faf9f7",
        color: hovered ? "#0d9488" : "#555",
        cursor: "pointer",
        transition: "border-color 0.15s, color 0.15s, background 0.15s",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}
