import { useState, useEffect, useRef } from "react";
import { CircleNotch, Check, Warning } from "@phosphor-icons/react";

interface StagedLoaderProps {
  isLoading: boolean;
  isError: boolean;
  onComplete?: () => void;
}

const STAGES = [
  "Understanding your idea",
  "Checking real trends",
  "Generating strategy",
];

const STAGE_INTERVALS = [2000, 4000];

export function StagedLoader({ isLoading, isError, onComplete }: StagedLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading || isError || done) return;
    if (stageIndex < STAGES.length - 1) {
      timerRef.current = setTimeout(() => {
        setStageIndex((prev) => prev + 1);
      }, STAGE_INTERVALS[stageIndex] ?? 2000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isLoading, isError, stageIndex, done]);

  useEffect(() => {
    if (isLoading || done) return;
    if (stageIndex < STAGES.length - 1) {
      const rapidTimer = setTimeout(() => setStageIndex(STAGES.length - 1), 300);
      return () => clearTimeout(rapidTimer);
    } else {
      setDone(true);
      onComplete?.();
    }
  }, [isLoading, stageIndex, done, onComplete]);

  useEffect(() => {
    if (isLoading) { setStageIndex(0); setDone(false); }
  }, [isLoading]);

  if (isError) {
    return (
      <div style={{
        padding: "28px 24px", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 10,
      }}>
        <Warning size={18} weight="bold" color="#dc2626" />
        <span style={{ fontSize: 15, color: "#dc2626", fontWeight: 500 }}>
          Something went wrong. Please try again.
        </span>
      </div>
    );
  }

  if (!isLoading && done) return null;

  return (
    <div style={{
      padding: "32px 24px", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 20,
    }}>
      {/* Spinner */}
      <div style={{ animation: "spin 0.9s linear infinite", lineHeight: 0 }}>
        <CircleNotch size={24} weight="bold" color="var(--accent)" />
      </div>

      {/* Stage messages */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        {STAGES.map((stage, i) => {
          const isActive = i === stageIndex;
          const isPast = i < stageIndex;
          return (
            <div key={i} style={{
              fontSize: 14,
              color: isActive ? "var(--text)" : isPast ? "var(--text-4)" : "transparent",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex", alignItems: "center", gap: 8,
              letterSpacing: "-0.01em",
            }}>
              {isPast && <Check size={14} weight="bold" color="#059669" />}
              {isActive && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--accent)",
                  animation: "breathe 1.5s ease-in-out infinite",
                }} />
              )}
              {stage}
            </div>
          );
        })}
      </div>
    </div>
  );
}
