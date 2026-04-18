import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 56px)",
        padding: "24px", textAlign: "center",
      }}>
        <div style={{
          fontSize: 64, fontWeight: 800, color: "var(--border)",
          letterSpacing: "-0.06em", lineHeight: 1, marginBottom: 16,
        }}>
          404
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Page not found
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 24px", lineHeight: 1.6 }}>
          This page doesn't exist or was moved.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "9px 20px", fontSize: 13, fontWeight: 600,
            borderRadius: 6, border: "none",
            background: "#14b8a6", color: "#fff", cursor: "pointer",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
        >
          Go home
        </button>
      </div>
    </div>
  );
}
