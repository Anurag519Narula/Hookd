import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in dev; in prod this would go to Sentry
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px", textAlign: "center",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "#14b8a6",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 24px", lineHeight: 1.6, maxWidth: 360 }}>
          An unexpected error occurred. Reload the page to continue — your data is safe.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "9px 20px", fontSize: 13, fontWeight: 600,
            borderRadius: 6, border: "none",
            background: "#14b8a6", color: "#fff", cursor: "pointer",
          }}
        >
          Reload page
        </button>
        {(import.meta as any).env?.DEV && this.state.error && (
          <pre style={{
            marginTop: 24, padding: "12px 16px",
            background: "rgba(248,113,113,0.06)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: 6, fontSize: 11, color: "var(--error)",
            textAlign: "left", maxWidth: 600, overflow: "auto",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
