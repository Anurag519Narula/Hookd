import { useState } from "react";
import type { ClarityQuestion } from "../types/insights";

interface ClarifierInlineProps {
  questions: ClarityQuestion[];
  onComplete: (answers: Record<number, string>) => void;
  onSkip?: () => void;
}

export function ClarifierInline({ questions, onComplete, onSkip }: ClarifierInlineProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});

  const allAnswered = questions.every((_, i) => answers[i]?.trim());

  function selectOption(qIndex: number, option: string) {
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
    setCustomInputs((prev) => ({ ...prev, [qIndex]: "" }));
  }

  function handleCustomInput(qIndex: number, value: string) {
    setCustomInputs((prev) => ({ ...prev, [qIndex]: value }));
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  }

  return (
    <div style={{
      marginTop: 12, padding: "16px 18px",
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8,
    }}>
      <p style={{ fontSize: 14, color: "var(--text-3)", margin: "0 0 14px", lineHeight: 1.5 }}>
        Let's sharpen your idea for better results:
      </p>

      {questions.map((q, i) => (
        <div key={i} style={{ marginBottom: i < questions.length - 1 ? 16 : 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>
            {q.question}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {q.options.map((opt) => {
              const selected = answers[i] === opt && !customInputs[i];
              return (
                <button
                  key={opt}
                  onClick={() => selectOption(i, opt)}
                  style={{
                    padding: "6px 14px", fontSize: 13, borderRadius: 16,
                    border: selected ? "1px solid #14b8a6" : "1px solid var(--border)",
                    background: selected ? "rgba(20,184,166,0.1)" : "var(--bg)",
                    color: selected ? "#14b8a6" : "var(--text-3)",
                    cursor: "pointer", transition: "all 0.15s ease",
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Or type your own answer…"
            value={customInputs[i] ?? ""}
            onChange={(e) => handleCustomInput(i, e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", fontSize: 14,
              border: "1px solid var(--border)", borderRadius: 6,
              background: "var(--bg-input)", color: "var(--text)",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              padding: "8px 16px", fontSize: 14, borderRadius: 6,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-3)", cursor: "pointer",
            }}
          >
            Skip
          </button>
        )}
        <button
          onClick={() => allAnswered && onComplete(answers)}
          disabled={!allAnswered}
          style={{
            padding: "8px 18px", fontSize: 14, fontWeight: 600, borderRadius: 6,
            border: "none",
            background: allAnswered ? "#14b8a6" : "var(--bg-hover)",
            color: allAnswered ? "#fff" : "var(--text-4)",
            cursor: allAnswered ? "pointer" : "not-allowed",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
