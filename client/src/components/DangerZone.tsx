import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteMe } from "../api/users";

export function DangerZone() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (deleting || confirmText !== "DELETE") return;
    setDeleting(true);
    setError("");
    try {
      await deleteMe();
      logout();
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete account.");
      setDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <div>
        <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.65 }}>
          Permanently removes your account, ideas, scripts, and conversations. Cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => { setShowConfirm(true); setConfirmText(""); setError(""); }}
          style={{
            padding: "7px 16px", fontSize: 12, fontWeight: 600,
            borderRadius: 4, border: "1px solid rgba(248,113,113,0.35)",
            background: "rgba(248,113,113,0.06)", color: "var(--error)",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "rgba(248,113,113,0.12)";
            b.style.borderColor = "rgba(248,113,113,0.6)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "rgba(248,113,113,0.06)";
            b.style.borderColor = "rgba(248,113,113,0.35)";
          }}
        >
          Delete Account
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        padding: "10px 14px",
        background: "rgba(248,113,113,0.06)",
        border: "1px solid rgba(248,113,113,0.2)",
        borderRadius: 6,
      }}>
        <p style={{ fontSize: 12, color: "var(--error)", margin: 0, lineHeight: 1.6 }}>
          This will permanently delete your account and all your content. This action <strong>cannot be undone</strong>.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="delete-confirm" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
          Type <code style={{ fontFamily: "monospace", fontSize: 12, color: "var(--error)", background: "rgba(248,113,113,0.08)", padding: "1px 5px", borderRadius: 3 }}>DELETE</code> to confirm
        </label>
        <input
          id="delete-confirm"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoFocus
          style={{
            width: "100%", padding: "8px 12px", fontSize: 13,
            color: "var(--text)", background: "var(--bg-input)",
            border: `1px solid ${confirmText === "DELETE" ? "rgba(248,113,113,0.5)" : "var(--border)"}`,
            borderRadius: 6, outline: "none", fontFamily: "monospace",
            letterSpacing: "0.05em", boxSizing: "border-box",
            transition: "border-color 0.15s ease",
          }}
        />
      </div>

      {error && (
        <p style={{ fontSize: 12, color: "var(--error)", margin: 0 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => { setShowConfirm(false); setConfirmText(""); setError(""); }}
          disabled={deleting}
          style={{
            padding: "7px 14px", fontSize: 12, fontWeight: 500,
            borderRadius: 4, border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-2)", cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={confirmText !== "DELETE" || deleting}
          style={{
            padding: "7px 14px", fontSize: 12, fontWeight: 600,
            borderRadius: 4, border: "none",
            background: confirmText === "DELETE" && !deleting ? "var(--error)" : "rgba(248,113,113,0.2)",
            color: confirmText === "DELETE" && !deleting ? "#fff" : "rgba(248,113,113,0.4)",
            cursor: confirmText !== "DELETE" || deleting ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {deleting ? "Deleting…" : "Delete My Account"}
        </button>
      </div>
    </div>
  );
}
