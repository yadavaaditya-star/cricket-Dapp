import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdSportsCricket, MdVerified } from "react-icons/md";
import { getVerifiedMatches } from "../api/blockchainApi";
import { FiRefreshCw } from "react-icons/fi";
import { getRecentMatches } from "../api/cricApi";
import { flagForTeamName } from "../components/Flag";

/* ── Responsive hook ────────────────────────────────────────────────── */
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

/* ── Score formatters ───────────────────────────────────────────────── */
const fmtInn = (inn) => {
  if (!inn || inn.runs == null) return null;
  const w   = inn.wickets != null ? `/${inn.wickets}` : "";
  const dec = inn.isDeclared ? "d" : "";
  const o   = inn.overs    != null ? ` (${inn.overs} ov)` : "";
  return `${inn.runs}${w}${dec}${o}`;
};

const fmtTeamScore = (teamScore) => {
  if (!teamScore) return null;
  const i1 = fmtInn(teamScore.inngs1);
  const i2 = fmtInn(teamScore.inngs2);
  if (i1 && i2) return `${i1} & ${i2}`;
  return i1 || null;
};

const fmtTime = (val) => {
  if (!val) return "";
  const n  = Number(val);
  if (!n)  return String(val);
  const ms = n > 1e12 ? n : n * 1000;
  const d  = new Date(ms);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString(undefined, { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
};

/* ── Extract matches ────────────────────────────────────────────────── */
const extract = (payload) => {
  if (!payload) return [];
  const root = payload.data ?? payload;
  const tms  = root.typeMatches;
  if (!Array.isArray(tms)) return [];
  const out = [];
  for (const tm of tms) {
    for (const sEntry of (tm?.seriesMatches || [])) {
      const saw = sEntry?.seriesAdWrapper;
      if (!saw) continue;
      for (const mm of (saw?.matches || [])) {
        const info  = mm.matchInfo  || {};
        const score = mm.matchScore || {};
        if (!info.matchId) continue;
        const t1    = info.team1 || {};
        const t2    = info.team2 || {};
        const name1 = t1.teamName || t1.teamSName || "Team 1";
        const name2 = t2.teamName || t2.teamSName || "Team 2";
        const flag1 = (() => { const f = flagForTeamName(name1); return { ...f, src: f.src ? f.src.replace('/w40/', '/w80/') : null }; })();
        const flag2 = (() => { const f = flagForTeamName(name2); return { ...f, src: f.src ? f.src.replace('/w40/', '/w80/') : null }; })();
        out.push({
          matchId:     String(info.matchId),
          matchDesc:   info.matchDesc   || "",
          // ── teamId preserved for MatchDetailPage → TeamsTab ──
          team1:       { name: name1, short: t1.teamSName || name1, flag: flag1, teamId: t1.teamId ?? null },
          team2:       { name: name2, short: t2.teamSName || name2, flag: flag2, teamId: t2.teamId ?? null },
          state:       info.state       || info.stateTitle || "",
          status:      info.status      || "",
          matchFormat: (info.matchFormat || "").toUpperCase(),
          seriesName:  saw.seriesName   || info.seriesName || "",
          venue:       info.venueInfo?.ground || info.venueInfo?.city || "",
          time:        fmtTime(info.startDate || ""),
          matchScore:  score,
          score1:      fmtTeamScore(score.team1Score),
          score2:      fmtTeamScore(score.team2Score),
          // keep raw so MatchDetailPage can fall back to raw.matchInfo.team1.teamId
          raw:         mm,
        });
      }
    }
  }
  return out;
};

/* ── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ flagObj, label, size = 32 }) {
  const src   = typeof flagObj?.src   === "string" ? flagObj.src   : null;
  const emoji = typeof flagObj?.emoji === "string" ? flagObj.emoji : null;
  const [imgErr, setImgErr] = useState(false);
  const GRADS = [
    ["#6366f1","#4f46e5"],["#0ea5e9","#0284c7"],
    ["#8b5cf6","#7c3aed"],["#06b6d4","#0891b2"],
    ["#3b82f6","#2563eb"],["#a855f7","#9333ea"],
  ];
  const [from, to] = GRADS[(label?.charCodeAt(0) || 0) % GRADS.length];
  const initials = (label || "?").split(" ").map(s => s[0] || "").slice(0, 2).join("").toUpperCase();
  const base = { width: size, height: size, borderRadius: 8, flexShrink: 0 };

  if (src && !imgErr) return (
    <img src={src} alt={label} onError={() => setImgErr(true)}
      style={{ ...base, objectFit:"cover", objectPosition:"center", display:"block" }} />
  );
  if (emoji) return (
    <div style={{ ...base, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize: size * 0.55, lineHeight:1 }}>
      {emoji}
    </div>
  );
  return (
    <div style={{ ...base, background:`linear-gradient(145deg,${from},${to})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize: size * 0.3, fontWeight:700 }}>
      {initials}
    </div>
  );
}

/* ── Format badge ───────────────────────────────────────────────────── */
function FormatBadge({ format }) {
  const map = {
    TEST: { bg:"#fff7ed", color:"#c2410c" },
    ODI:  { bg:"#f0fdf4", color:"#15803d" },
    T20:  { bg:"#eff6ff", color:"#1d4ed8" },
    T20I: { bg:"#eff6ff", color:"#1d4ed8" },
  };
  const style = map[format] || { bg:"#f8fafc", color:"#64748b" };
  return (
    <span style={{
      fontSize:9, fontWeight:800, letterSpacing:"0.08em",
      padding:"2px 7px", borderRadius:5,
      background: style.bg, color: style.color,
      whiteSpace:"nowrap", flexShrink:0,
    }}>
      {format || "CRICKET"}
    </span>
  );
}

/* ── State badge ────────────────────────────────────────────────────── */
function StateBadge({ state }) {
  const s          = (state || "").toLowerCase();
  const isLive     = s === "in progress";
  const isUpcoming = s === "upcoming" || s === "preview";
  return (
    <span style={{
      fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:5,
      flexShrink:0, letterSpacing:"0.06em", whiteSpace:"nowrap",
      background: isLive ? "#dcfce7" : isUpcoming ? "#fef9c3" : "#f1f5f9",
      color:      isLive ? "#15803d" : isUpcoming ? "#854d0e" : "#94a3b8",
    }}>
      {isLive ? "● LIVE" : isUpcoming ? "UPCOMING" : "DONE"}
    </span>
  );
}

/* ─── Verification Badge ─────────────────────────────────────────────── */
function VerificationBadge({ isVerified }) {
  if (!isVerified) return null;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontSize: 9,
      fontWeight: 800,
      padding: "2px 7px",
      borderRadius: 5,
      flexShrink: 0,
      letterSpacing: "0.06em",
      whiteSpace: "nowrap",
      background: "#dbeafe",
      color: "#1d4ed8",
    }}>
      <MdVerified size={10} />
      VERIFIED
    </span>
  );
}

