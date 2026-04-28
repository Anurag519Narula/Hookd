import { useState } from "react";
import { motion } from "framer-motion";
import { ChatCircleDots } from "@phosphor-icons/react";
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        marginTop: 12, padding: "18px 20px",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
      }}>
        <ChatCircleDots size={16} weight="duotone" color="var(--accent)" />
        <p style={{
          fontSize: 14, color: "var(--text-3)", margin: 0, lineHeight: 1.5,
        }}>
          Let's sharpen your idea for better results
        </p>
      </div>

      {questions.map((q, i) => (
        <div key={i} style={{ marginBottom: i < questions.length - 1 ? 18 : 0 }}>
          <p style={{
            fontSize: 15, fontWeight: 600, color: "var(--text)",
            margin: "0 0 10px", letterSpacing: "-0.01em",
          }}>
            {q.question}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {q.options.map((opt) => {
              const selected = answers[i] === opt && !customInputs[i];
              return (
                <button
                  key={opt}
                  onClick={() => selectOption(i, opt)}
                  className="btn-tactile"
                  style={{
                    padding: "7px 16px", fontSize: 13, borderRadius: 8,
                    border: selected ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: selected ? "rgba(5,150,105,0.06)" : "var(--bg)",
                    color: selected ? "var(--accent)" : "var(--text-3)",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    fontWeight: selected ? 600 : 400,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Or type your own answer..."
            value={customInputs[i] ?? ""}
            onChange={(e) => handleCustomInput(i, e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", fontSize: 14,
              border: "1px solid var(--border)", borderRadius: 8,
              background: "var(--bg-input)", color: "var(--text)",
              outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s ease",
              letterSpacing: "-0.005em",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          />
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        {onSkip && (
          <button
            onClick={onSkip}
            className="btn-tactile"
            style={{
              padding: "9px 18px", fontSize: 14, borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-3)", cursor: "pointer",
              transition: "all 0.15s ease",
              letterSpacing: "-0.005em",
            }}
          >
            Skip
          </button>
        )}
        <button
          onClick={() => allAnswered && onComplete(answers)}
          disabled={!allAnswered}
          className="btn-tactile"
          style={{
            padding: "9px 20px", fontSize: 14, fontWeight: 600, borderRadius: 8,
            border: "none",
            background: allAnswered ? "var(--accent)" : "var(--bg-hover)",
            color: allAnswered ? "#fff" : "var(--text-4)",
            cursor: allAnswered ? "pointer" : "not-allowed",
            transition: "all 0.15s ease",
            letterSpacing: "-0.005em",
          }}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
