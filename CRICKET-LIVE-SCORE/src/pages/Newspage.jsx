import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getNewsList } from "../api/cricApi";

/* ── helpers ─────────────────────────────────────────────────────────── */
const fmtDate = (ts) => {
  if (!ts) return "";
  const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
  const d  = new Date(ms);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000)    return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const getCategoryColor = (cat = "") => {
  const map = {
    "reports":   { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
    "features":  { bg: "#fdf4ff", text: "#7e22ce", dot: "#a855f7" },
    "interview": { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
    "ipl":       { bg: "#fff1f2", text: "#be123c", dot: "#f43f5e" },
    "women":     { bg: "#fdf2f8", text: "#9d174d", dot: "#ec4899" },
    "ranking":   { bg: "#f0f9ff", text: "#0369a1", dot: "#0ea5e9" },
    "news":      { bg: "#eef2ff", text: "#4338ca", dot: "#6366f1" },
  };
  const key = Object.keys(map).find(k => cat.toLowerCase().includes(k));
  return map[key] ?? { bg: "#f8fafc", text: "#475569", dot: "#94a3b8" };
};

function clamp(min, max) {
  return `clamp(${min}px, 3vw, ${max}px)`;
}

/* ── Featured hero card ──────────────────────────────────────────────── */
function HeroCard({ item, onClick }) {
  const [hov, setHov] = useState(false);
  const cat  = item.category || item.storyType || "";
  const clr  = getCategoryColor(cat);
  const time = fmtDate(item.pubTime || item.publishTime || item.createTime);

  return (
    <article
      onClick={() => onClick(item)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", borderRadius: 20, overflow: "hidden",
        cursor: "pointer", background: "#fff", border: "1px solid #e2e8f0",
        transition: "transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s cubic-bezier(.4,0,.2,1)",
        transform: hov ? "translateY(-4px)" : "none",
        boxShadow: hov
          ? "0 24px 48px rgba(15,23,42,0.13), 0 6px 16px rgba(15,23,42,0.07)"
          : "0 2px 12px rgba(15,23,42,0.06)",
        gridColumn: "1 / -1",
      }}
    >
      <div style={{ height: 4, background: "linear-gradient(90deg,#4f46e5,#818cf8,#c4b5fd)" }} />
      <div style={{ display: "flex", flexDirection: "column", padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "4px 10px", borderRadius: 6,
            background: clr.bg, color: clr.text,
          }}>
            {cat || "Cricket"}
          </span>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{time}</span>
          <span style={{
            marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            padding: "3px 9px", borderRadius: 20, background: "#dcfce7", color: "#15803d",
          }}>FEATURED</span>
        </div>
        <h2 style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: clamp(18, 26),
          fontWeight: 800, color: "#0f172a", lineHeight: 1.28,
          letterSpacing: "-0.025em", margin: "0 0 12px",
        }}>
          {item.hline || item.headline || item.title || "No title"}
        </h2>
        {(item.intro || item.summary) && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#64748b",
            lineHeight: 1.6, margin: "0 0 20px",
            display: "-webkit-box", WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {item.intro || item.summary}
          </p>
        )}
        {item.source && (
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{item.source}</div>
        )}
      </div>
    </article>
  );
}

