import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdSportsCricket } from "react-icons/md";
import { FiRefreshCw } from "react-icons/fi";
import { getLiveMatches } from "../api/cricApi";
import { flagForTeamName } from "../components/Flag";

/* ─── Team name expansion ─────────────────────────────────────────────── */
const TEAM_MAP = {
  SAUS:"South Australia", SA:"South Australia", VIC:"Victoria", V:"Victoria",
  NSW:"New South Wales",  NS:"New South Wales", N:"New South Wales",
  QLD:"Queensland",       QL:"Queensland",      Q:"Queensland",
  WA:"Western Australia", W:"Western Australia",
  TAS:"Tasmania",         T:"Tasmania",         ACT:"ACT Comets",
  IND:"India",   AUS:"Australia", ENG:"England",  PAK:"Pakistan",
  NZ:"New Zealand", WI:"West Indies", SL:"Sri Lanka", BAN:"Bangladesh",
  ZIM:"Zimbabwe", AFG:"Afghanistan", IRE:"Ireland",  SCO:"Scotland",
  NED:"Netherlands", UAE:"UAE", MAS:"Malaysia", BHR:"Bahrain",
};
const expand = (n) => (n ? TEAM_MAP[n.trim()] || TEAM_MAP[n.trim().toUpperCase()] || n : n);

