import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useGenerate } from "./hooks/useGenerate";
import { HomeScreen } from "./screens/HomeScreen";
import { RepurposeScreen } from "./screens/RepurposeScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { VaultScreen } from "./screens/VaultScreen";
import { DevelopScreen } from "./screens/DevelopScreen";
import { InsightScreen } from "./screens/InsightScreen";
import { AuthScreen } from "./screens/AuthScreen";
import type { GenerationState, Platform } from "./types";

// ── Theme context ──────────────────────────────────────────────────────────────
export const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({
  dark: false, toggle: () => {},
});
export function useTheme() { return useContext(ThemeContext); }

// ── Generation context — shared across routes ──────────────────────────────────
export const GenerationContext = createContext<{
  generation: GenerationState;
  selectedPlatforms: Platform[];
  regenerate: (platform: Platform) => Promise<void>;
  reset: () => void;
} | null>(null);
export function useGenerationCtx() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGenerationCtx must be used inside GenerationContext");
  return ctx;
}
// ── Protected Route ────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--bg)",
      }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, var(--accent), #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "pulse-glow 1.5s ease-in-out infinite",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  return <>{children}</>;
}

// ── Inner App (inside AuthProvider) ───────────────────────────────────────────
function AppInner() {
  const navigate = useNavigate();
  const { generation, rawContent, setRawContent, selectedPlatforms, setSelectedPlatforms, generate, regenerate, reset } = useGenerate();

  const handleGenerateRepurpose = async () => {
    navigate("/generating");
    await generate();
    navigate("/results");
  };

  const handleStartOver = () => {
    reset();
    navigate("/amplify");
  };

  return (
    <GenerationContext.Provider value={{ generation, selectedPlatforms, regenerate, reset }}>
      <Routes>
        {/* All routes are protected — show AuthScreen if not logged in */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/amplify"
          element={
            <ProtectedRoute>
              <RepurposeScreen
                value={rawContent}
                onChange={setRawContent}
                selectedPlatforms={selectedPlatforms}
                onPlatformsChange={setSelectedPlatforms}
                onGenerate={handleGenerateRepurpose}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generating"
          element={
            <ProtectedRoute>
              <LoadingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <ResultsScreen onStartOver={handleStartOver} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vault"
          element={
            <ProtectedRoute>
              <VaultScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/develop"
          element={
            <ProtectedRoute>
              <DevelopScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/develop/:ideaId"
          element={
            <ProtectedRoute>
              <DevelopScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights/:ideaId"
          element={
            <ProtectedRoute>
              <InsightScreen />
            </ProtectedRoute>
          }
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GenerationContext.Provider>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────────
function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeContext.Provider>
  );
}

export default App;