/* ── Standard news card ──────────────────────────────────────────────── */
function NewsCard({ item, index, onClick }) {
  const [hov, setHov] = useState(false);
  const cat  = item.category || item.storyType || "";
  const clr  = getCategoryColor(cat);
  const time = fmtDate(item.pubTime || item.publishTime || item.createTime);
  const initials = (item.source || "CB").slice(0, 2).toUpperCase();

  return (
    <article
      onClick={() => onClick(item)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 18, overflow: "hidden", cursor: "pointer",
        background: "#fff", border: "1px solid #e2e8f0",
        transition: "transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1)",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov
          ? "0 16px 32px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.05)"
          : "0 2px 8px rgba(15,23,42,0.05)",
        animation: "fadeUp 0.35s cubic-bezier(.4,0,.2,1) both",
        animationDelay: `${index * 45}ms`,
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ height: 3, background: clr.dot }} />
      <div style={{ padding: "18px 18px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: clr.dot, display: "inline-block", flexShrink: 0,
          }} />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: clr.text,
          }}>
            {cat || "Cricket"}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>{time}</span>
        </div>
        <h3 style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
          color: "#0f172a", lineHeight: 1.38, letterSpacing: "-0.01em",
          margin: "0 0 10px", display: "-webkit-box", WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1,
        }}>
          {item.hline || item.headline || item.title || "No title"}
        </h3>
        {(item.intro || item.summary) && (
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: "#64748b",
            lineHeight: 1.55, margin: "0 0 14px",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {item.intro || item.summary}
          </p>
        )}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          paddingTop: 12, borderTop: "1px solid #f1f5f9", marginTop: "auto",
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: "linear-gradient(135deg,#4f46e5,#818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
            {item.source || "Cricbuzz"}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#6366f1", fontWeight: 600 }}>
            Read →
          </span>
        </div>
      </div>
    </article>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
function Skeleton({ hero }) {
  return (
    <div style={{
      borderRadius: 18, overflow: "hidden",
      background: "#fff", border: "1px solid #f1f5f9",
      animation: "shimmer 1.6s ease-in-out infinite",
      ...(hero ? { gridColumn: "1 / -1" } : {}),
    }}>
      <div style={{ height: hero ? 4 : 3, background: "#e2e8f0" }} />
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 50, height: 16, background: "#f1f5f9", borderRadius: 6 }} />
          <div style={{ width: 60, height: 16, background: "#f1f5f9", borderRadius: 6, marginLeft: "auto" }} />
        </div>
        <div style={{ height: hero ? 32 : 16, background: "#e2e8f0", borderRadius: 6, marginBottom: 8, width: "90%" }} />
        {hero && <div style={{ height: 32, background: "#e2e8f0", borderRadius: 6, marginBottom: 8, width: "75%" }} />}
        <div style={{ height: 14, background: "#f1f5f9", borderRadius: 6, marginBottom: 6, width: "100%" }} />
        <div style={{ height: 14, background: "#f1f5f9", borderRadius: 6, width: "70%" }} />
      </div>
    </div>
  );
}