/* ─── Main component ──────────────────────────────────────────────────── */
const LiveMatch = ({ onSelect }) => {
  const [matches,     setMatches]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [quotaMode,   setQuotaMode]   = useState(false);
  const navigate = useNavigate();

  const toNum = (v) => { const n = Number(v); return isNaN(n) ? null : n; };

  const fmtTime = (val) => {
    if (!val && val !== 0) return "";
    const n  = toNum(val);
    if (!n) return String(val);
    const ms = n < 1e12 && n > 1e9 ? n * 1000 : n;
    const d  = new Date(ms);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString(undefined, { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
  };

  const fmtInnings = (i) => {
    if (!i) return "";
    const r = i.runs;
    const w = i.wickets ?? i.wkts ?? i.wktsTaken ?? "";
    const o = i.overs ?? i.oversPlayed ?? i.oversString ?? "";
    const s = r || r === 0 ? `${r}/${w || 0}` : "";
    return o !== "" ? `${s} (${o} ov)` : s;
  };

  const fmtTeamScore = (ms, key) => {
    if (!ms?.[key]) return "";
    const obj = ms[key];
    const i1  = obj.inngs1;
    const i2  = obj.inngs2;
    if (i2?.runs != null) return fmtInnings(i2);
    if (i1?.runs != null) return fmtInnings(i1);
    if (obj.runs != null) return `${obj.runs}/${obj.wickets ?? obj.wkts ?? ""}`;
    return "";
  };

  const extract = (payload) => {
    if (!payload) return [];
    const root = payload.data ?? payload;
    const tms  = root.typeMatches;
    if (!Array.isArray(tms)) return [];
    const out = [];
    for (const tm of tms) {
      for (const sEntry of (tm?.seriesMatches || [])) {
        const saw = sEntry?.seriesAdWrapper || sEntry;
        const arr = saw?.matches || [];
        if (!Array.isArray(arr)) continue;
        for (const mm of arr) {
          const info  = mm.matchInfo  || {};
          const score = mm.matchScore || {};
          const t1    = info.team1    || {};
          const t2    = info.team2    || {};
          const rawT1 = t1.teamName || t1.teamSName || "Team 1";
          const rawT2 = t2.teamName || t2.teamSName || "Team 2";
          const mId   = String(info.matchId || `${rawT1}-${rawT2}`);
          out.push({
            matchId:     mId,
            team1:       { name: expand(rawT1), short: t1.teamSName || rawT1 },
            team2:       { name: expand(rawT2), short: t2.teamSName || rawT2 },
            status:      info.status || info.stateTitle || "",
            state:       info.state  || info.stateTitle || "",
            matchFormat: (info.matchFormat || "").toUpperCase(),
            matchDesc:   info.matchDesc || "",
            seriesName:  saw?.seriesName || info.seriesName || "",
            venue:       info.venueInfo?.ground || info.venueInfo?.city || "",
            time:        fmtTime(info.startDate || ""),
            date:        fmtTime(info.startDate || ""),
            matchScore:  score,
            score1:      fmtTeamScore(score, "team1Score"),
            score2:      fmtTeamScore(score, "team2Score"),
            raw:         mm,
          });
        }
      }
    }
    return out;
  };

  const dedupe = (arr) => {
    const m = new Map();
    for (const a of arr) {
      if (!a) continue;
      const k = a.matchId || `${a.team1?.name}|${a.team2?.name}`;
      if (!m.has(k)) m.set(k, a);
    }
    return [...m.values()];
  };

  async function fetchLive() {
    setLoading(true); setError(null);
    try {
      const res     = await getLiveMatches({ cacheTTL: 30 });
      const payload = res.data ?? (res.rawResponse?.data) ?? res;
      if (typeof payload === "string" && payload.trimStart().startsWith("<")) {
        setError("API returned HTML — check your API key."); return;
      }
      setQuotaMode(Boolean(res.quotaExceeded || res.fallback || res.quota_exceeded));
      const items = dedupe(extract(payload)).map((m) => {
        const flag1 = flagForTeamName(m.team1.name);
        const flag2 = flagForTeamName(m.team2.name);
        return {
          id:          m.matchId,
          matchId:     m.matchId,
          matchDesc:   m.matchDesc,
          seriesName:  m.seriesName,
          matchFormat: m.matchFormat,
          state:       m.state,
          status:      m.status,
          venue:       m.venue,
          date:        m.date,
          matchScore:  m.matchScore,
          score1:      m.score1,
          score2:      m.score2,
          team1: {
            name:  m.team1.name,
            short: m.team1.short,
            flag:  { ...flag1, src: flag1.src ? flag1.src.replace('/w40/', '/w80/') : null },
          },
          team2: {
            name:  m.team2.name,
            short: m.team2.short,
            flag:  { ...flag2, src: flag2.src ? flag2.src.replace('/w40/', '/w80/') : null },
          },
          teamA: { name: m.team1.name, short: m.team1.short, score: m.score1, flag: { ...flag1, src: flag1.src ? flag1.src.replace('/w40/', '/w80/') : null } },
          teamB: { name: m.team2.name, short: m.team2.short, score: m.score2, flag: { ...flag2, src: flag2.src ? flag2.src.replace('/w40/', '/w80/') : null } },
          time: m.time,
          raw:  m.raw,
        };
      });
      setMatches(items);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.message || "Failed to load live matches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLive(); }, []);

  function handleCardClick(m) {
    sessionStorage.setItem(`match_${m.matchId}`, JSON.stringify(m));
    navigate(`/match/${m.matchId}`);
    onSelect?.(m.id, m);
  }

  /* ─── Avatar ── */
  function Avatar({ flagObj, label, size = 40 }) {
    const src   = typeof flagObj?.src   === "string" ? flagObj.src   : null;
    const emoji = typeof flagObj?.emoji === "string" ? flagObj.emoji : null;
    const [imgErr, setImgErr] = useState(false);
    const GRADS = [
      ["#6366f1","#4f46e5"], ["#0ea5e9","#0284c7"],
      ["#8b5cf6","#7c3aed"], ["#06b6d4","#0891b2"],
      ["#3b82f6","#2563eb"], ["#a855f7","#9333ea"],
    ];
    const [from, to] = GRADS[(label?.charCodeAt(0) || 0) % GRADS.length];
    const initials = (label || "?").split(" ").map(s => s[0] || "").slice(0, 2).join("").toUpperCase();
    const base = { width: size * 1.5, height: size, borderRadius: 10, flexShrink: 0 };
    if (src && !imgErr) return (
      <img src={src} alt={label} onError={() => setImgErr(true)}
        style={{ ...base, objectFit:"cover", objectPosition:"center", display:"block" }} />
    );
    if (emoji) return (
      <div style={{ ...base, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize: size * 0.58, lineHeight:1 }}>
        {emoji}
      </div>
    );
    return (
      <div style={{ ...base, background:`linear-gradient(145deg,${from},${to})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize: size * 0.3, fontWeight:700, letterSpacing:"0.04em" }}>
        {initials}
      </div>
    );
  }

  /* ─── Score ── */
  function Score({ raw }) {
    if (!raw) return (
      <div style={{ textAlign:"right" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:13, color:"#cbd5e1" }}>—</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#e2e8f0", fontWeight:400, marginTop:1 }}>yet to bat</div>
      </div>
    );
    const p     = raw.indexOf("(");
    const main  = p > -1 ? raw.slice(0, p).trim() : raw.trim();
    const overs = p > -1 ? raw.slice(p).trim()    : null;
    return (
      <div style={{ textAlign:"right" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:17, color:"#f97316", letterSpacing:"-0.02em", lineHeight:1 }}>
          {main}
        </div>
        {overs && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#94a3b8", fontWeight:400, marginTop:2, whiteSpace:"nowrap" }}>
            {overs}
          </div>
        )}
      </div>
    );
  }

  /* ─── Card ── */
  function Card({ m, index }) {
    const [hov, setHov] = useState(false);
    return (
      <article
        tabIndex={0}
        onClick={() => handleCardClick(m)}
        onKeyDown={e => { if (e.key==="Enter"||e.key===" ") { e.preventDefault(); handleCardClick(m); } }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background:     "#fff",
          borderRadius:   18,
          overflow:       "hidden",
          cursor:         "pointer",
          position:       "relative",
          transition:     "transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1)",
          transform:      hov ? "translateY(-4px)" : "translateY(0)",
          boxShadow:      hov
            ? "0 20px 40px rgba(15,23,42,0.12), 0 4px 12px rgba(15,23,42,0.06)"
            : "0 2px 12px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)",
          outline:        "none",
          animation:      "fadeUp 0.35s cubic-bezier(.4,0,.2,1) both",
          animationDelay: `${index * 55}ms`,
        }}
      >
        <div style={{ padding:"16px 18px 15px" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#eef2ff,#e0e7ff)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <MdSportsCricket size={15} color="#6366f1" />
            </div>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:400, fontSize:12, color:"#94a3b8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
              {m.teamA.name} vs {m.teamB.name}
            </span>
            <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:"#dcfce7", color:"#15803d", letterSpacing:"0.04em", flexShrink:0, whiteSpace:"nowrap" }}>
              LIVE
            </span>
          </div>

          {/* Teams */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"4px 0 10px" }}>
              <Avatar flagObj={m.teamA.flag} label={m.teamA.short} size={40} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"#0f172a", flex:1, letterSpacing:"-0.01em" }}>
                {m.teamA.short}
              </span>
              <Score raw={m.teamA.score} />
            </div>
            <div style={{ height:1, background:"#f1f5f9", margin:"2px 0" }} />
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0 4px" }}>
              <Avatar flagObj={m.teamB.flag} label={m.teamB.short} size={40} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:15, color:"#0f172a", flex:1, letterSpacing:"-0.01em" }}>
                {m.teamB.short}
              </span>
              <Score raw={m.teamB.score} />
            </div>
          </div>

          {/* Venue */}
          {m.venue && (
            <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:10 }}>
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1" strokeWidth={2.5} style={{ flexShrink:0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#94a3b8", fontWeight:400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {m.venue}
              </span>
            </div>
          )}

          {/* Status */}
          {m.status && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:5, marginTop:6 }}>
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1" strokeWidth={2.5} style={{ flexShrink:0, marginTop:1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#64748b", fontWeight:400, lineHeight:1.4 }}>
                {m.status}
              </span>
            </div>
          )}

        </div>
      </article>
    );
  }

  /* ─── Skeleton ── */
  function Skeleton() {
    return (
      <div style={{ background:"#fff", borderRadius:18, boxShadow:"0 2px 12px rgba(15,23,42,0.06)", animation:"shimmer 1.6s ease-in-out infinite" }}>
        <div style={{ padding:"16px 18px 15px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"#e2e8f0" }} />
            <div style={{ height:11, flex:1, background:"#e2e8f0", borderRadius:6 }} />
            <div style={{ width:34, height:18, background:"#eef2ff", borderRadius:6 }} />
          </div>
          <div>
            {[0,1].map(i => (
              <div key={i}>
                <div style={{ display:"flex", alignItems:"center", gap:12, padding: i===0 ? "4px 0 10px" : "0 0 4px" }}>
                  <div style={{ width:60, height:40, borderRadius:10, background:"#e2e8f0", flexShrink:0 }} />
                  <div style={{ height:13, flex:1, background:"#e2e8f0", borderRadius:6 }} />
                  <div style={{ width:46, height:15, background:"#dbeafe", borderRadius:5 }} />
                </div>
                {i===0 && <div style={{ height:1, background:"#f1f5f9", margin:"2px 0" }} />}
              </div>
            ))}
          </div>
          <div style={{ height:10, width:100, background:"#f1f5f9", borderRadius:5, marginTop:12 }} />
        </div>
      </div>
    );
  }

  const subtitle = matches.length > 0
    ? `${matches[0].teamA.short} vs ${matches[0].teamB.short}${matches.length > 1 ? ` · +${matches.length - 1} more` : ""}`
    : lastUpdated
      ? `Updated ${lastUpdated.toLocaleTimeString()}`
      : "Real-time scores & updates";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        *:focus-visible    { outline:2px solid #6366f1; outline-offset:3px; border-radius:4px; }

        .lm-section {
          width: 100%;
          padding: 30px 80px;
          margin: 0 auto;
          max-width: 1385px;
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
        }

        /* tablet */
        @media (max-width: 1024px) {
          .lm-section { padding: 24px 32px; }
        }

        /* mobile */
        @media (max-width: 640px) {
          .lm-section { padding: 20px 16px; }
        }

        .lm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        }

        @media (max-width: 640px) {
          .lm-grid {
            grid-template-columns: 1fr;
          }
        }

        .lm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .lm-header-left {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .lm-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .lm-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #94a3b8;
          margin: 2px 0 0;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 480px) {
          .lm-title    { font-size: 17px; }
          .lm-subtitle { font-size: 11px; }
        }
      `}</style>

      <section className="lm-section">

        {/* Header */}
        <div className="lm-header">
          <div className="lm-header-left">
            <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,#4f46e5 0%,#6366f1 60%,#818cf8 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 20px rgba(99,102,241,0.35)", flexShrink:0 }}>
              <MdSportsCricket size={24} color="#fff" />
            </div>
            <div style={{ minWidth:0 }}>
              <h2 className="lm-title">Live Cricket</h2>
              <p className="lm-subtitle">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={fetchLive}
            disabled={loading}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:12.5, fontWeight:600, background:"#fff", border:"1px solid #e2e8f0", color:"#6366f1", cursor:loading?"not-allowed":"pointer", opacity:loading?0.55:1, transition:"all 0.15s", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", flexShrink:0 }}
          >
            <FiRefreshCw size={12} style={loading ? { animation:"spin 0.75s linear infinite" } : {}} />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Quota warning */}
        {quotaMode && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:10, background:"#fffbeb", border:"1px solid #fde68a", marginBottom:16 }}>
            <svg width="13" height="13" fill="#d97706" viewBox="0 0 20 20" style={{ flexShrink:0 }}><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:"#92400e", fontWeight:500 }}>API quota exceeded — data may be limited.</span>
          </div>
        )}

        {/* Grid */}
        {loading && matches.length === 0 ? (
          <div className="lm-grid">
            {[...Array(6)].map((_,i) => <Skeleton key={i} />)}
          </div>
        ) : error ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 20px", textAlign:"center" }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#dc2626", fontWeight:600, fontSize:14, margin:0 }}>{error}</p>
            <button onClick={fetchLive} style={{ marginTop:12, padding:"8px 20px", borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, background:"#fef2f2", border:"none", color:"#ef4444", cursor:"pointer" }}>Try again</button>
          </div>
        ) : matches.length > 0 ? (
          <div className="lm-grid">
            {matches.map((m,i) => <Card key={m.id} m={m} index={i} />)}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 20px", textAlign:"center" }}>
            <div style={{ width:58, height:58, borderRadius:16, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, boxShadow:"0 4px 16px rgba(99,102,241,0.10)" }}>
              <MdSportsCricket size={28} color="#c7d2fe" />
            </div>
            <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#0f172a", fontWeight:700, fontSize:15, margin:0 }}>No live matches right now</p>
            <p style={{ fontFamily:"'DM Sans',sans-serif", color:"#94a3b8", fontSize:13, marginTop:5 }}>Check back soon for live action</p>
          </div>
        )}
      </section>
    </>
  );
};

export default LiveMatch;