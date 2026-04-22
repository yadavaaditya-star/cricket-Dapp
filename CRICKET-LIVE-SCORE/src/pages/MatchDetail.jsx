import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMapPin, FiCalendar, FiUsers } from "react-icons/fi";
import { MdSportsCricket } from "react-icons/md";
import { Chart, registerables } from "chart.js";
import { flagForTeamName } from "../components/Flag";
import { getTeamForMatch, getSeriesPointsTable, getScard, getTeamResults } from "../api/cricApi";

Chart.register(...registerables);

/* ── Helpers ─────────────────────────────────────────────────────────── */
const safe = (v, fallback = "—") => (v != null ? v : fallback);

const calcRR = (runs, overs) => {
  if (!runs || !overs) return null;
  const o = parseFloat(overs);
  if (!o) return null;
  const balls = Math.floor(o) * 6 + Math.round((o % 1) * 10);
  return ((runs / balls) * 6).toFixed(2);
};

function buildInnings(match) {
  if (!match) return [];
  const ms  = match.matchScore || {};
  const t1s = ms.team1Score   || {};
  const t2s = ms.team2Score   || {};
  const all = [
    t1s.inngs1 ? { inn: t1s.inngs1, team: match.team1 } : null,
    t2s.inngs1 ? { inn: t2s.inngs1, team: match.team2 } : null,
    t1s.inngs2 ? { inn: t1s.inngs2, team: match.team1 } : null,
    t2s.inngs2 ? { inn: t2s.inngs2, team: match.team2 } : null,
  ].filter(Boolean);
  all.sort((a, b) => (a.inn.inningsId ?? 0) - (b.inn.inningsId ?? 0));
  return all.map((entry, i) => ({
    ...entry,
    innLabel: all.length > 2 ? (i % 2 === 0 ? "1st Innings" : "2nd Innings") : "Innings",
    innNum: i + 1,
  }));
}

const C1 = "#1d4ed8";
const C2 = "#b45309";

/* ── Player Face Image ───────────────────────────────────────────────── */
function PlayerFace({ imageId, name, size = 36 }) {
  const [err, setErr] = useState(false);
  const DEFAULT_ID = 182026;
  // FIX 1: expanded invalid ID guard to catch 0, "0", "", null, undefined
  const INVALID_IDS = new Set([DEFAULT_ID, 0, "0", "", null, undefined]);
  const GRADS = [
    ["#6366f1","#4f46e5"], ["#0ea5e9","#0284c7"],
    ["#8b5cf6","#7c3aed"], ["#06b6d4","#0891b2"],
    ["#3b82f6","#2563eb"], ["#a855f7","#9333ea"],
  ];
  const [from, to] = GRADS[(name?.charCodeAt(0) || 0) % GRADS.length];
  const initials = (name || "?").split(" ").map(s => s[0] || "").slice(0, 2).join("").toUpperCase();
  const base = { width: size, height: size, borderRadius: 10, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" };
  // FIX 1 applied here
  if (imageId && !INVALID_IDS.has(imageId) && !err) {
    return (
      <div style={base}>
        <img src={`https://static.cricbuzz.com/a/img/v1/152x152/i1/c${imageId}/i.jpg`} alt={name}
          onError={() => setErr(true)}
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top", display:"block" }} />
      </div>
    );
  }
  return (
    <div style={{ ...base, background:`linear-gradient(145deg,${from},${to})` }}>
      <span style={{ fontSize: size * 0.3, fontWeight:700, color:"#fff", letterSpacing:"0.02em" }}>{initials}</span>
    </div>
  );
}

/* ── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ name, size = 44 }) {
  const flagObj = flagForTeamName(name);
  const src     = flagObj?.src   ?? null;
  const emoji   = flagObj?.emoji ?? null;
  const [imgErr, setImgErr] = useState(false);
  const GRADS = [
    ["#6366f1","#4f46e5"], ["#0ea5e9","#0284c7"],
    ["#8b5cf6","#7c3aed"], ["#06b6d4","#0891b2"],
    ["#3b82f6","#2563eb"], ["#a855f7","#9333ea"],
  ];
  const [from, to] = GRADS[(name?.charCodeAt(0) || 0) % GRADS.length];
  const initials = (name || "?").split(" ").map(s => s[0] || "").slice(0, 2).join("").toUpperCase();
  const base = { width: size * 1.5, height: size, borderRadius: 10, flexShrink: 0 };
  if (src && !imgErr) return (
    <img src={src} alt={name} onError={() => setImgErr(true)}
      style={{ ...base, objectFit:"cover", objectPosition:"center", display:"block" }} />
  );
  if (emoji) return (
    <div style={{ ...base, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize: size * 0.55, lineHeight:1 }}>
      {emoji}
    </div>
  );
  return (
    <div style={{ ...base, background:`linear-gradient(145deg,${from},${to})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize: size * 0.28, fontWeight:700, letterSpacing:"0.04em" }}>
      {initials}
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────────────────────── */
function Spinner({ color = C1 }) {
  return (
    <div style={{ padding:"40px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <div style={{ width:26, height:26, border:"3px solid #e2e8f0", borderTopColor: color, borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      <span style={{ fontSize:12, color:"#94a3b8" }}>Loading…</span>
    </div>
  );
}

/* ── Section Card ────────────────────────────────────────────────────── */
function SectionCard({ title, children }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"12px 20px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
        <span style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function MatchDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [match,    setMatch]    = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const stored = sessionStorage.getItem(`match_${id}`);
      if (stored) setMatch(JSON.parse(stored));
      else        setNotFound(true);
    } catch { setNotFound(true); }
  }, [id]);

  if (notFound) return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"'Inter',sans-serif" }}>
      <MdSportsCricket size={48} color="#cbd5e1" />
      <p style={{ color:"#94a3b8", fontSize:14, margin:0 }}>Match not found.</p>
      <button onClick={() => navigate(-1)} style={ghostBtn}>Go back</button>
    </div>
  );

  if (!match) return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:28, height:28, border:"3px solid #e2e8f0", borderTopColor:"#1d4ed8", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return <MatchDetailView match={match} onBack={() => navigate(-1)} />;
}

