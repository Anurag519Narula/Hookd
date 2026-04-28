import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pulse, Target, Binoculars,
  ListChecks, Warning as WarningIcon, Eye,
} from "@phosphor-icons/react";
import { InsightReport } from "../types/insights";
import { Badge, reachColor, diffColor } from "./ui";

interface MarketResearchPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  insights: InsightReport | null;
  isLoading: boolean;
}

type StrategyTab = "angles" | "untapped" | "risks" | "competitors" | "plan";

const TAB_CONFIG: { key: StrategyTab; label: string; icon: React.ReactNode }[] = [
  { key: "angles",      label: "Angles",      icon: <Target size={13} weight="bold" /> },
  { key: "untapped",    label: "Untapped",     icon: <Binoculars size={13} weight="bold" /> },
  { key: "risks",       label: "Risks",        icon: <WarningIcon size={13} weight="bold" /> },
  { key: "competitors", label: "Competitors",  icon: <Eye size={13} weight="bold" /> },
  { key: "plan",        label: "Action Plan",  icon: <ListChecks size={13} weight="bold" /> },
];

function LoadingSkeleton() {
  return (
    <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", gap: 28 }}>
      <div className="shimmer-line" style={{ height: 88, borderRadius: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="shimmer-line" style={{ height: 64, borderRadius: 10 }} />
        ))}
      </div>
      <div className="shimmer-line" style={{ height: 120, borderRadius: 10 }} />
    </div>
  );
}

export function MarketResearchPanel({
  isOpen, onToggle, insights, isLoading,
}: MarketResearchPanelProps) {
  const hasData = !!insights && !isLoading;

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="btn-tactile"
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "16px 24px",
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--text)", textAlign: "left", gap: 12,
          borderBottom: isOpen ? "1px solid var(--border)" : "none",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Pulse size={16} weight="bold" color="var(--accent)" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Strategy & Angles
          </span>
          {isLoading && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: 6,
              fontSize: 12, fontWeight: 600, color: "var(--accent)",
              background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.15)",
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: "var(--accent)",
                animation: "breathe 1.5s ease-in-out infinite",
              }} />
              Analyzing
            </span>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            color: "var(--text-3)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)", flexShrink: 0,
          }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 24px" }}>
              {isLoading && <LoadingSkeleton />}
              {!isLoading && !insights && (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-3)" }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-2)", marginBottom: 4 }}>No report yet</div>
                  <div style={{ fontSize: 14 }}>Validate an idea to see the report here.</div>
                </div>
              )}
              {hasData && <TabbedReport insights={insights} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tabbed report body ────────────────────────────────────────────────────────

function TabbedReport({ insights }: { insights: InsightReport }) {
  const [activeTab, setActiveTab] = useState<StrategyTab>("angles");

  // Filter tabs to only show those with data
  const availableTabs = TAB_CONFIG.filter((t) => {
    switch (t.key) {
      case "angles": return insights.topAngles.length > 0;
      case "untapped": return insights.untappedAngles.length > 0;
      case "risks": return insights.risks.length > 0;
      case "competitors": return insights.competitorInsights.length > 0;
      case "plan": return insights.recommendations.length > 0;
      default: return false;
    }
  });

  return (
    <div style={{ paddingTop: 20 }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 20,
        borderBottom: "1px solid var(--border)", paddingBottom: 0,
      }}>
        {availableTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 16px", fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--accent)" : "var(--text-3)",
                background: "transparent", border: "none",
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s ease",
                whiteSpace: "nowrap", letterSpacing: "-0.005em",
                marginBottom: -1,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === "angles" && <AnglesTab insights={insights} />}
          {activeTab === "untapped" && <UntappedTab insights={insights} />}
          {activeTab === "risks" && <RisksTab insights={insights} />}
          {activeTab === "competitors" && <CompetitorsTab insights={insights} />}
          {activeTab === "plan" && <PlanTab insights={insights} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function AnglesTab({ insights }: { insights: InsightReport }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {insights.topAngles.map((a, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "28px 1fr auto",
          gap: 14, alignItems: "start", padding: "16px 18px",
          background: i === 0 ? "rgba(5,150,105,0.03)" : "var(--bg-subtle)",
          border: "1px solid var(--border)",
          borderLeft: i === 0 ? "3px solid var(--accent)" : "1px solid var(--border)",
          borderRadius: 10,
          transition: "border-color 0.15s ease",
        }}
        onMouseEnter={(e) => { if (i !== 0) e.currentTarget.style.borderColor = "var(--border-strong)"; }}
        onMouseLeave={(e) => { if (i !== 0) e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: i === 0 ? "var(--accent)" : "var(--text-4)",
            paddingTop: 2, fontFamily: "var(--font-mono)",
          }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4, lineHeight: 1.4, letterSpacing: "-0.01em" }}>
              {a.angle}
            </div>
            <div style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.65 }}>{a.why}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end", flexShrink: 0 }}>
            <Badge label={`${a.estimatedReach} reach`} color={reachColor(a.estimatedReach)} />
            <Badge label={a.difficulty} color={diffColor(a.difficulty)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function UntappedTab({ insights }: { insights: InsightReport }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
      {insights.untappedAngles.map((a, i) => (
        <div key={i} style={{
          background: "rgba(5,150,105,0.02)", border: "1px solid rgba(5,150,105,0.12)",
          borderRadius: 10, padding: "16px 18px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#059669",
            marginBottom: 10, fontFamily: "var(--font-mono)",
          }}>Gap #{i + 1}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 10, lineHeight: 1.4, letterSpacing: "-0.01em" }}>
            {a.angle}
          </div>
          <div style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 10 }}>{a.opportunity}</div>
          <div style={{
            fontSize: 14, color: "var(--text-3)", lineHeight: 1.55,
            paddingTop: 10, borderTop: "1px solid rgba(5,150,105,0.08)",
          }}>{a.whyNobodyIsDoing}</div>
        </div>
      ))}
    </div>
  );
}

