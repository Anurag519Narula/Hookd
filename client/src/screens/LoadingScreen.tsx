import React from "react";
import { Platform } from "../types/index";
import { PlatformCard } from "../components/PlatformCard";
import { useGenerationCtx } from "../App";
import { Navbar } from "../components/Navbar";

export function LoadingScreen() {
  const { generation, selectedPlatforms, regenerate } = useGenerationCtx();
  const done = selectedPlatforms.filter((p) => generation[p].status !== "loading").length;
  const total = selectedPlatforms.length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 120, height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: "linear-gradient(90deg, var(--accent), #6366f1)",
              width: `${(done / total) * 100}%`,
              transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500, whiteSpace: "nowrap" }}>
            {done} / {total} ready
          </span>
        </div>
      </Navbar>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "48px 24px" }}>
        {/* Page heading */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 99,
            background: "var(--accent-subtle)", border: "1px solid rgba(13,148,136,0.2)",
            fontSize: 12, fontWeight: 600, color: "var(--accent-text)",
            letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 16,
          }}>
            <LoadingDots /> Generating
          </div>
          <h2 style={{
            fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 700,
            color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 8,
          }}>
            Writing your content...
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-3)", maxWidth: 400, margin: "0 auto" }}>
            All four platforms are being crafted in parallel. Cards appear as they finish.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
          gap: 20,
        }}>
          {selectedPlatforms.map((platform, i) => (
            <div key={platform} style={{ animation: `fadeUp 0.4s ease ${i * 60}ms both` }}>
              <PlatformCard platform={platform} state={generation[platform]} onRegenerate={regenerate} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: "50%",
          background: "var(--accent-text)",
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          display: "inline-block",
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }`}</style>
    </span>
  );
}
