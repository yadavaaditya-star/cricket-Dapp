import React, { useEffect } from "react";

export default function Hero() {
  useEffect(() => {
    const id = "hero-google-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id   = id;
      link.rel  = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <>
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroImg {
          from { opacity: 0; transform: translateX(32px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,0.25) !important; }
        .hero-cta { transition: transform 0.2s ease, box-shadow 0.2s ease; }

        /* ── Layout grid ── */
        .hero-grid {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
        }

        /* tablet: shrink padding & image */
        @media (max-width: 900px) {
          .hero-grid {
            padding: 0 24px;
            grid-template-columns: 1fr 1fr;
          }
        }

        /* mobile: stack copy above image */
        @media (max-width: 640px) {
          .hero-grid {
            grid-template-columns: 1fr;
            padding: 0 20px;
          }
        }

        /* ── Copy column ── */
        .hero-copy {
          padding: 48px 0;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 900px) {
          .hero-copy { padding: 40px 0; }
        }
        @media (max-width: 640px) {
          .hero-copy {
            padding: 36px 0 24px;
            align-items: center;
            text-align: center;
          }
        }

        /* ── Image column ── */
        .hero-img-col {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 100%;
          position: relative;
          animation: heroImg 0.7s cubic-bezier(.4,0,.2,1) 0.15s both;
        }
        @media (max-width: 640px) {
          .hero-img-col {
            height: 260px;
            padding-bottom: 0;
          }
        }

        /* ── Player image ── */
        .hero-player-img {
          width: auto;
          max-width: 100%;
          height: 480px;
          object-fit: contain;
          object-position: bottom center;
          display: block;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.35));
        }
        @media (max-width: 900px) {
          .hero-player-img { height: 360px; }
        }
        @media (max-width: 640px) {
          .hero-player-img { height: 240px; }
        }

        /* ── Body copy max-width ── */
        .hero-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: rgba(255,255,255,0.65);
          line-height: 1.65;
          max-width: 380px;
          margin: 0 0 28px;
          animation: heroFadeUp 0.6s cubic-bezier(.4,0,.2,1) 0.42s both;
        }
        @media (max-width: 640px) {
          .hero-body { max-width: 100%; }
        }

        /* ── Section min-height ── */
        .hero-section {
          position: relative;
          overflow: hidden;
          background: linear-gradient(118deg, #1d3fc4 0%, #1a56db 40%, #1e40af 70%, #1e3a8a 100%);
          min-height: 420px;
          display: flex;
          align-items: stretch;
          margin: 0;
          padding: 0;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 640px) {
          .hero-section { min-height: unset; }
        }
      `}</style>

      <section className="hero-section">

        {/* Background texture dots */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          zIndex: 0,
        }} />

        {/* Diagonal light slashes */}
        <div style={{
          position: "absolute", top: "-40%", right: "30%",
          width: "3px", height: "200%",
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)",
          transform: "rotate(20deg)", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", top: "-40%", right: "34%",
          width: "1px", height: "200%",
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.05), transparent)",
          transform: "rotate(20deg)", zIndex: 0,
        }} />

        {/* Radial glow */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: "55%",
          background: "radial-gradient(ellipse at 80% 50%, rgba(99,102,241,0.18) 0%, transparent 65%)",
          zIndex: 0,
        }} />

        {/* Content grid */}
        <div className="hero-grid">

          {/* LEFT — Copy */}
          <div className="hero-copy">

            {/* Main headline */}
            <div style={{ animation: "heroFadeUp 0.6s cubic-bezier(.4,0,.2,1) 0.2s both", marginBottom: 6 }}>
              <div style={{
                fontFamily:    "'Bebas Neue', sans-serif",
                fontSize:      "clamp(44px, 6vw, 88px)",
                lineHeight:    0.95,
                color:         "#ffffff",
                letterSpacing: "0.02em",
              }}>
                LET'S GO!
              </div>
            </div>

            {/* Sub headline */}
            <div style={{ animation: "heroFadeUp 0.6s cubic-bezier(.4,0,.2,1) 0.32s both", marginBottom: 20 }}>
              <div style={{
                fontFamily:           "'Bebas Neue', sans-serif",
                fontSize:             "clamp(24px, 3.2vw, 48px)",
                lineHeight:           1,
                letterSpacing:        "0.04em",
                background:           "linear-gradient(90deg, #93c5fd, #bfdbfe)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
              }}>
                Better Live Scores
              </div>
            </div>

            {/* Body copy */}
            <p className="hero-body">
              Ball-by-ball updates, live scorecards, and match insights.
              All in one place. Never miss a moment of the action.
            </p>
          </div>

          {/* RIGHT — Image */}
          <div className="hero-img-col">
            {/* Glow circle */}
            <div style={{
              position: "absolute",
              bottom: "-20%", left: "50%",
              transform: "translateX(-50%)",
              width: "70%", paddingBottom: "70%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(147,197,253,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <img
              src="/cricket-player.png"
              alt="Cricket player"
              className="hero-player-img"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        </div>

        {/* Bottom wave — uses page bg color */}
        <div style={{
          position: "absolute", bottom: -1, left: 0, right: 0,
          lineHeight: 0, zIndex: 2, pointerEvents: "none",
        }}>
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none"
            style={{ width: "100%", height: 40, display: "block" }}>
            <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>
    </>
  );
}