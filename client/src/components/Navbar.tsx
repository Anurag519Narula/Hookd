import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../App";
import { useAuth } from "../context/AuthContext";

const SparkleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const HamburgerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

interface NavbarProps {
  children?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function Navbar({ children, showBack: _showBack, onBack }: NavbarProps) {
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    setDropdownOpen(false);
    logout();
  }

  // Get user initials for avatar
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const navLinkStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-2)",
    padding: "4px 10px",
    borderRadius: 6,
    transition: "all var(--transition)",
    background: "none",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: dark ? "rgba(14,14,14,0.88)" : "rgba(247,246,243,0.88)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Wordmark */}
        <button
          onClick={() => onBack ? onBack() : navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent), #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <SparkleIcon />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Hookd
          </span>
        </button>

        {/* Desktop nav links */}
        <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Link
            to="/amplify"
            style={navLinkStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-subtle)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLAnchorElement).style.background = "none"; }}
          >
            Amplify
          </Link>
          <Link
            to="/develop"
            style={navLinkStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-subtle)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLAnchorElement).style.background = "none"; }}
          >
            Develop
          </Link>
          <Link
            to="/vault"
            style={navLinkStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-subtle)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLAnchorElement).style.background = "none"; }}
          >
            Vault
          </Link>
        </div>

        {/* Right slot */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {children}

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-subtle)",
              color: "var(--text-2)", cursor: "pointer",
              display: "none", alignItems: "center", justifyContent: "center",
              transition: "all var(--transition)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)"; }}
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-subtle)",
              color: "var(--text-2)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all var(--transition)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)"; }}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User avatar + dropdown */}
          {user && (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                id="nav-user-avatar"
                onClick={() => setDropdownOpen((o) => !o)}
                title={user.name}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), #6366f1)",
                  border: "2px solid transparent",
                  outline: dropdownOpen ? "2px solid var(--accent)" : "none",
                  outlineOffset: 1,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                  letterSpacing: "0.02em",
                  transition: "all var(--transition)",
                  flexShrink: 0,
                }}
              >
                {initials}
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  width: 220,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  overflow: "hidden",
                  animation: "scaleIn 0.18s cubic-bezier(0.4,0,0.2,1) both",
                  transformOrigin: "top right",
                  zIndex: 200,
                }}>
                  {/* User info */}
                  <div style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent), #6366f1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, fontWeight: 600, color: "var(--text)",
                          margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {user.name}
                        </p>
                        <p style={{
                          fontSize: 11, color: "var(--text-3)",
                          margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    id="nav-logout"
                    onClick={handleLogout}
                    style={{
                      width: "100%", padding: "11px 16px",
                      display: "flex", alignItems: "center", gap: 8,
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-2)", fontSize: 13, fontWeight: 500,
                      textAlign: "left", transition: "all var(--transition)",
                    }}
                    onMouseEnter={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.background = "var(--error-subtle)";
                      b.style.color = "var(--error)";
                    }}
                    onMouseLeave={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.background = "none";
                      b.style.color = "var(--text-2)";
                    }}
                  >
                    <LogOutIcon /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            padding: "8px 24px 16px",
            borderTop: "1px solid var(--border)",
            display: "flex", flexDirection: "column", gap: 4,
          }}
        >
          <Link
            to="/amplify"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: 15, fontWeight: 500, color: "var(--text-2)",
              padding: "10px 12px", borderRadius: 8,
              transition: "all var(--transition)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-subtle)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "none"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)"; }}
          >
            Amplify
          </Link>
          <Link
            to="/develop"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: 15, fontWeight: 500, color: "var(--text-2)",
              padding: "10px 12px", borderRadius: 8,
              transition: "all var(--transition)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-subtle)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "none"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)"; }}
          >
            Develop
          </Link>
          <Link
            to="/vault"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: 15, fontWeight: 500, color: "var(--text-2)",
              padding: "10px 12px", borderRadius: 8,
              transition: "all var(--transition)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-subtle)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "none"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)"; }}
          >
            Vault
          </Link>
          {/* Mobile sign out */}
          {user && (
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              style={{
                fontSize: 15, fontWeight: 500, color: "var(--error)",
                padding: "10px 12px", borderRadius: 8, textAlign: "left",
                transition: "all var(--transition)", background: "none", border: "none",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
