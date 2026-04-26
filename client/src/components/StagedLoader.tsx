import { useState, useEffect, useRef } from "react";

interface StagedLoaderProps {
  isLoading: boolean;
  isError: boolean;
  onComplete?: () => void;
}

const STAGES = [
  "Understanding your idea…",
  "Checking real trends…",
  "Generating strategy…",
];

const STAGE_INTERVALS = [2000, 4000]; // ms between stage transitions

export function StagedLoader({ isLoading, isError, onComplete }: StagedLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Advance stages on timed intervals
  useEffect(() => {
    if (!isLoading || isError || done) return;

    if (stageIndex < STAGES.length - 1) {
      timerRef.current = setTimeout(() => {
        setStageIndex((prev) => prev + 1);
      }, STAGE_INTERVALS[stageIndex] ?? 2000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, isError, stageIndex, done]);

  // When loading finishes, rapidly complete remaining stages
  useEffect(() => {
    if (isLoading || done) return;

    if (stageIndex < STAGES.length - 1) {
      const rapidTimer = setTimeout(() => {
        setStageIndex(STAGES.length - 1);
      }, 300);
      return () => clearTimeout(rapidTimer);
    } else {
      setDone(true);
      onComplete?.();
    }
  }, [isLoading, stageIndex, done, onComplete]);

  // Reset when loading starts
  useEffect(() => {
    if (isLoading) {
      setStageIndex(0);
      setDone(false);
    }
  }, [isLoading]);

  if (isError) {
    return (
      <div style={{
        padding: "20px", textAlign: "center",
        color: "#ef4444", fontSize: 15,
      }}>
        Something went wrong. Please try again.
      </div>
    );
  }

  if (!isLoading && done) return null;

  return (
    <div style={{
      padding: "24px 20px", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 16,
    }}>
      {/* Spinner */}
      <div style={{
        width: 28, height: 28,
        border: "3px solid rgba(20,184,166,0.2)",
        borderTopColor: "#14b8a6", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />

      {/* Stage messages */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {STAGES.map((stage, i) => {
          const isActive = i === stageIndex;
          const isPast = i < stageIndex;
          return (
            <div key={i} style={{
              fontSize: 14,
              color: isActive ? "var(--text)" : isPast ? "var(--text-4)" : "transparent",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.3s ease",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {isPast && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {stage}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