/* ── Desktop Row (3-col grid) ───────────────────────────────────────── */
function MatchRowDesktop({ m, index, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      tabIndex={0}
      onClick={() => onClick(m)}
      onKeyDown={e => { if (e.key==="Enter"||e.key===" ") { e.preventDefault(); onClick(m); } }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:             "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems:          "center",
        gap:                 12,
        padding:             "14px 20px",
        cursor:              "pointer",
        background:          hov ? "#f8faff" : "transparent",
        transition:          "background 0.15s",
        animation:           "fadeUp 0.3s cubic-bezier(.4,0,.2,1) both",
        animationDelay:      `${index * 40}ms`,
        outline:             "none",
      }}
    >
      {/* Team 1 */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <Avatar flagObj={m.team1.flag} label={m.team1.short} size={34} />
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:14, color:"#0f172a", letterSpacing:"-0.01em", whiteSpace:"nowrap" }}>
            {m.team1.short}
          </div>
          {m.score1 ? (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, color:"#f97316", letterSpacing:"-0.01em", marginTop:1, whiteSpace:"nowrap" }}>
              {m.score1}
            </div>
          ) : (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#cbd5e1", marginTop:1 }}>—</div>
          )}
        </div>
      </div>

      {/* Center */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, minWidth:110, maxWidth:180 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <FormatBadge format={m.matchFormat} />
          <StateBadge state={m.state} />
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:800, color:"#cbd5e1", letterSpacing:"0.12em" }}>VS</div>
        {m.status && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#64748b", fontWeight:500, textAlign:"center", lineHeight:1.35, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {m.status}
          </div>
        )}
      </div>

      {/* Team 2 */}
      <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"flex-end" }}>
        <div style={{ minWidth:0, textAlign:"right" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:14, color:"#0f172a", letterSpacing:"-0.01em", whiteSpace:"nowrap" }}>
            {m.team2.short}
          </div>
          {m.score2 ? (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, color:"#f97316", letterSpacing:"-0.01em", marginTop:1, whiteSpace:"nowrap" }}>
              {m.score2}
            </div>
          ) : (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#cbd5e1", marginTop:1, textAlign:"right" }}>—</div>
          )}
        </div>
        <Avatar flagObj={m.team2.flag} label={m.team2.short} size={34} />
      </div>
    </div>
  );
}