function RisksTab({ insights }: { insights: InsightReport }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {insights.risks.map((r, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
          background: "rgba(220,38,38,0.02)", border: "1px solid rgba(220,38,38,0.1)", borderRadius: 10,
        }}>
          <WarningIcon size={14} weight="bold" color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.65 }}>{r}</span>
        </div>
      ))}
    </div>
  );
}

function CompetitorsTab({ insights }: { insights: InsightReport }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {insights.competitorInsights.map((c, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr", gap: 12, alignItems: "center" }}>
          <div style={{ padding: "16px 18px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--text-4)",
              marginBottom: 8, fontFamily: "var(--font-mono)",
            }}>What they do</div>
            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>{c.observation}</p>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--accent)", flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
          <div style={{ padding: "16px 18px", background: "rgba(5,150,105,0.02)", border: "1px solid rgba(5,150,105,0.12)", borderRadius: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--accent)",
              marginBottom: 8, fontFamily: "var(--font-mono)",
            }}>Your gap</div>
            <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, lineHeight: 1.65, margin: 0 }}>{c.gap}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanTab({ insights }: { insights: InsightReport }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {insights.recommendations.map((rec, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
          background: "rgba(5,150,105,0.02)", border: "1px solid rgba(5,150,105,0.1)",
          borderRadius: 10, transition: "border-color 0.15s ease", cursor: "default",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(5,150,105,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(5,150,105,0.1)"; }}
        >
          <span style={{
            fontSize: 10, fontWeight: 700, color: "var(--accent)",
            background: "rgba(5,150,105,0.08)",
            width: 18, height: 18, borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1, fontFamily: "var(--font-mono)",
          }}>{i + 1}</span>
          <span style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.65 }}>{rec}</span>
        </div>
      ))}
    </div>
  );
}