/* ── News Detail Modal ───────────────────────────────────────────────── */
function NewsModal({ item, onClose }) {
  const cat  = item?.category || item?.storyType || "";
  const clr  = getCategoryColor(cat);
  const time = fmtDate(item?.pubTime || item?.publishTime || item?.createTime);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, maxWidth: 680,
          width: "100%", maxHeight: "85vh", overflowY: "auto",
          boxShadow: "0 32px 64px rgba(15,23,42,0.2)",
          animation: "modalUp 0.25s cubic-bezier(.34,1.2,.64,1)",
        }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg,#4f46e5,#818cf8,#c4b5fd)", borderRadius: "20px 20px 0 0" }} />
        <div style={{ padding: "28px 28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase", padding: "4px 10px", borderRadius: 6,
              background: clr.bg, color: clr.text,
            }}>
              {cat || "Cricket"}
            </span>
            {time && <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{time}</span>}
            <button
              onClick={onClose}
              style={{
                marginLeft: "auto", width: 32, height: 32, borderRadius: 8,
                border: "1px solid #e2e8f0", background: "#f8fafc",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 16, color: "#64748b", fontFamily: "inherit",
              }}
            >✕</button>
          </div>
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 800,
            color: "#0f172a", lineHeight: 1.3, letterSpacing: "-0.02em", margin: "0 0 16px",
          }}>
            {item.hline || item.headline || item.title}
          </h2>
          {(item.intro || item.summary) && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#374151",
              lineHeight: 1.65, margin: "0 0 20px",
              borderLeft: `3px solid ${clr.dot}`, paddingLeft: 14,
            }}>
              {item.intro || item.summary}
            </p>
          )}
          {item.context && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#f1f5f9", borderRadius: 7, padding: "5px 11px", marginBottom: 16,
            }}>
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{item.context}</span>
            </div>
          )}
          {item.storyContent && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
              {item.storyContent}
            </div>
          )}
          {item.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 20 }}>
              {item.tags.slice(0, 6).map((tag, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 600, color: "#6366f1",
                  background: "#eef2ff", borderRadius: 6, padding: "4px 10px",
                }}>
                  {tag.value || tag}
                </span>
              ))}
            </div>
          )}
          <div style={{
            marginTop: 24, paddingTop: 16, borderTop: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "linear-gradient(135deg,#4f46e5,#818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#fff",
            }}>
              {(item.source || "CB").slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              {item.source || "Cricbuzz"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function NewsPage() {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await getNewsList();
      const raw  = res.data;
      const list =
        raw?.storyList ||
        raw?.newsList  ||
        raw?.list      ||
        (Array.isArray(raw) ? raw : []);
      // Filter out ad entries, unwrap { story: {...} } wrappers
      const stories = list
        .filter(i => i.story)
        .map(i => i.story)
        .filter(Boolean);
      setItems(stories);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.message || "Failed to load news");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const hero = items[0];
  const rest = items.slice(1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes modalUp { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <section style={{
        minHeight: "100vh",
        background: "linear-gradient(150deg,#f8faff 0%,#f0f4ff 50%,#f5f3ff 100%)",
        fontFamily: "'DM Sans', sans-serif",
        padding: "30px 20px 60px",
        boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 28, flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 13px", borderRadius: 9,
                  border: "1px solid #e2e8f0", background: "#fff",
                  fontSize: 12, fontWeight: 600, color: "#64748b",
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                ← Back
              </button>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: "linear-gradient(135deg,#4f46e5 0%,#6366f1 60%,#818cf8 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 20px rgba(99,102,241,0.35)", flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                  <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
                </svg>
              </div>
              <div>
                <h1 style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 20,
                  fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.03em",
                }}>
                  Cricket News
                </h1>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  color: "#94a3b8", margin: "2px 0 0", fontWeight: 400,
                }}>
                  {lastUpdated
                    ? `${items.length} stories · Updated ${lastUpdated.toLocaleTimeString()}`
                    : "Latest stories & updates"}
                </p>
              </div>
            </div>

            <button
              onClick={fetchNews}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600,
                background: "#fff", border: "1px solid #e2e8f0", color: "#6366f1",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.55 : 1, transition: "all 0.15s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={loading ? { animation: "spin 0.75s linear infinite" } : {}}>
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {/* ── Content ── */}
          {error ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 20px", textAlign:"center" }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#dc2626", fontWeight:600, fontSize:14, margin:0 }}>{error}</p>
              <button onClick={fetchNews} style={{ marginTop:12, padding:"8px 20px", borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, background:"#fef2f2", border:"none", color:"#ef4444", cursor:"pointer" }}>
                Try again
              </button>
            </div>
          ) : loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              <Skeleton hero />
              {[...Array(5)].map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 20px", textAlign:"center" }}>
              <div style={{ width:58, height:58, borderRadius:16, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, boxShadow:"0 4px 16px rgba(99,102,241,0.10)" }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#c7d2fe" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#0f172a", fontWeight:700, fontSize:15, margin:0 }}>No news available</p>
              <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#94a3b8", fontSize:13, marginTop:5 }}>Check back soon for the latest stories</p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {hero && <HeroCard item={hero} onClick={setSelected} />}
              {rest.map((item, i) => (
                <NewsCard key={item.id || item.newsId || i} item={item} index={i} onClick={setSelected} />
              ))}
            </div>
          )}
        </div>
      </section>

      {selected && <NewsModal item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}