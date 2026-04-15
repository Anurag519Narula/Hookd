import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../App";

const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    )}
  </svg>
);

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
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name"); setLoading(false); return; }
        await signup(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      // Redirect to home page on success
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    fontSize: 14,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--bg-input)",
    color: "var(--text)",
    outline: "none",
    transition: "border-color var(--transition)",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
    }}>
      {/* Background glows */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 600, height: 600,
        background: "radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: -150, left: -150, width: 500, height: 500,
        background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: "fixed", top: 20, right: 20,
          width: 36, height: 36, borderRadius: 8,
          border: "1px solid var(--border)", background: "var(--bg-subtle)",
          color: "var(--text-2)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all var(--transition)",
        }}
        aria-label="Toggle theme"
      >
        {dark ? "☀" : "🌙"}
      </button>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "40px 36px",
        boxShadow: "var(--shadow-lg)",
        animation: "scaleIn 0.35s cubic-bezier(0.4,0,0.2,1) both",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "linear-gradient(135deg, var(--accent), #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            boxShadow: "0 8px 24px rgba(13,148,136,0.3)",
          }}>
            <SparkleIcon />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Hookd
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-3)", textAlign: "center" }}>
            {mode === "login" ? "Welcome back. Sign in to your account." : "Create your free account to get started."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Name field — signup only */}
          {mode === "signup" && (
            <div style={{ animation: "fadeUp 0.25s ease both" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
                Name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required={mode === "signup"}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-3)", padding: 4,
                  display: "flex", alignItems: "center",
                  transition: "color var(--transition)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--error-subtle)",
              border: "1px solid rgba(220,38,38,0.2)",
              animation: "fadeUp 0.2s ease both",
            }}>
              <p style={{ fontSize: 13, color: "var(--error)", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            id="auth-submit"
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              width: "100%",
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: loading ? "var(--bg-subtle)" : "linear-gradient(135deg, var(--accent), #6366f1)",
              color: loading ? "var(--text-3)" : "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all var(--transition)",
              boxShadow: loading ? "none" : "0 4px 14px rgba(13,148,136,0.3)",
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign in" : "Create account")}
          </button>
        </form>

        {/* Mode switch */}
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              id="auth-switch-mode"
              onClick={switchMode}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--accent-text)", fontWeight: 600, fontSize: 13,
                padding: 0, textDecoration: "underline", textUnderlineOffset: 2,
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