/* ── Mobile Row (compact card) ──────────────────────────────────────── */
function MatchRowMobile({ m, index, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      tabIndex={0}
      onClick={() => onClick(m)}
      onKeyDown={e => { if (e.key==="Enter"||e.key===" ") { e.preventDefault(); onClick(m); } }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:        "12px 16px",
        cursor:         "pointer",
        background:     hov ? "#f8faff" : "transparent",
        transition:     "background 0.15s",
        animation:      "fadeUp 0.3s cubic-bezier(.4,0,.2,1) both",
        animationDelay: `${index * 40}ms`,
        outline:        "none",
      }}
    >
      {/* Badges row */}
      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:10 }}>
        <FormatBadge format={m.matchFormat} />
        <StateBadge state={m.state} />
        {m.seriesName && (
          <span style={{
            fontSize:9, color:"#94a3b8", fontWeight:500,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
            maxWidth:140,
          }}>
            {m.seriesName}
          </span>
        )}
      </div>

      {/* Teams row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        {/* Team 1 */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
          <Avatar flagObj={m.team1.flag} label={m.team1.short} size={28} />
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {m.team1.short}
            </div>
            {m.score1 && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:11, color:"#f97316", marginTop:1, whiteSpace:"nowrap" }}>
                {m.score1}
              </div>
            )}
          </div>
        </div>

        {/* VS */}
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:800, color:"#cbd5e1", letterSpacing:"0.12em", flexShrink:0 }}>
          VS
        </div>

        {/* Team 2 */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0, justifyContent:"flex-end" }}>
          <div style={{ minWidth:0, textAlign:"right" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {m.team2.short}
            </div>
            {m.score2 && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:11, color:"#f97316", marginTop:1, whiteSpace:"nowrap" }}>
                {m.score2}
              </div>
            )}
          </div>
          <Avatar flagObj={m.team2.flag} label={m.team2.short} size={28} />
        </div>
      </div>

      {/* Status */}
      {m.status && (
        <div style={{
          fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#64748b",
          fontWeight:500, marginTop:8, lineHeight:1.4,
          display:"-webkit-box", WebkitLineClamp:2,
          WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>
          {m.status}
        </div>
      )}
    </div>
  );
}

