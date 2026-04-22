import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../App";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  children?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function Navbar({ children, showBack: _showBack, onBack }: NavbarProps) {
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayName = user?.name || user?.email || "";
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email ? user.email[0].toUpperCase() : "?";

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  const NAV_LINKS = [
    { to: "/", label: "Home" },
    { to: "/studio", label: "Studio" },
    { to: "/develop", label: "Develop" },
    { to: "/amplify", label: "Amplify" },
    { to: "/vault", label: "Vault" },
  ];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: dark ? "rgba(10,10,10,0.92)" : "rgba(250,250,250,0.92)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        padding: "0 28px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Wordmark */}
        <button
          onClick={() => onBack ? onBack() : navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: "#14b8a6",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Hookd
          </span>
        </button>

        {/* Desktop nav */}
        <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {NAV_LINKS.map(({ to, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                style={{
                  fontSize: 15, fontWeight: active ? 600 : 400,
                  color: active ? "#14b8a6" : "var(--text-3)",
                  padding: "4px 10px 2px",
                  textDecoration: "none", transition: "all 0.15s ease",
                  borderBottom: active ? "1.5px solid #14b8a6" : "1.5px solid transparent",
                  borderRadius: 0,
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-3)"; }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {children}

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              width: 30, height: 30, borderRadius: 4,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-3)", cursor: "pointer",
              display: "none", alignItems: "center", justifyContent: "center",
            }}
          >
            {menuOpen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{
              width: 30, height: 30, borderRadius: 4,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-3)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
          >
            {dark ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          {/* Avatar + dropdown */}
          {user && (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                title={displayName}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#14b8a6",
                  border: dropdownOpen ? "2px solid #14b8a6" : "2px solid transparent",
                  outline: dropdownOpen ? "2px solid rgba(20,184,166,0.3)" : "none",
                  outlineOffset: 1,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff",
                  flexShrink: 0,
                }}
              >
                {initials}
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  width: 200, background: "var(--bg-card)",
                  border: "1px solid var(--border)", borderRadius: 8,
                  overflow: "hidden", zIndex: 200,
                }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {displayName}
                    </p>
                    {user.name && (
                      <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </p>
                    )}
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 14px", color: "var(--text-2)",
                      fontSize: 14, fontWeight: 500, textDecoration: "none",
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-subtle)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "none"; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Settings
                  </Link>

                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    style={{
                      width: "100%", padding: "9px 14px",
                      display: "flex", alignItems: "center", gap: 8,
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-2)", fontSize: 14, fontWeight: 500,
                      textAlign: "left", transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.background = "rgba(248,113,113,0.06)";
                      b.style.color = "var(--error)";
                    }}
                    onMouseLeave={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.background = "none";
                      b.style.color = "var(--text-2)";
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          padding: "8px 20px 14px",
          borderTop: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: 16, fontWeight: 500,
                color: isActive(to) ? "#14b8a6" : "var(--text-2)",
                padding: "9px 10px", borderRadius: 6,
                textDecoration: "none", transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-subtle)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "none"; }}
            >
              {label}
            </Link>
          ))}
          {user && (
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: 16, fontWeight: 500,
                color: isActive("/settings") ? "#14b8a6" : "var(--text-2)",
                padding: "9px 10px", borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Settings
            </Link>
          )}
          {user && (
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              style={{
                fontSize: 16, fontWeight: 500, color: "var(--error)",
                padding: "9px 10px", borderRadius: 6, textAlign: "left",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              Sign out
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