/* ════════════════════════════════════════════════════════════════════════ */
function MatchDetailView({ match, onBack }) {
  const [tab,    setTab]    = useState("innings");
  const [innIdx, setInnIdx] = useState(0);
  if (!match) return null;

  const innings = buildInnings(match);
  const cur     = innings[innIdx];
  const tabs    = [
    { key:"innings",     label:"Innings"     },
    ...(innings.length >= 2 ? [
      { key:"compare",   label:"Compare"     },
      { key:"charts",    label:"Charts"      },
    ] : []),
    { key:"performance", label:"Performance" },
    { key:"teams",       label:"Lineup"       },
  ];

  const ms  = match.matchScore || {};
  const t1s = ms.team1Score || {};
  const t2s = ms.team2Score || {};

  const fmtScore = (ts) => {
    const i1 = ts.inngs1;
    const i2 = ts.inngs2;
    if (!i1 || i1.runs == null) return null;
    const s1 = `${i1.runs}/${i1.wickets ?? 0}`;
    const s2 = i2?.runs != null ? ` & ${i2.runs}/${i2.wickets ?? 0}` : "";
    return s1 + s2;
  };

  const score1 = fmtScore(t1s);
  const score2 = fmtScore(t2s);

  return (
    <div className="match-detail-root" style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"'Inter',sans-serif", color:"#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .match-detail-root * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .match-detail-root .tab-btn:hover  { color:#1d4ed8 !important; }
        .match-detail-root .inn-chip:hover { opacity:0.8; }
        .match-detail-root .back-btn:hover { background:#f1f5f9 !important; }
        .md-topbar-inner   { max-width:1000px; margin:0 auto; }
        .md-content-inner  { max-width:1000px; margin:0 auto; padding:24px 20px; }
        .md-score-grid     { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; margin-bottom:14px; }
        .md-teams-grid     { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media (max-width: 640px) {
          .md-topbar-inner  { padding:0 16px; }
          .md-content-inner { padding:16px; }
          .md-score-grid    { gap:8px; }
          .md-teams-grid    { grid-template-columns:1fr; }
          .md-score-val     { font-size:16px !important; }
          .md-team-name     { font-size:12px !important; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0 20px" }}>
        <div className="md-topbar-inner">
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 0 12px", borderBottom:"1px solid #e2e8f0", marginBottom:20 }}>
            <button className="back-btn" onClick={onBack} style={{ display:"flex", alignItems:"center", gap:5, background:"transparent", border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, color:"#64748b", cursor:"pointer", fontFamily:"inherit" }}>
              <FiArrowLeft size={12} /> Back
            </button>
            <div style={{ fontSize:11, color:"#94a3b8", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {[match.matchFormat, match.matchDesc, match.seriesName].filter(Boolean).join(" · ")}
            </div>
            {match.matchId && (
              <div style={{ fontSize:10, color:"#64748b", background:"#f1f5f9", padding:"2px 8px", borderRadius:4, marginLeft:8 }}>
                ID: {match.matchId}
              </div>
            )}
          </div>

          <div style={{ paddingBottom:20 }}>
            <div className="md-score-grid">
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:6 }}>
                <Avatar name={match.team1.name} size={44} />
                <div className="md-team-name" style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>{match.team1.name}</div>
                {score1 && <div className="md-score-val" style={{ fontSize:22, fontWeight:800, color:C1, letterSpacing:"-0.02em", fontVariantNumeric:"tabular-nums" }}>{score1}</div>}
                {t1s.inngs1?.overs != null && <div style={{ fontSize:11, color:"#94a3b8" }}>{t1s.inngs1.overs} ov{t1s.inngs2?.overs ? ` & ${t1s.inngs2.overs} ov` : ""}</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, minWidth:90 }}>
                <div style={{ background:"#f1f5f9", borderRadius:10, padding:"8px 14px" }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#94a3b8", letterSpacing:"0.14em" }}>VS</div>
                </div>
                {match.status && (
                  <div style={{ display:"inline-flex", alignItems:"center", background:"#0e40a4b3", borderRadius:9, padding:"7px 14px", textAlign:"center", maxWidth:180 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#ffffff", lineHeight:1.3 }}>{match.status}</span>
                  </div>
                )}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <Avatar name={match.team2.name} size={44} />
                <div className="md-team-name" style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>{match.team2.name}</div>
                {score2 && <div className="md-score-val" style={{ fontSize:22, fontWeight:800, color:C2, letterSpacing:"-0.02em", fontVariantNumeric:"tabular-nums" }}>{score2}</div>}
                {t2s.inngs1?.overs != null && <div style={{ fontSize:11, color:"#94a3b8" }}>{t2s.inngs1.overs} ov{t2s.inngs2?.overs ? ` & ${t2s.inngs2.overs} ov` : ""}</div>}
              </div>
            </div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              {match.venue && <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#94a3b8" }}><FiMapPin size={11}/> {match.venue}</div>}
              {match.date  && <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#94a3b8" }}><FiCalendar size={11}/> {match.date}</div>}
            </div>
          </div>

          <div style={{ display:"flex", gap:0, borderTop:"1px solid #f1f5f9", overflowX:"auto" }}>
            {tabs.map(t => (
              <button key={t.key} className="tab-btn" onClick={() => setTab(t.key)} style={{
                padding:"12px 18px", fontSize:13, fontWeight:600, border:"none", background:"none",
                cursor:"pointer", textTransform:"capitalize", fontFamily:"inherit", whiteSpace:"nowrap",
                transition:"all 0.15s",
                borderBottom: tab === t.key ? "2px solid #1d4ed8" : "2px solid transparent",
                color: tab === t.key ? "#1d4ed8" : "#64748b",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="md-content-inner">
        {innings.length === 0 && tab !== "teams" && tab !== "performance" ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#94a3b8", fontSize:13 }}>No score data available.</div>
        ) : (
          <>
            {tab === "innings" && (
              <>
                {innings.length > 1 && (
                  <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap" }}>
                    {innings.map((entry, idx) => {
                      const active = innIdx === idx;
                      const col    = idx % 2 === 0 ? C1 : C2;
                      return (
                        <button key={idx} className="inn-chip" onClick={() => setInnIdx(idx)} style={{
                          display:"flex", alignItems:"center", gap:8, padding:"7px 14px",
                          borderRadius:99, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                          background: active ? col : "#fff",
                          border:     active ? `2px solid ${col}` : "2px solid #e2e8f0",
                          color:      active ? "#fff" : "#64748b",
                          transition:"all 0.15s",
                        }}>
                          <Avatar name={entry.team.name} size={22} />
                          {entry.team.short} · {entry.innLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
                {cur && <InningsPanel entry={cur} innIdx={innIdx} />}
              </>
            )}
            {tab === "compare"     && <CompareTab     innings={innings} match={match} />}
            {tab === "charts"      && <ChartsTab      innings={innings} match={match} />}
            {tab === "performance" && <PerformanceTab match={match} />}
            {tab === "teams"       && <TeamsTab       match={match} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ── Performance Tab
   ════════════════════════════════════════════════════════════════════════ */
function PerformanceTab({ match }) {
  const seriesId = match?.seriesId ?? match?.raw?.matchInfo?.seriesId ?? null;
  const matchId  = match?.matchId;

  const [points,    setPoints]    = useState(null);
  const [ptLoading, setPtLoading] = useState(true);

  const [mcData,    setMcData]    = useState(null);
  const [mcLoading, setMcLoading] = useState(true);
  const [mcError,   setMcError]   = useState(null);

  const [t1Results,    setT1Results]    = useState([]);
  const [t2Results,    setT2Results]    = useState([]);
  const [formLoading,  setFormLoading]  = useState(true);

  useEffect(() => {
    if (!seriesId) { setPtLoading(false); return; }
    getSeriesPointsTable(seriesId)
      .then(({ data }) => setPoints(data))
      .catch(() => {})
      .finally(() => setPtLoading(false));
  }, [seriesId]);

  useEffect(() => {
    if (!matchId) { setMcLoading(false); setMcError("Match ID unavailable"); return; }
    getScard(matchId)
      .then(({ data }) => setMcData(data))
      .catch(e => setMcError(e?.message || "Failed"))
      .finally(() => setMcLoading(false));
  }, [matchId]);

  const scorecard = mcData?.scorecard ?? [];

  const team1BatInnings = scorecard.filter(inn => inn.inningsid % 2 === 1);
  const team2BatInnings = scorecard.filter(inn => inn.inningsid % 2 === 0);

  // FIX 2: prepend faceimageid / faceImageId before imageid / imageId
  const mapBatsman = (b) => ({
    name:    b.name     || "—",
    runs:    b.runs     ?? "—",
    balls:   b.balls    ?? "—",
    fours:   b.fours    ?? 0,
    sixes:   b.sixes    ?? 0,
    sr:      b.strkrate ?? "—",
    out:     b.outdec   || "not out",
    imageId: b.faceimageid ?? b.faceImageId ?? b.imageid ?? b.imageId ?? null,
  });

  const mapBowler = (b) => ({
    name:    b.name     || "—",
    overs:   b.overs    ?? "—",
    runs:    b.runs     ?? "—",
    wkts:    b.wickets  ?? b.wkts ?? "—",
    econ:    b.economy  ?? b.econ ?? "—",
    maidens: b.maidens  ?? b.maiden ?? 0,
    imageId: b.faceimageid ?? b.faceImageId ?? b.imageid ?? b.imageId ?? null,
  });

  const t1bat  = team1BatInnings.flatMap(inn => (inn.batsman ?? []).map(mapBatsman));
  const t2bat  = team2BatInnings.flatMap(inn => (inn.batsman ?? []).map(mapBatsman));
  const t1bowl = team2BatInnings.flatMap(inn => (inn.bowler ?? []).map(mapBowler));
  const t2bowl = team1BatInnings.flatMap(inn => (inn.bowler ?? []).map(mapBowler));

  const getForm = (results, teamId) => {
    if (!results?.length || !teamId) return [];
    return results.map(r => {
      const info   = r?.matchInfo ?? r;
      const status = (info?.status ?? "").toLowerCase();
      const t1Name = (info?.team1?.teamName ?? info?.team1?.teamSName ?? "").toLowerCase();
      const t2Name = (info?.team2?.teamName ?? info?.team2?.teamSName ?? "").toLowerCase();
      const t1Id   = String(info?.team1?.teamId ?? "");
      const myName = String(teamId) === t1Id ? t1Name : t2Name;
      if (!status || status.includes("no result") || status.includes("abandoned") || status.includes("draw")) return "D";
      if (status.includes("won")) return status.includes(myName) ? "W" : "L";
      return "D";
    });
  };

  const team1Id = match?.raw?.matchInfo?.team1?.teamId ?? match?.team1?.teamId;
  const team2Id = match?.raw?.matchInfo?.team2?.teamId ?? match?.team2?.teamId;

  useEffect(() => {
    if (!team1Id && !team2Id) { setFormLoading(false); return; }
    const p1 = team1Id
      ? getTeamResults(team1Id)
          .then(({ data }) => {
            const groups = data?.teamMatchesData ?? [];
            const matches = groups.flatMap(g => g?.matchDetailsMap?.match ?? []);
            setT1Results(matches.slice(0, 5));
          }).catch(() => {})
      : Promise.resolve();
    const p2 = team2Id
      ? getTeamResults(team2Id)
          .then(({ data }) => {
            const groups = data?.teamMatchesData ?? [];
            const matches = groups.flatMap(g => g?.matchDetailsMap?.match ?? []);
            setT2Results(matches.slice(0, 5));
          }).catch(() => {})
      : Promise.resolve();
    Promise.all([p1, p2]).finally(() => setFormLoading(false));
  }, [team1Id, team2Id]);

  const t1form = getForm(t1Results, team1Id);
  const t2form = getForm(t2Results, team2Id);

  const ptRows = (() => {
    if (!points || points === "" || typeof points === "string") return [];
    const table = points?.pointsTable ?? points?.pointsTableInfo ?? [];
    if (Array.isArray(table) && table.length) return table;
    if (Array.isArray(table[0]?.pointsTableInfo)) return table.flatMap(g => g.pointsTableInfo);
    return [];
  })();

  const hasPtTable = !ptLoading && ptRows.length > 0;

  const [perfTeam, setPerfTeam] = useState(0);

  const formStyle = (r) => {
    if (r === "W") return { bg:"#f0fdf4", color:"#15803d", border:"#86efac" };
    if (r === "L") return { bg:"#fef2f2", color:"#dc2626", border:"#fca5a5" };
    return { bg:"#f8fafc", color:"#64748b", border:"#e2e8f0" };
  };

  const activeTeam  = perfTeam === 0 ? match.team1 : match.team2;
  const activeCol   = perfTeam === 0 ? C1 : C2;
  const activeBat   = perfTeam === 0 ? t1bat  : t2bat;
  const activeBowl  = perfTeam === 0 ? t1bowl : t2bowl;
  const activeForm  = perfTeam === 0 ? t1form : t2form;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.3s ease both" }}>

      {/* ── FIX 3: Team switcher — innings chip style ── */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {[match.team1, match.team2].map((team, idx) => {
          const active = perfTeam === idx;
          const col    = idx === 0 ? C1 : C2;
          return (
            <button
              key={idx}
              className="inn-chip"
              onClick={() => setPerfTeam(idx)}
              style={{
                display:"flex", alignItems:"center", gap:8, padding:"7px 14px",
                borderRadius:99, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                background: active ? col : "#fff",
                border:     active ? `2px solid ${col}` : "2px solid #e2e8f0",
                color:      active ? "#fff" : "#64748b",
                transition:"all 0.15s",
              }}
            >
              <Avatar name={team.name} size={22} />
              {team.short ?? team.name}
            </button>
          );
        })}
      </div>

      {/* ══ Recent Form ══ */}
      <SectionCard title={`${activeTeam.name} — Recent Form`}>
        {formLoading ? <Spinner color={activeCol} /> : (
          <div style={{ padding:"16px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Avatar name={activeTeam.name} size={28} />
                <span style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{activeTeam.short}</span>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {activeForm.length === 0
                  ? <span style={{ fontSize:12, color:"#94a3b8" }}>No recent data</span>
                  : activeForm.map((r, i) => {
                      const s = formStyle(r);
                      return (
                        <div key={i} style={{ width:34, height:34, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, background:s.bg, color:s.color, border:`1.5px solid ${s.border}` }}>{r}</div>
                      );
                    })
                }
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ══ Batting Stats ══ */}
      <SectionCard title={`${activeTeam.name} — Batting`}>
        {mcLoading ? <Spinner color={activeCol} /> : activeBat.length === 0 ? (
          <div style={{ padding:"24px", textAlign:"center", fontSize:12, color:"#94a3b8" }}>No batting data available</div>
        ) : (
          <div>
            {activeBat.map((r, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                borderBottom: i < activeBat.length - 1 ? "1px solid #f1f5f9" : "none",
                background: i % 2 === 0 ? "#fff" : "#fafafa",
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.name}</div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.out}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                  <div style={{ textAlign:"center", minWidth:38 }}>
                    <div style={{ fontSize:18, fontWeight:800, color:activeCol, letterSpacing:"-0.02em" }}>{r.runs}</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em" }}>RUNS</div>
                  </div>
                  <div style={{ width:1, height:28, background:"#f1f5f9" }} />
                  <div style={{ textAlign:"center", minWidth:32 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{r.balls}</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em" }}>BALLS</div>
                  </div>
                  <div style={{ textAlign:"center", minWidth:28 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{r.fours}</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em" }}>4s</div>
                  </div>
                  <div style={{ textAlign:"center", minWidth:28 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{r.sixes}</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em" }}>6s</div>
                  </div>
                  <div style={{ textAlign:"center", minWidth:38 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{r.sr}</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em" }}>SR</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ══ Bowling Stats ══ */}
      <SectionCard title={`${activeTeam.name} — Bowling`}>
        {mcLoading ? <Spinner color={activeCol} /> : activeBowl.length === 0 ? (
          <div style={{ padding:"24px", textAlign:"center", fontSize:12, color:"#94a3b8" }}>No bowling data available</div>
        ) : (
          <div>
            {activeBowl.map((r, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                borderBottom: i < activeBowl.length - 1 ? "1px solid #f1f5f9" : "none",
                background: i % 2 === 0 ? "#fff" : "#fafafa",
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.name}</div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{r.overs} overs</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                  <div style={{ textAlign:"center", minWidth:28 }}>
                    <div style={{ fontSize:18, fontWeight:800, color:activeCol, letterSpacing:"-0.02em" }}>{r.wkts}</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em" }}>WKTS</div>
                  </div>
                  <div style={{ width:1, height:28, background:"#f1f5f9" }} />
                  <div style={{ textAlign:"center", minWidth:32 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{r.runs}</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em" }}>RUNS</div>
                  </div>
                  <div style={{ textAlign:"center", minWidth:36 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{r.econ}</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em" }}>ECON</div>
                  </div>
                  <div style={{ textAlign:"center", minWidth:32 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{r.maidens}</div>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em" }}>MDNS</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ══ Series Points Table — only shown for tournaments ══ */}
      {hasPtTable && (
        <SectionCard title="Series Points Table">
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["#","Team","M","W","L","NR","Pts","NRR"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", fontSize:10, fontWeight:700, color:"#94a3b8", textAlign: h==="Team"?"left":"right", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ptRows.map((row, i) => {
                  const tname = row?.teamName ?? row?.team?.teamName ?? row?.team ?? "—";
                  const isHL  = tname === match.team1.name || tname === match.team2.name;
                  return (
                    <tr key={i} style={{ borderTop:"1px solid #f1f5f9", background: isHL?"#eff6ff":i%2===0?"#fff":"#fafafa" }}>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#94a3b8", fontWeight:600, textAlign:"right" }}>{i+1}</td>
                      <td style={{ padding:"11px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <Avatar name={tname} size={22} />
                          <span style={{ fontSize:13, fontWeight: isHL?700:600, color:"#0f172a" }}>{tname}</span>
                          {isHL && <span style={{ fontSize:9, fontWeight:700, background:"#dbeafe", color:"#1d4ed8", borderRadius:4, padding:"1px 5px" }}>THIS MATCH</span>}
                        </div>
                      </td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#64748b", textAlign:"right" }}>{row?.matchesPlayed ?? row?.played ?? "—"}</td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#15803d", fontWeight:700, textAlign:"right" }}>{row?.wins ?? row?.won ?? "—"}</td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#dc2626", fontWeight:700, textAlign:"right" }}>{row?.losses ?? row?.lost ?? "—"}</td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#64748b", textAlign:"right" }}>{row?.noResult ?? row?.nr ?? "—"}</td>
                      <td style={{ padding:"11px 14px", fontSize:14, fontWeight:800, color:C1, textAlign:"right" }}>{row?.points ?? row?.pts ?? "—"}</td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#64748b", textAlign:"right" }}>{row?.nrr ?? row?.netRunRate ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ── Teams Tab ──────────────────────────────────────────────────────── */
function TeamsTab({ match }) {
  const [t1Data,    setT1Data]    = useState(null);
  const [t2Data,    setT2Data]    = useState(null);
  const [t1Loading, setT1Loading] = useState(true);
  const [t2Loading, setT2Loading] = useState(true);
  const [t1Error,   setT1Error]   = useState(null);
  const [t2Error,   setT2Error]   = useState(null);

  const team1Id = match?.raw?.matchInfo?.team1?.teamId ?? match?.team1?.teamId ?? null;
  const team2Id = match?.raw?.matchInfo?.team2?.teamId ?? match?.team2?.teamId ?? null;
  const matchId = match?.matchId;

  useEffect(() => {
    if (!matchId || !team1Id) { setT1Loading(false); setT1Error("Team ID unavailable"); return; }
    getTeamForMatch(matchId, team1Id)
      .then(({ data }) => setT1Data(data))
      .catch(e => setT1Error(e?.message || "Failed"))
      .finally(() => setT1Loading(false));
  }, [matchId, team1Id]);

  useEffect(() => {
    if (!matchId || !team2Id) { setT2Loading(false); setT2Error("Team ID unavailable"); return; }
    getTeamForMatch(matchId, team2Id)
      .then(({ data }) => setT2Data(data))
      .catch(e => setT2Error(e?.message || "Failed"))
      .finally(() => setT2Loading(false));
  }, [matchId, team2Id]);

  const extractPlayers = (data) => {
    if (!data) return [];
    if (Array.isArray(data.player) && data.player[0]?.player) {
      return data.player
        .filter(g => g.category !== "support staff")
        .flatMap(g => g.player || []);
    }
    if (data.players && typeof data.players === "object" && !Array.isArray(data.players)) {
      return Object.values(data.players).flat();
    }
    if (Array.isArray(data.players)) return data.players;
    if (Array.isArray(data.squad)) {
      if (data.squad[0]?.player) return data.squad.flatMap(s => s.player || []);
      return data.squad;
    }
    return [];
  };

  const ROLE_ORDER = ["WK-Batsman","Batsman","Batting Allrounder","Allrounder","Bowling Allrounder","Bowler"];
  const sortPlayers = (players) => [...players].sort((a, b) => {
    const ra = ROLE_ORDER.indexOf(a.role || a.playerRole || "");
    const rb = ROLE_ORDER.indexOf(b.role || b.playerRole || "");
    if (ra === -1 && rb === -1) return 0;
    if (ra === -1) return 1;
    if (rb === -1) return -1;
    return ra - rb;
  });

  const roleBadge = (role) => {
    const r = role || "";
    if (r.includes("WK"))       return { bg:"#eff6ff", color:"#1d4ed8",  label:"WK"   };
    if (r.includes("Allround")) return { bg:"#f0fdf4", color:"#15803d",  label:"AR"   };
    if (r.includes("Bowler"))   return { bg:"#fef3c7", color:"#b45309",  label:"Bowl" };
    if (r.includes("Bat"))      return { bg:"#fdf4ff", color:"#7c3aed",  label:"Bat"  };
    return { bg:"#f1f5f9", color:"#64748b", label:"—" };
  };

  function TeamSquad({ teamName, color, data, loading, error }) {
    const players = sortPlayers(extractPlayers(data));
    return (
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", background: color === C1 ? "#eff6ff" : "#fffbeb", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:10 }}>
          <Avatar name={teamName} size={32} />
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{teamName}</div>
            {!loading && !error && <div style={{ fontSize:11, color:"#94a3b8" }}>{players.length} players</div>}
          </div>
        </div>
        {loading ? <Spinner color={color} /> : error ? (
          <div style={{ padding:"32px 20px", textAlign:"center" }}>
            <FiUsers size={28} color="#e2e8f0" style={{ display:"block", margin:"0 auto 8px" }} />
            <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>{error}</p>
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding:"32px 20px", textAlign:"center" }}>
            <FiUsers size={28} color="#e2e8f0" style={{ display:"block", margin:"0 auto 8px" }} />
            <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>Squad not announced</p>
          </div>
        ) : (
          <div>
            {players.map((p, i) => {
              const name   = p.name || p.playerName || p.fullName || "Unknown";
              const role   = p.role || p.playerRole || "";
              const isCap  = p.captain === "true" || p.captain === true;
              const isWK   = p.keeper  === "true" || p.keeper  === true || role.includes("WK");
              const badge  = roleBadge(role);
              const faceId = p.faceimageid || p.faceImageId || p.imageId || null;
              return (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap:12, padding:"10px 18px",
                  borderBottom: i < players.length - 1 ? "1px solid #f8fafc" : "none",
                  background: isCap ? (color === C1 ? "#f0f7ff" : "#fffbf0") : i%2===0 ? "#fff" : "#fafafa",
                }}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <PlayerFace imageId={faceId} name={name} size={42} />
                    <div style={{ position:"absolute", bottom:-4, right:-4, width:18, height:18, borderRadius:5, background:"#1e293b", border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800, color:"#fff" }}>{i+1}</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                      <span style={{ fontSize:13, fontWeight: isCap?700:600, color:"#0f172a" }}>{name}</span>
                      {isCap && <span style={{ fontSize:9, fontWeight:800, background:"#fef3c7", color:"#b45309", borderRadius:4, padding:"2px 6px", border:"1px solid #fde68a" }}>CAPTAIN</span>}
                      {isWK && !role.includes("WK") && <span style={{ fontSize:9, fontWeight:700, background:"#eff6ff", color:"#1d4ed8", borderRadius:4, padding:"1px 5px" }}>WK</span>}
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{role || "—"}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:6, background: badge.bg, color: badge.color, flexShrink:0, whiteSpace:"nowrap" }}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ animation:"fadeUp 0.3s ease both" }}>
      {(!team1Id || !team2Id) && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, background:"#fffbeb", border:"1px solid #fde68a", marginBottom:16 }}>
          <svg width="13" height="13" fill="#d97706" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span style={{ fontSize:11.5, color:"#92400e", fontWeight:500, fontFamily:"inherit" }}>Team IDs not available — squad details may be limited.</span>
        </div>
      )}
      <div className="md-teams-grid">
        <TeamSquad teamName={match.team1.name} color={C1} data={t1Data} loading={t1Loading} error={t1Error} />
        <TeamSquad teamName={match.team2.name} color={C2} data={t2Data} loading={t2Loading} error={t2Error} />
      </div>
    </div>
  );
}

/* ── Innings Panel ──────────────────────────────────────────────────── */
function InningsPanel({ entry, innIdx }) {
  const { inn, team, innLabel } = entry;
  const wkts  = inn.wickets ?? 0;
  const rr    = calcRR(inn.runs, inn.overs);
  const col   = innIdx % 2 === 0 ? C1 : C2;
  const pct   = Math.min(Math.round(((inn.runs ?? 0) / 400) * 100), 100);
  const balls = inn.overs != null
    ? Math.floor(parseFloat(inn.overs)) * 6 + Math.round((parseFloat(inn.overs) % 1) * 10)
    : null;

  const rows = [
    { label:"Runs",     value: safe(inn.runs),  hi: true  },
    { label:"Wickets",  value: `${wkts} / 10`,  hi: false },
    { label:"Overs",    value: safe(inn.overs), hi: false },
    { label:"Run rate", value: rr ?? "—",        hi: false },
    { label:"Balls",    value: balls ?? "—",     hi: false },
    { label:"Result",   value: wkts===10 ? "All out" : inn.isDeclared ? "Declared" : "Batting", hi: false },
  ];

  return (
    <div style={{ animation:"fadeUp 0.3s ease both" }}>
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, padding:"20px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <Avatar name={team.name} size={44} />
          <div>
            <div style={{ fontSize:12, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{innLabel}</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", marginBottom:6 }}>{team.name}</div>
            <div style={{ fontSize:34, fontWeight:800, color:col, letterSpacing:"-0.03em", fontVariantNumeric:"tabular-nums", lineHeight:1 }}>
              {inn.runs}/{wkts}
              {inn.isDeclared && <span style={{ fontSize:16, marginLeft:4 }}>d</span>}
            </div>
            <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>{inn.overs} overs</div>
          </div>
        </div>
        {rr && (
          <div style={{ textAlign:"center", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"14px 20px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", marginBottom:6 }}>RUN RATE</div>
            <div style={{ fontSize:28, fontWeight:800, color:col, letterSpacing:"-0.02em" }}>{rr}</div>
          </div>
        )}
      </div>
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"12px 20px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em" }}>Match Statistics</span>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length-1 ? "1px solid #f1f5f9" : "none" }}>
                <td style={{ padding:"13px 20px", fontSize:13, color:"#64748b", fontWeight:500, width:"50%" }}>{r.label}</td>
                <td style={{ padding:"13px 20px", fontSize:13, fontWeight:700, color: r.hi ? col : "#0f172a", textAlign:"right" }}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, padding:"18px 20px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:"0.06em", textTransform:"uppercase" }}>Innings Progress</span>
          <span style={{ fontSize:12, fontWeight:700, color:col }}>{pct}% of 400</span>
        </div>
        <div style={{ height:10, background:"#f1f5f9", borderRadius:99, overflow:"hidden", marginBottom:8 }}>
          <div style={{ height:"100%", borderRadius:99, width:`${pct}%`, background: wkts===10?"linear-gradient(90deg,#f59e0b,#ef4444)":col, transition:"width 0.8s cubic-bezier(0.34,1.2,0.64,1)" }} />
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
          {Array.from({ length:10 }, (_, i) => (
            <div key={i} style={{ width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, background: i<wkts?"#fef2f2":"#f8fafc", border: i<wkts?"1px solid #fecaca":"1px solid #e2e8f0", color: i<wkts?"#ef4444":"#cbd5e1" }}>{i+1}</div>
          ))}
        </div>
      </div>
      {(inn.isDeclared || inn.isFollowOn) && (
        <div style={{ display:"flex", gap:8 }}>
          {inn.isDeclared && <span style={{ fontSize:12, fontWeight:600, color:"#1d4ed8", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"5px 12px" }}>Declared</span>}
          {inn.isFollowOn && <span style={{ fontSize:12, fontWeight:600, color:"#b45309", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:"5px 12px" }}>Follow-on</span>}
        </div>
      )}
    </div>
  );
}

/* ── Compare Tab ────────────────────────────────────────────────────── */
function CompareTab({ innings, match }) {
  const t1inn = innings.filter(e => e.team.name === match.team1.name);
  const t2inn = innings.filter(e => e.team.name === match.team2.name);
  const sections = [
    { label:"1st Innings", inn1: t1inn[0], inn2: t2inn[0] },
    ...(t1inn[1] || t2inn[1] ? [{ label:"2nd Innings", inn1: t1inn[1], inn2: t2inn[1] }] : []),
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.3s ease both" }}>
      {sections.map((sec, si) => {
        const e1 = sec.inn1?.inn;
        const e2 = sec.inn2?.inn;
        const metrics = [
          { label:"Runs",     v1:safe(e1?.runs),    v2:safe(e2?.runs),    better:(a,b)=>Number(a)>Number(b) },
          { label:"Wickets",  v1:safe(e1?.wickets), v2:safe(e2?.wickets), better:(a,b)=>Number(a)<Number(b) },
          { label:"Overs",    v1:safe(e1?.overs),   v2:safe(e2?.overs),   better:null },
          { label:"Run rate", v1:calcRR(e1?.runs,e1?.overs)??"—", v2:calcRR(e2?.runs,e2?.overs)??"—", better:(a,b)=>parseFloat(a)>parseFloat(b) },
          { label:"Balls",
            v1:e1?.overs!=null?String(Math.floor(parseFloat(e1.overs))*6+Math.round((parseFloat(e1.overs)%1)*10)):"—",
            v2:e2?.overs!=null?String(Math.floor(parseFloat(e2.overs))*6+Math.round((parseFloat(e2.overs)%1)*10)):"—",
            better:null },
        ];
        return (
          <div key={si} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"12px 20px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em" }}>{sec.label}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:8 }}>
                <Avatar name={match.team1.name} size={28} />
                <span style={{ fontSize:13, fontWeight:700, color:C1 }}>{match.team1.short}</span>
              </div>
              <div style={{ padding:"14px 0", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:10, fontWeight:700, color:"#cbd5e1", letterSpacing:"0.08em" }}>STAT</span>
              </div>
              <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" }}>
                <span style={{ fontSize:13, fontWeight:700, color:C2 }}>{match.team2.short}</span>
                <Avatar name={match.team2.name} size={28} />
              </div>
            </div>
            {metrics.map((m, mi) => {
              const t1w = m.better && m.v1!=="—" && m.v2!=="—" && m.better(m.v1, m.v2);
              const t2w = m.better && m.v1!=="—" && m.v2!=="—" && m.better(m.v2, m.v1);
              return (
                <div key={mi} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", borderTop:"1px solid #f1f5f9", alignItems:"center" }}>
                  <div style={{ padding:"14px 20px", fontSize:18, fontWeight:800, color:t1w?C1:"#0f172a", display:"flex", alignItems:"center", gap:5 }}>
                    {m.v1}{t1w && <span style={{ fontSize:10, color:C1, fontWeight:700 }}>▲</span>}
                  </div>
                  <div style={{ padding:"14px 0", textAlign:"center", fontSize:11, fontWeight:600, color:"#94a3b8" }}>{m.label}</div>
                  <div style={{ padding:"14px 20px", fontSize:18, fontWeight:800, color:t2w?C2:"#0f172a", textAlign:"right", display:"flex", alignItems:"center", justifyContent:"flex-end", gap:5 }}>
                    {t2w && <span style={{ fontSize:10, color:C2, fontWeight:700 }}>▲</span>}{m.v2}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ── Charts Tab ─────────────────────────────────────────────────────── */
function ChartsTab({ innings, match }) {
  const barRef      = useRef(null);
  const rrRef       = useRef(null);
  const lineRef     = useRef(null);
  const rrLineRef   = useRef(null);
  const wktRef      = useRef(null);
  const pieRuns1Ref = useRef(null);
  const pieRuns2Ref = useRef(null);
  const donutWkt1Ref = useRef(null);
  const donutWkt2Ref = useRef(null);

  const barInst      = useRef(null);
  const rrInst       = useRef(null);
  const lineInst     = useRef(null);
  const rrLineInst   = useRef(null);
  const wktInst      = useRef(null);
  const pieRuns1Inst = useRef(null);
  const pieRuns2Inst = useRef(null);
  const donutWkt1Inst = useRef(null);
  const donutWkt2Inst = useRef(null);

  const COLORS = [C1, C2, "#059669", "#7c3aed"];
  const BGLPHA = [
    "rgba(29,78,216,0.15)",
    "rgba(180,83,9,0.15)",
    "rgba(5,150,105,0.15)",
    "rgba(124,58,237,0.15)",
  ];

  const PIE_PALETTES = [
    ["#1d4ed8","#3b82f6","#93c5fd","#bfdbfe","#dbeafe"],
    ["#b45309","#d97706","#fbbf24","#fde68a","#fef3c7"],
    ["#059669","#10b981","#6ee7b7","#a7f3d0","#d1fae5"],
    ["#7c3aed","#8b5cf6","#c4b5fd","#ddd6fe","#ede9fe"],
  ];

  const chartBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: "#64748b", font: { size: 11, family: "Inter,sans-serif" }, maxTicksLimit: 10 },
        grid: { color: "#f1f5f9" },
      },
      y: {
        ticks: { color: "#64748b", font: { size: 11, family: "Inter,sans-serif" } },
        grid: { color: "#f1f5f9" },
        beginAtZero: true,
      },
    },
  };

  const buildOverData = (inn) => {
    if (!inn?.runs || !inn?.overs) return [];
    const totalOvers = parseFloat(inn.overs);
    const totalRuns  = inn.runs;
    const steps      = Math.ceil(totalOvers);
    return Array.from({ length: steps }, (_, i) => {
      const progress = Math.min((i + 1) / totalOvers, 1);
      return Math.round(totalRuns * Math.pow(progress, 0.85));
    });
  };

  const buildRRData = (inn) => {
    const overData = buildOverData(inn);
    return overData.map((runs, i) => {
      const balls = (i + 1) * 6;
      return parseFloat(((runs / balls) * 6).toFixed(2));
    });
  };

  const buildWktData = (inn) => {
    if (!inn?.overs) return [];
    const totalOvers   = parseFloat(inn.overs);
    const totalWickets = inn.wickets ?? 0;
    const steps        = Math.ceil(totalOvers);
    return Array.from({ length: steps }, (_, i) => {
      const progress = Math.min((i + 1) / totalOvers, 1);
      return Math.round(totalWickets * Math.pow(progress, 1.4));
    });
  };

  /* Split an innings into powerplay / middle / death thirds */
  const splitPhases = (inn) => {
    if (!inn?.runs || !inn?.overs) return null;
    const totalOvers = parseFloat(inn.overs);
    const totalRuns  = inn.runs;
    const pp   = Math.min(6,  totalOvers);
    const mid  = Math.max(0, Math.min(15, totalOvers) - 6);
    const death= Math.max(0, totalOvers - 21);
    const ppRuns   = Math.round(totalRuns * (pp   / totalOvers) * 1.15);
    const midRuns  = Math.round(totalRuns * (mid  / totalOvers) * 0.85);
    const deathRuns= Math.max(0, totalRuns - ppRuns - midRuns);
    return { ppRuns, midRuns, deathRuns };
  };

  /* Boundary vs non-boundary runs estimate */
  const splitBoundaries = (inn) => {
    if (!inn?.runs) return null;
    const fours = inn.fours ?? Math.round(inn.runs * 0.22 / 4);
    const sixes = inn.sixes ?? Math.round(inn.runs * 0.12 / 6);
    const boundaryRuns = fours * 4 + sixes * 6;
    const dotRuns = Math.max(0, inn.runs - boundaryRuns);
    return { fours, sixes, boundaryRuns, dotRuns, fours4: fours * 4, sixes6: sixes * 6 };
  };

  useEffect(() => {
    [barInst, rrInst, lineInst, rrLineInst, wktInst,
     pieRuns1Inst, pieRuns2Inst, donutWkt1Inst, donutWkt2Inst
    ].forEach(r => r.current?.destroy());

    const shortLabels = innings.map(
      e => `${e.team.short}${innings.length > 2 ? ` Inn${e.innNum}` : ""}`
    );
    const maxOvers = Math.max(...innings.map(e => Math.ceil(parseFloat(e.inn.overs ?? 0))));
    const overLabels = Array.from({ length: maxOvers }, (_, i) => `Ov ${i + 1}`);

    /* ── Bar: Total Runs ── */
    if (barRef.current) {
      barInst.current = new Chart(barRef.current, {
        type: "bar",
        data: {
          labels: shortLabels,
          datasets: [{
            data:            innings.map(e => e.inn.runs ?? 0),
            backgroundColor: innings.map((_, i) => BGLPHA[i % BGLPHA.length]),
            borderColor:     innings.map((_, i) => COLORS[i % COLORS.length]),
            borderWidth: 2, borderRadius: 8, borderSkipped: false,
          }],
        },
        options: {
          ...chartBase,
          plugins: { ...chartBase.plugins, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} runs` } } },
        },
      });
    }

    /* ── Bar: Overall Run Rate ── */
    if (rrRef.current) {
      rrInst.current = new Chart(rrRef.current, {
        type: "bar",
        data: {
          labels: shortLabels,
          datasets: [{
            data:            innings.map(e => { const r = calcRR(e.inn.runs, e.inn.overs); return r ? parseFloat(r) : 0; }),
            backgroundColor: innings.map((_, i) => BGLPHA[i % BGLPHA.length]),
            borderColor:     innings.map((_, i) => COLORS[i % COLORS.length]),
            borderWidth: 2, borderRadius: 8, borderSkipped: false,
          }],
        },
        options: {
          ...chartBase,
          plugins: { ...chartBase.plugins, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)} rpo` } } },
          scales: { ...chartBase.scales, y: { ...chartBase.scales.y, ticks: { ...chartBase.scales.y.ticks, callback: v => v.toFixed(1) } } },
        },
      });
    }

    /* ── Line: Cumulative Runs ── */
    if (lineRef.current) {
      lineInst.current = new Chart(lineRef.current, {
        type: "line",
        data: {
          labels: overLabels,
          datasets: innings.map((e, i) => ({
            label: shortLabels[i], data: buildOverData(e.inn),
            borderColor: COLORS[i % COLORS.length], backgroundColor: BGLPHA[i % BGLPHA.length],
            borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, tension: 0.4, fill: true,
          })),
        },
        options: {
          ...chartBase,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} runs` } } },
        },
      });
    }

    /* ── Line: Run Rate Over Time ── */
    if (rrLineRef.current) {
      rrLineInst.current = new Chart(rrLineRef.current, {
        type: "line",
        data: {
          labels: overLabels,
          datasets: innings.map((e, i) => ({
            label: shortLabels[i], data: buildRRData(e.inn),
            borderColor: COLORS[i % COLORS.length], backgroundColor: BGLPHA[i % BGLPHA.length],
            borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, tension: 0.4,
            fill: false, borderDash: i % 2 === 1 ? [6, 3] : [],
          })),
        },
        options: {
          ...chartBase,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} rpo` } } },
          scales: { ...chartBase.scales, y: { ...chartBase.scales.y, ticks: { ...chartBase.scales.y.ticks, callback: v => v.toFixed(1) } } },
        },
      });
    }

    /* ── Line: Wickets Timeline ── */
    if (wktRef.current) {
      wktInst.current = new Chart(wktRef.current, {
        type: "line",
        data: {
          labels: overLabels,
          datasets: innings.map((e, i) => ({
            label: shortLabels[i], data: buildWktData(e.inn),
            borderColor: COLORS[i % COLORS.length], backgroundColor: BGLPHA[i % BGLPHA.length],
            borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, tension: 0.3,
            fill: true, borderDash: i % 2 === 1 ? [6, 3] : [],
          })),
        },
        options: {
          ...chartBase,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} wkt${ctx.parsed.y !== 1 ? "s" : ""}` } } },
          scales: { ...chartBase.scales, y: { ...chartBase.scales.y, min: 0, max: 10, ticks: { ...chartBase.scales.y.ticks, stepSize: 2 } } },
        },
      });
    }

    /* ── Pie / Donut helpers ── */
    const makePie = (ref, instRef, labels, data, colors, isDoughnut = false, centerText = null) => {
      if (!ref.current) return;
      instRef.current = new Chart(ref.current, {
        type: isDoughnut ? "doughnut" : "pie",
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderColor:     "#fff",
            borderWidth:     2,
            hoverOffset:     6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: isDoughnut ? "65%" : "0%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct   = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                  return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                },
              },
            },
          },
        },
        plugins: centerText ? [{
          id: "centerText",
          afterDraw(chart) {
            const { ctx, chartArea: { left, right, top, bottom } } = chart;
            const cx = (left + right) / 2;
            const cy = (top  + bottom) / 2;
            ctx.save();
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.font         = "700 18px Inter,sans-serif";
            ctx.fillStyle    = "#0f172a";
            ctx.fillText(centerText.line1, cx, cy - 10);
            ctx.font      = "500 11px Inter,sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText(centerText.line2, cx, cy + 10);
            ctx.restore();
          },
        }] : [],
      });
    };

    /* ── Pie: Runs Share between innings (only if 2+ innings) ── */
    if (innings.length >= 2) {
      const runsData   = innings.map(e => e.inn.runs ?? 0);
      const runsColors = innings.map((_, i) => COLORS[i % COLORS.length]);
      makePie(pieRuns1Ref, pieRuns1Inst, shortLabels, runsData, runsColors, false);
    }

    /* ── Donut: Boundary vs Non-boundary for first innings ── */
    innings.forEach((e, i) => {
      const ref  = i === 0 ? donutWkt1Ref  : donutWkt2Ref;
      const inst = i === 0 ? donutWkt1Inst : donutWkt2Inst;
      const bd   = splitBoundaries(e.inn);
      if (!bd) return;
      const pal = PIE_PALETTES[i % PIE_PALETTES.length];
      makePie(
        ref, inst,
        ["4s Runs", "6s Runs", "Other Runs"],
        [bd.fours4, bd.sixes6, bd.dotRuns],
        [pal[0], pal[1], pal[3]],
        true,
        { line1: `${e.inn.runs ?? 0}`, line2: "total runs" }
      );
    });

    /* ── Pie: Phase breakdown for innings[0] ── */
    if (innings.length >= 1) {
      const ph = splitPhases(innings[0].inn);
      if (ph) {
        const pal = PIE_PALETTES[0];
        makePie(
          pieRuns2Ref, pieRuns2Inst,
          ["Powerplay (1–6)", "Middle (7–15)", "Death (16+)"],
          [ph.ppRuns, ph.midRuns, ph.deathRuns],
          [pal[0], pal[2], pal[1]],
          false
        );
      }
    }

    return () => {
      [barInst, rrInst, lineInst, rrLineInst, wktInst,
       pieRuns1Inst, pieRuns2Inst, donutWkt1Inst, donutWkt2Inst
      ].forEach(r => r.current?.destroy());
    };
  }, [innings]);

  /* ── Reusable chart card ── */
  const ChartCard = ({ title, canvasRef, height = 220, legend = null }) => (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </div>
      {legend && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          {legend.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ position: "relative", height }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );

  /* ── Donut card (two side by side) ── */
  const DonutPair = () => {
    const bd1 = innings[0] ? splitBoundaries(innings[0].inn) : null;
    const bd2 = innings[1] ? splitBoundaries(innings[1].inn) : null;
    const pal1 = PIE_PALETTES[0];
    const pal2 = PIE_PALETTES[1];
    const legend = [
      { color: pal1[0], label: "4s runs" },
      { color: pal1[1], label: "6s runs" },
      { color: pal1[3], label: "other" },
    ];
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Boundary vs Other Runs
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          {[
            { color: "#1d4ed8", label: "4s runs" },
            { color: "#3b82f6", label: "6s runs" },
            { color: "#bfdbfe", label: "other" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: innings.length >= 2 ? "1fr 1fr" : "1fr", gap: 16 }}>
          {innings.slice(0, 2).map((e, i) => {
            const ref  = i === 0 ? donutWkt1Ref : donutWkt2Ref;
            const pal  = PIE_PALETTES[i];
            const bd   = i === 0 ? bd1 : bd2;
            return (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? C1 : C2, marginBottom: 8, textAlign: "center" }}>
                  {e.team.short}{innings.length > 2 ? ` · Inn${e.innNum}` : ""}
                </div>
                <div style={{ position: "relative", height: 180 }}>
                  <canvas ref={ref} />
                </div>
                {bd && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: pal[0] }}>{bd.fours4}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{bd.fours} fours</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: pal[1] }}>{bd.sixes6}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{bd.sixes} sixes</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8" }}>{bd.dotRuns}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>other</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp 0.3s ease both" }}>

      {/* ── Legend ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", padding: "14px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
        {innings.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              {e.team.name}{innings.length > 2 ? ` · Inn ${e.innNum}` : ""}
            </span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#94a3b8" strokeWidth="2" /></svg>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Inn 1</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,3" /></svg>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Inn 2</span>
          </div>
        </div>
      </div>

      {/* ── Line Charts ── */}
      <ChartCard title="Cumulative Runs Progression" canvasRef={lineRef} height={260} />
      <ChartCard title="Run Rate Over Time (per over)" canvasRef={rrLineRef} height={240} />
      <ChartCard title="Wickets Timeline" canvasRef={wktRef} height={220} />

      {/* ── Pie: Runs Share + Phase Breakdown ── */}
      <div style={{ display: "grid", gridTemplateColumns: innings.length >= 2 ? "1fr 1fr" : "1fr", gap: 16 }}>
        {innings.length >= 2 && (
          <ChartCard
            title="Runs Share"
            canvasRef={pieRuns1Ref}
            height={200}
            legend={innings.map((e, i) => ({ color: COLORS[i % COLORS.length], label: e.team.short }))}
          />
        )}
        <ChartCard
          title={`Phase Breakdown — ${innings[0]?.team?.short ?? ""}`}
          canvasRef={pieRuns2Ref}
          height={200}
          legend={[
            { color: PIE_PALETTES[0][0], label: "Powerplay (1–6)" },
            { color: PIE_PALETTES[0][2], label: "Middle (7–15)"   },
            { color: PIE_PALETTES[0][1], label: "Death (16+)"     },
          ]}
        />
      </div>

      {/* ── Donut: Boundary breakdown ── */}
      <DonutPair />

      {/* ── Bar Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ChartCard title="Total Runs Scored" canvasRef={barRef} height={200} />
        <ChartCard title="Overall Run Rate"  canvasRef={rrRef}  height={200} />
      </div>

      {/* ── Wickets Lost Visual ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Wickets Lost</span>
        </div>
        {innings.map((e, i) => {
          const wkts = e.inn.wickets ?? 0;
          return (
            <div key={i} style={{ padding: "14px 20px", borderBottom: i < innings.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={e.team.name} size={24} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    {e.team.name}{innings.length > 2 ? ` · Inn ${e.innNum}` : ""}
                  </span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: COLORS[i % COLORS.length] }}>
                  {wkts}<span style={{ fontSize: 12, color: "#cbd5e1", marginLeft: 2 }}>/10</span>
                </span>
              </div>
              <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, background: COLORS[i % COLORS.length], width: `${(wkts / 10) * 100}%`, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {Array.from({ length: 10 }, (_, wi) => (
                  <div key={wi} style={{
                    width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    background: wi < wkts ? "#fef2f2" : "#f8fafc",
                    border:     wi < wkts ? "1px solid #fecaca" : "1px solid #e2e8f0",
                    color:      wi < wkts ? "#ef4444" : "#cbd5e1",
                  }}>{wi + 1}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
/* ── Shared ── */
const ghostBtn = {
  display:"flex", alignItems:"center", gap:5,
  padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600,
  background:"#fff", border:"1px solid #e2e8f0", color:"#64748b",
  cursor:"pointer", fontFamily:"inherit",
};