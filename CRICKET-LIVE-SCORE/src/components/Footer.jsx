import React from "react";
import { useNavigate } from "react-router-dom";
import { MdSportsCricket } from "react-icons/md";

const NAV_LINKS = [
  { label: "Home",       href: "#home"       },
  { label: "Live",       href: "#live"       },
  { label: "Upcoming",   href: "#upcoming"   },
  { label: "Recent",     href: "#recent"     },
  { label: "Schedule",   href: "#schedule"   },
  { label: "Rankings",   href: "#rankings"   },
  { label: "Blockchain", href: "/blockchain" },
];

const FURTHER_LINKS = [
  { label: "Terms & Conditions", href: "#terms" },
  { label: "Responsible Gaming", href: "#gaming" },
  { label: "Cookie Policy",      href: "#cookies" },
  { label: "Privacy Policy",     href: "#privacy" },
  { label: "Support",            href: "#support" },
];

const SOCIAL_LINKS = [
  {
    label: "Twitter/X", href: "#x",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.9-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>),
  },
  {
    label: "Facebook", href: "#fb",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>),
  },
  {
    label: "Instagram", href: "#ig",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>),
  },
  {
    label: "LinkedIn", href: "#li",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>),
  },
];

export default function Footer({ onNavigate }) {
  const navigate = useNavigate();

  const handleNav = (href) => {
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }

    onNavigate?.(href.replace("#", ""));
    if (href.startsWith("#")) {
      window.location.hash = href;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const year = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');

        .footer-col-link {
          transition: color 0.15s, padding-left 0.15s;
          display: block;
        }
        .footer-col-link:hover {
          color: #00d4ff !important;
          padding-left: 6px !important;
        }
        .footer-social-btn {
          transition: background 0.18s, transform 0.18s, color 0.18s;
        }
        .footer-social-btn:hover {
          background: rgba(0,212,255,0.18) !important;
          color: #00d4ff !important;
          transform: translateY(-3px);
        }

        .footer-inner {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 40px 0;
        }
        @media (max-width: 900px) {
          .footer-inner { padding: 40px 28px 0; }
        }
        @media (max-width: 540px) {
          .footer-inner { padding: 32px 20px 0; }
        }

        /* 4 cols → 2 cols → 1 col */
        .footer-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1.2fr;
          gap: 40px;
          margin-bottom: 48px;
        }
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 36px;
          }
        }
        @media (max-width: 540px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 28px;
            margin-bottom: 28px;
          }
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 18px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-social-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
      `}</style>

      <footer style={{ background: "transparent", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>



        {/* ── Body ── */}
        <div style={{ background: "#0a1628", position: "relative", marginTop: -2 }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(0,212,255,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

          <div className="footer-inner">
            <div className="footer-grid">

              {/* Brand */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#00d4ff22,#0057ff22)", border: "1px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MdSportsCricket size={20} color="#00d4ff" />
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: "#00d4ff", letterSpacing: "0.1em", lineHeight: 1 }}>
                    LiveWicket
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: "0 0 24px", maxWidth: 220 }}>
                  Your go-to destination for live cricket scores, match updates & rankings worldwide.
                </p>
                <div className="footer-social-row">
                  {SOCIAL_LINKS.map(({ label, href, icon }) => (
                    <a key={label} href={href} aria-label={label} className="footer-social-btn"
                      onClick={(e) => e.preventDefault()}
                      style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.55)", textDecoration: "none", cursor: "pointer" }}>
                      {icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Company */}
              <div>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 20px" }}>Company</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {NAV_LINKS.map(({ label, href }) => (
                    <a key={label} href={href} className="footer-col-link"
                      onClick={(e) => { e.preventDefault(); handleNav(href); }}
                      style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none", paddingLeft: 0 }}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Further Links */}
              <div>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 20px" }}>Further Links</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {FURTHER_LINKS.map(({ label, href }) => (
                    <a key={label} href={href} className="footer-col-link"
                      onClick={(e) => e.preventDefault()}
                      style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none", paddingLeft: 0 }}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 20px" }}>Contact Us</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    {
                      text: "+91-9876543210",
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.9v2z" /></svg>,
                    },
                    {
                      text: "Ahmedabad, New Delhi – 302001",
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
                    },
                    {
                      text: "support@LiveWicket.com",
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
                    },
                  ].map(({ icon, text }, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ marginTop: 2, flexShrink: 0, color: "#00d4ff" }}>{icon}</div>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, wordBreak: "break-word" }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom bar */}
            <div className="footer-bottom">
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", margin: 0, fontWeight: 400 }}>
                © {year} LiveWicket. All rights reserved.
              </p>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.1em" }}>LIVE NOW</span>
              </div>
            </div>

          </div>
        </div>
      </footer>
    </>
  );
}