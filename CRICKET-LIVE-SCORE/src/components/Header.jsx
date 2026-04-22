import React, { useState, useEffect } from "react";
import { MdSportsCricket } from "react-icons/md";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { NavLink, useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { label: "Home",       to: "/"           },
  { label: "Live",       to: "/live"       },
  { label: "Upcoming",   to: "/upcoming"   },
  { label: "Recent",     to: "/recent"     },
  { label: "Blockchain", to: "/blockchain" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Bebas+Neue&display=swap');

        .hdr { font-family: 'DM Sans', sans-serif; }

        .hdr-shimmer::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
        }

        @keyframes hdrSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hdr-mobile-menu { animation: hdrSlideDown 0.2s ease both; }

        .hdr-navlink {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          color: rgba(219,234,254,0.9);
          transition: background 0.2s, color 0.2s;
        }
        .hdr-navlink:hover { color: #fff; background: rgba(255,255,255,0.10); }
        .hdr-navlink.active { color: #fff; background: rgba(255,255,255,0.15); }

        .hdr-mob-navlink {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          color: rgba(219,234,254,0.9);
          transition: background 0.2s, color 0.2s;
        }
        .hdr-mob-navlink:hover { color: #fff; background: rgba(255,255,255,0.10); }
        .hdr-mob-navlink.active { color: #fff; background: rgba(255,255,255,0.15); }

        .hdr-logo-icon { transition: background 0.2s; }
        .hdr-logo:hover .hdr-logo-icon { background: rgba(255,255,255,0.25) !important; }

        .hdr-hamburger:hover { background: rgba(255,255,255,0.20) !important; }

        @media (max-width: 767px) {
          .hdr-desktop-nav { display: none !important; }
          .hdr-hamburger   { display: flex !important; }
        }
        @media (min-width: 768px) {
          .hdr-hamburger   { display: none !important; }
        }
      `}</style>

      <header
        className="hdr hdr-shimmer"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          transition: "background 0.3s, box-shadow 0.3s",
          background: scrolled
            ? "#1e3a8a"
            : "linear-gradient(118deg,#1d3fc4 0%,#1a56db 40%,#1e40af 70%,#1e3a8a 100%)",
          boxShadow: scrolled ? "0 4px 24px rgba(29,63,196,0.5)" : "none",
        }}
      >
        {/* Top shimmer stripe */}
        <div style={{
          height: 2,
          background: "linear-gradient(90deg,#6080e8,rgba(255,255,255,0.4),#6080e8)",
        }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>

            {/* ── Logo ── */}
            <a
              href="/"
              className="hdr-logo"
              onClick={(e) => { e.preventDefault(); navigate("/"); setMenuOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", userSelect: "none" }}
            >
              <div
                className="hdr-logo-icon"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              >
                <MdSportsCricket size={20} color="white" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 21, color: "white",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                }}>LiveWicket</span>
                <span style={{
                  fontSize: 9, fontWeight: 600, color: "#bfdbfe",
                  letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 1,
                }}>Live Scores</span>
              </div>
            </a>

            {/* ── Desktop Nav ── */}
            <nav className="hdr-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) => `hdr-navlink${isActive ? " active" : ""}`}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* ── Hamburger ── */}
            <button
              className="hdr-hamburger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
              style={{
                display: "none",
                alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white", cursor: "pointer",
              }}
            >
              {menuOpen ? <HiX size={20} /> : <HiMenuAlt3 size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div
            className="hdr-mobile-menu"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(29,63,196,0.97)",
              backdropFilter: "blur(12px)",
            }}
          >
            <nav style={{ maxWidth: 1280, margin: "0 auto", padding: "10px 16px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `hdr-mob-navlink${isActive ? " active" : ""}`}
                >
                  {({ isActive }) => (
                    <>
                      <span style={{ flex: 1 }}>{label}</span>
                      {isActive && (
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                          stroke="rgba(255,255,255,0.4)" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div style={{ height: 62 }} />
    </>
  );
}