import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../App";

type Mode = "login" | "signup";

export function AuthScreen() {
  const { login, signup } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name"); setLoading(false); return; }
        await signup(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((m) => m === "login" ? "signup" : "login");
    setError(""); setName(""); setEmail(""); setPassword("");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", fontSize: 15,
    borderRadius: 6, border: "1px solid var(--border)",
    background: "var(--bg-input)", color: "var(--text)",
    outline: "none", transition: "border-color 0.15s ease",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: "fixed", top: 18, right: 18,
          width: 30, height: 30, borderRadius: 4,
          border: "1px solid var(--border)", background: "transparent",
          color: "var(--text-3)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        aria-label="Toggle theme"
      >
        {dark ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </button>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "32px 28px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#14b8a6",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Hookd
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-3)", textAlign: "center", lineHeight: 1.5 }}>
            {mode === "login" ? "Welcome back. Sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>Name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" autoComplete="name" required={mode === "signup"}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" required
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} required
                style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
              <button
                type="button" onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-3)", padding: 4, display: "flex", alignItems: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <p style={{ fontSize: 14, color: "var(--error)", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            id="auth-submit" type="submit" disabled={loading}
            style={{
              marginTop: 4, width: "100%", padding: "10px 0",
              fontSize: 15, fontWeight: 600, borderRadius: 6, border: "none",
              background: loading ? "var(--bg-subtle)" : "#14b8a6",
              color: loading ? "var(--text-3)" : "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
          >
            {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign in" : "Create account")}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--text-3)" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              id="auth-switch-mode"
              onClick={switchMode}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#14b8a6", fontWeight: 600, fontSize: 14, padding: 0,
              }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
