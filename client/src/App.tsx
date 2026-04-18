import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomeScreen } from "./screens/HomeScreen";
import { AmplifyScreen } from "./screens/AmplifyScreen";
import { VaultScreen } from "./screens/VaultScreen";
import { DevelopScreen } from "./screens/DevelopScreen";
import { InsightScreen } from "./screens/InsightScreen";
import { AuthScreen } from "./screens/AuthScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { StudioScreen } from "./screens/StudioScreen";
import { NotFoundScreen } from "./screens/NotFoundScreen";

// ── Theme context ──────────────────────────────────────────────────────────────
export const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({
  dark: false, toggle: () => {},
});
export function useTheme() { return useContext(ThemeContext); }

// ── Protected Route ────────────────────────────────────────────────────────────
function ProtectedRoute({
  children,
  requireOnboarding,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) {
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

  // Onboarding guard: route requires onboarding complete but user hasn't done it
  if (requireOnboarding && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// ── Onboarding Route — redirects away if already complete ─────────────────────
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--bg)",
      }}>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Loading…</p>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  // Already onboarded — send to home
  if (user.onboarding_complete) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ── Inner App (inside AuthProvider) ───────────────────────────────────────────
function AppInner() {
  return (
    <Routes>
      {/* Home */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        }
      />

      {/* Onboarding — auth required, redirect away if already complete */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingScreen />
          </OnboardingRoute>
        }
      />

      {/* Amplify — requires onboarding complete */}
      <Route
        path="/amplify"
        element={
          <ProtectedRoute requireOnboarding>
            <AmplifyScreen />
          </ProtectedRoute>
        }
      />

      {/* Studio — requires onboarding complete */}
      <Route
        path="/studio"
        element={
          <ProtectedRoute requireOnboarding>
            <StudioScreen />
          </ProtectedRoute>
        }
      />

      {/* Vault */}
      <Route
        path="/vault"
        element={
          <ProtectedRoute>
            <VaultScreen />
          </ProtectedRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsScreen />
          </ProtectedRoute>
        }
      />

      {/* Develop */}
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

      {/* Insights */}
      <Route
        path="/insights/:ideaId"
        element={
          <ProtectedRoute>
            <InsightScreen />
          </ProtectedRoute>
        }
      />

      {/* Catch-all → 404 */}
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
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
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}

export default App;
