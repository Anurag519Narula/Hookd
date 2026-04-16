import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteMe } from "../api/users";

export function DangerZone() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteAccount() {
    if (deleting || deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteMe();
      logout();
      navigate("/");
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete account. Please try again."
      );
      setDeleting(false);
    }
  }

  return (
    <>
      {!showDeleteDialog ? (
        <div>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-3)",
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            Deleting your account will permanently remove all your data,
            including your ideas, scripts, and conversations. This action
            cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowDeleteDialog(true);
              setDeleteConfirmText("");
              setDeleteError("");
            }}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(248,113,113,0.4)",
              background: "rgba(248,113,113,0.06)",
              color: "var(--error)",
              cursor: "pointer",
              transition: "all var(--transition)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "rgba(248,113,113,0.12)";
              el.style.borderColor = "rgba(248,113,113,0.6)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "rgba(248,113,113,0.06)";
              el.style.borderColor = "rgba(248,113,113,0.4)";
            }}
          >
            Delete Account
          </button>
        </div>
      ) : (
        /* Confirmation dialog (inline) */
        <div
          className="scale-in"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "var(--error)",
                margin: 0,
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              ⚠️ This will permanently delete your account and all your
              content. This action{" "}
              <strong style={{ fontWeight: 700 }}>cannot be undone</strong>.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label
              htmlFor="delete-confirm"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-2)",
              }}
            >
              Type{" "}
              <code
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  color: "var(--error)",
                  background: "rgba(248,113,113,0.08)",
                  padding: "1px 5px",
                  borderRadius: 4,
                }}
              >
                DELETE
              </code>{" "}
              to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14,
                color: "var(--text)",
                background: "var(--bg-input)",
                border: `1px solid ${
                  deleteConfirmText === "DELETE"
                    ? "rgba(248,113,113,0.5)"
                    : "var(--border)"
                }`,
                borderRadius: "var(--radius-sm)",
                outline: "none",
                transition:
                  "border-color var(--transition), box-shadow var(--transition)",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(248,113,113,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Delete error */}
          {deleteError && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--error-subtle)",
                border: "1px solid rgba(248,113,113,0.25)",
              }}
            >
              <p style={{ fontSize: 13, color: "var(--error)", margin: 0 }}>
                {deleteError}
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            {/* Cancel */}
            <button
              type="button"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
                setDeleteError("");
              }}
              disabled={deleting}
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-2)",
                cursor: deleting ? "not-allowed" : "pointer",
                transition: "all var(--transition)",
              }}
              onMouseEnter={(e) => {
                if (!deleting) {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "var(--border-strong)";
                  el.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "var(--border)";
                el.style.color = "var(--text-2)";
              }}
            >
              Cancel
            </button>

            {/* Confirm delete */}
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || deleting}
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: "var(--radius-sm)",
                border: "none",
                background:
                  deleteConfirmText === "DELETE" && !deleting
                    ? "var(--error)"
                    : "rgba(248,113,113,0.2)",
                color:
                  deleteConfirmText === "DELETE" && !deleting
                    ? "#fff"
                    : "rgba(248,113,113,0.4)",
                cursor:
                  deleteConfirmText !== "DELETE" || deleting
                    ? "not-allowed"
                    : "pointer",
                transition: "all var(--transition)",
              }}
              onMouseEnter={(e) => {
                if (deleteConfirmText === "DELETE" && !deleting) {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              {deleting ? "Deleting…" : "Delete My Account"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