/* ── Skeleton row ───────────────────────────────────────────────────── */
function SkeletonRow({ isMobile }) {
  if (isMobile) return (
    <div style={{ padding:"12px 16px", animation:"shimmer 1.6s ease-in-out infinite" }}>
      <div style={{ width:120, height:12, background:"#e2e8f0", borderRadius:5, marginBottom:10 }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:"#e2e8f0", flexShrink:0 }} />
          <div>
            <div style={{ width:36, height:12, background:"#e2e8f0", borderRadius:4 }} />
            <div style={{ width:56, height:10, background:"#f1f5f9", borderRadius:4, marginTop:4 }} />
          </div>
        </div>
        <div style={{ width:16, height:10, background:"#f1f5f9", borderRadius:4 }} />
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, justifyContent:"flex-end" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ width:36, height:12, background:"#e2e8f0", borderRadius:4 }} />
            <div style={{ width:56, height:10, background:"#f1f5f9", borderRadius:4, marginTop:4 }} />
          </div>
          <div style={{ width:28, height:28, borderRadius:7, background:"#e2e8f0", flexShrink:0 }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      display:"grid", gridTemplateColumns:"1fr auto 1fr",
      alignItems:"center", gap:12, padding:"14px 20px",
      animation:"shimmer 1.6s ease-in-out infinite",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:"#e2e8f0", flexShrink:0 }} />
        <div>
          <div style={{ width:40, height:13, background:"#e2e8f0", borderRadius:5 }} />
          <div style={{ width:60, height:11, background:"#f1f5f9", borderRadius:5, marginTop:5 }} />
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, minWidth:110 }}>
        <div style={{ width:80, height:14, background:"#e2e8f0", borderRadius:5 }} />
        <div style={{ width:24, height:11, background:"#f1f5f9", borderRadius:4 }} />
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"flex-end" }}>
        <div style={{ textAlign:"right" }}>
          <div style={{ width:40, height:13, background:"#e2e8f0", borderRadius:5 }} />
          <div style={{ width:60, height:11, background:"#f1f5f9", borderRadius:5, marginTop:5 }} />
        </div>
        <div style={{ width:34, height:34, borderRadius:8, background:"#e2e8f0", flexShrink:0 }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function RecentMatches() {
  const [matches,     setMatches]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [page,        setPage]        = useState(1);
  const navigate  = useNavigate();
  const width     = useWindowWidth();

  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;
  const PAGE_SIZE = isMobile ? 6 : 8;

  const sectionPadding = isMobile
    ? "20px 12px"
    : isTablet
      ? "24px 32px"
      : "30px 145px";

  async function fetchRecent() {
    setLoading(true);
    setError(null);
    try {
      const res     = await getRecentMatches();
      const payload = res.data ?? res;
      setMatches(extract(payload));
      setLastUpdated(new Date());
      setPage(1);
    } catch (err) {
      setError(err?.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRecent(); }, []);

  function handleCardClick(match) {
    // Store full match object including teamId on each team so TeamsTab can call getTeamForMatch
    sessionStorage.setItem(`match_${match.matchId}`, JSON.stringify({
      ...match,
      // Ensure teamId is accessible at top level for MatchDetailPage's TeamsTab
      team1: { ...match.team1, teamId: match.team1.teamId ?? match.raw?.matchInfo?.team1?.teamId ?? null },
      team2: { ...match.team2, teamId: match.team2.teamId ?? match.raw?.matchInfo?.team2?.teamId ?? null },
    }));
    navigate(`/match/${match.matchId}`);
  }

  const totalPages = Math.ceil(matches.length / PAGE_SIZE);
  const paginated  = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const subtitle   = matches.length > 0
    ? `${matches.length} matches · Page ${page} of ${totalPages}`
    : lastUpdated
      ? `Updated ${lastUpdated.toLocaleTimeString()}`
      : "Results & completed matches";

  const MatchRow = isMobile ? MatchRowMobile : MatchRowDesktop;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }
        *:focus-visible    { outline:2px solid #6366f1; outline-offset:3px; border-radius:4px; }
      `}</style>

      <section style={{
        width:      "100%",
        padding:    sectionPadding,
        margin:     "auto 0",
        fontFamily: "'DM Sans', sans-serif",
        boxSizing:  "border-box",
      }}>

        {/* ── Header ── */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginBottom:   isMobile ? 14 : 20,
          flexWrap:       "wrap",
          gap:            10,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 10 : 13 }}>
            <div style={{
              width:      isMobile ? 38 : 46,
              height:     isMobile ? 38 : 46,
              borderRadius: 14,
              background: "linear-gradient(135deg,#4f46e5 0%,#6366f1 60%,#818cf8 100%)",
              display:    "flex", alignItems:"center", justifyContent:"center",
              boxShadow:  "0 6px 20px rgba(99,102,241,0.35)", flexShrink:0,
            }}>
              <MdSportsCricket size={isMobile ? 20 : 24} color="#fff" />
            </div>
            <div>
              <h2 style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize:   isMobile ? 17 : 20,
                fontWeight: 700,
                color:      "#0f172a",
                margin:     0,
                letterSpacing: "-0.03em",
              }}>
                Recent Matches
              </h2>
              <p style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize:   isMobile ? 11 : 12,
                color:      "#94a3b8",
                margin:     "2px 0 0",
                fontWeight: 400,
              }}>
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={fetchRecent} disabled={loading}
            style={{
              display:    "flex", alignItems:"center", gap:6,
              padding:    isMobile ? "7px 12px" : "8px 16px",
              borderRadius: 10,
              fontFamily: "'DM Sans',sans-serif",
              fontSize:   isMobile ? 12 : 12.5,
              fontWeight: 600,
              background: "#fff",
              border:     "1px solid #e2e8f0",
              color:      "#6366f1",
              cursor:     loading ? "not-allowed" : "pointer",
              opacity:    loading ? 0.55 : 1,
              transition: "all 0.15s",
              boxShadow:  "0 1px 4px rgba(0,0,0,0.06)",
              flexShrink: 0,
            }}
          >
            <FiRefreshCw size={12} style={loading ? { animation:"spin 0.75s linear infinite" } : {}} />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* ── Table ── */}
        {error ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"60px 20px", textAlign:"center" }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#dc2626", fontWeight:600, fontSize:14, margin:0 }}>{error}</p>
            <button onClick={fetchRecent} style={{ marginTop:12, padding:"8px 20px", borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, background:"#fef2f2", border:"none", color:"#ef4444", cursor:"pointer" }}>
              Try again
            </button>
          </div>
        ) : (
          <div style={{
            background:   "#fff",
            borderRadius: isMobile ? 14 : 18,
            overflow:     "hidden",
            boxShadow:    "0 2px 16px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04)",
            border:       "1px solid #e8edf5",
          }}>

            {/* Column headers — hidden on mobile */}
            {!isMobile && (
              <div style={{
                display:             "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems:          "center",
                gap:                 12,
                padding:             "10px 20px",
                borderBottom:        "1px solid #f1f5f9",
                background:          "#f8fafc",
              }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", textTransform:"uppercase" }}>Team</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", textTransform:"uppercase", textAlign:"center", minWidth:110 }}>Match Info</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", textTransform:"uppercase", textAlign:"right" }}>Team</div>
              </div>
            )}

            {/* Rows */}
            {loading && matches.length === 0 ? (
              [...Array(isMobile ? 4 : 6)].map((_, i) => (
                <React.Fragment key={i}>
                  <SkeletonRow isMobile={isMobile} />
                  {i < (isMobile ? 3 : 5) && <div style={{ height:1, background:"#f1f5f9", margin:"0 16px" }} />}
                </React.Fragment>
              ))
            ) : matches.length > 0 ? (
              <>
                {paginated.map((m, i) => (
                  <React.Fragment key={m.matchId}>
                    <MatchRow m={m} index={i} onClick={handleCardClick} />
                    {i < paginated.length - 1 && (
                      <div style={{ height:1, background:"#f1f5f9", margin:`0 ${isMobile ? 16 : 20}px` }} />
                    )}
                  </React.Fragment>
                ))}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div style={{
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "space-between",
                    padding:        isMobile ? "10px 16px" : "12px 20px",
                    borderTop:      "1px solid #f1f5f9",
                    background:     "#f8fafc",
                    gap:            8,
                  }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        display:"flex", alignItems:"center", gap:4,
                        padding: isMobile ? "5px 10px" : "6px 14px",
                        borderRadius:8, border:"1px solid #e2e8f0", background:"#fff",
                        fontFamily:"'DM Sans',sans-serif", fontSize: isMobile ? 11 : 12, fontWeight:600,
                        color: page === 1 ? "#cbd5e1" : "#6366f1",
                        cursor: page === 1 ? "not-allowed" : "pointer",
                        transition:"all 0.15s", flexShrink:0,
                      }}
                    >
                      ← {!isMobile && "Prev"}
                    </button>

                    <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 3 : 4, flexWrap:"nowrap", overflow:"hidden" }}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) =>
                          p === "..." ? (
                            <span key={`ellipsis-${i}`} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#94a3b8", padding:"0 2px" }}>…</span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              style={{
                                width: isMobile ? 26 : 30, height: isMobile ? 26 : 30,
                                borderRadius:7,
                                border: page === p ? "none" : "1px solid #e2e8f0",
                                background: page === p ? "#6366f1" : "#fff",
                                color: page === p ? "#fff" : "#64748b",
                                fontFamily:"'DM Sans',sans-serif", fontSize: isMobile ? 11 : 12, fontWeight:700,
                                cursor:"pointer", transition:"all 0.15s", flexShrink:0,
                              }}
                            >
                              {p}
                            </button>
                          )
                        )
                      }
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{
                        display:"flex", alignItems:"center", gap:4,
                        padding: isMobile ? "5px 10px" : "6px 14px",
                        borderRadius:8, border:"1px solid #e2e8f0", background:"#fff",
                        fontFamily:"'DM Sans',sans-serif", fontSize: isMobile ? 11 : 12, fontWeight:600,
                        color: page === totalPages ? "#cbd5e1" : "#6366f1",
                        cursor: page === totalPages ? "not-allowed" : "pointer",
                        transition:"all 0.15s", flexShrink:0,
                      }}
                    >
                      {!isMobile && "Next"} →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding: isMobile ? "50px 20px" : "80px 20px", textAlign:"center" }}>
                <MdSportsCricket size={28} color="#c7d2fe" style={{ marginBottom:10 }} />
                <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#0f172a", fontWeight:700, fontSize:15, margin:0 }}>No recent matches</p>
                <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#94a3b8", fontSize:13, marginTop:5 }}>Check back soon</p>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}