import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitMatchEventHash, fetchStoredMatchHash, submitFinalResult } from "../api/blockchainApi";

export default function Blockchain() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("final"); // 'final' | 'event'

  // Final result form state
  const [matchId, setMatchId] = useState("");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [winner, setWinner] = useState("");
  const [score, setScore] = useState("");

  // Event hash form state
  const [eventMatchId, setEventMatchId] = useState("");
  const [eventType, setEventType] = useState("Key Event");
  const [eventData, setEventData] = useState("Runs: 24, Wicket: false, Ball: 12.3");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStoreFinal = async () => {
    setError(null);
    setResult(null);
    if (!matchId.trim() || !team1.trim() || !team2.trim() || !winner.trim() || !score.trim()) {
      setError("Please fill in all fields: Match ID, Team 1, Team 2, Winner, and Score.");
      return;
    }
    setLoading(true);

    try {
      const response = await submitFinalResult(matchId.trim(), team1.trim(), team2.trim(), winner.trim(), score.trim());
      setResult({
        title: "Final Result Stored",
        message: response.blockchainStored
          ? `Match result hash stored on chain!\nTx: ${response.txHash?.slice(0, 20)}...`
          : "Hash generated locally. Configure blockchain settings to store on-chain.",
        hash: response.resultHash,
        fullResult: `${matchId}|${team1} vs ${team2}|Winner: ${winner}|Score: ${score}`,
      });
    } catch (err) {
      setError(err.message || "Unable to store final result.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setResult(null);
    const verifyId = activeTab === "final" ? matchId : eventMatchId;
    if (!verifyId.trim()) {
      setError("Enter a match ID to verify.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetchStoredMatchHash(verifyId.trim());
      setResult({
        title: "Verification Result",
        message: response.hasStoredHash
          ? `Hash found for match ${verifyId.trim()}`
          : `No hash stored for match ${verifyId.trim()} yet.`,
        hash: response.storedHash,
      });
    } catch (err) {
      setError(err.message || "Unable to verify match hash.");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreEvent = async () => {
    setError(null);
    setResult(null);
    if (!eventMatchId.trim() || !eventType.trim() || !eventData.trim()) {
      setError("Enter match ID, event type, and event data to continue.");
      return;
    }
    setLoading(true);

    try {
      const response = await submitMatchEventHash(eventMatchId.trim(), eventType.trim(), eventData.trim());
      setResult({
        title: "Hash Stored",
        message: response.blockchainStored
          ? `Event hash stored on chain with tx ${response.txHash?.slice(0, 20)}...`
          : "The hash was generated locally. Configure blockchain settings to store on chain.",
        hash: response.eventHash,
      });
    } catch (err) {
      setError(err.message || "Unable to store event hash.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "calc(100vh - 120px)",
        background: "linear-gradient(180deg, #f7fbff 0%, #eef6ff 45%, #dbe9ff 100%)",
        color: "#102a43",
        padding: "120px 24px 64px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <p
              style={{
                color: "#2563eb",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Blockchain verification
            </p>
            <h1 style={{ fontSize: 48, lineHeight: 1.05, margin: 0, maxWidth: 760, color: "#102a43" }}>
              Verify match data with an on-chain hash.
            </h1>
            <p style={{ maxWidth: 720, fontSize: 16, color: "rgba(16, 42, 67, 0.8)", marginTop: 18, lineHeight: 1.8 }}>
              Store critical match events as tamper-proof hashes on Ethereum or Polygon, then let fans independently verify the score feed.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 24 }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 22px",
                  background: "#2563eb",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Back to Home
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "start" }}>
            <section style={{ background: "#ffffff", border: "1px solid rgba(37, 99, 235, 0.15)", borderRadius: 24, padding: 28, boxShadow: "0 16px 32px rgba(15, 23, 42, 0.06)" }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button
                  onClick={() => setActiveTab("final")}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: activeTab === "final" ? "#2563eb" : "#f1f5f9",
                    color: activeTab === "final" ? "white" : "#64748b",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Final Result
                </button>
                <button
                  onClick={() => setActiveTab("event")}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: activeTab === "event" ? "#2563eb" : "#f1f5f9",
                    color: activeTab === "event" ? "white" : "#64748b",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Event Hash
                </button>
              </div>

              {activeTab === "final" ? (
                <>
                  <p style={{ margin: 0, fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: "#2563eb", fontWeight: 700 }}>
                    Store Match Outcome
                  </p>
                  <h2 style={{ margin: "16px 0 12px", fontSize: 26, color: "#102a43" }}>
                    Lock the final result on-chain.
                  </h2>
                  <p style={{ margin: 0, color: "rgba(16, 42, 67, 0.8)", lineHeight: 1.75 }}>
                    Once a match ends, store its final result permanently. Anyone can later verify if the official record was tampered with.
                  </p>

                  <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label style={{ display: "block", fontSize: 14, color: "#102a43", fontWeight: 700 }}>
                        Match ID
                        <input
                          value={matchId}
                          onChange={(e) => setMatchId(e.target.value)}
                          placeholder="e.g. 142131"
                          style={{ width: "100%", borderRadius: 16, border: "1px solid #cbd5e1", padding: "12px 14px", marginTop: 6, fontSize: 14 }}
                        />
                      </label>
                      <label style={{ display: "block", fontSize: 14, color: "#102a43", fontWeight: 700 }}>
                        Winner
                        <input
                          value={winner}
                          onChange={(e) => setWinner(e.target.value)}
                          placeholder="e.g. IND"
                          style={{ width: "100%", borderRadius: 16, border: "1px solid #cbd5e1", padding: "12px 14px", marginTop: 6, fontSize: 14 }}
                        />
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label style={{ display: "block", fontSize: 14, color: "#102a43", fontWeight: 700 }}>
                        Team 1
                        <input
                          value={team1}
                          onChange={(e) => setTeam1(e.target.value)}
                          placeholder="e.g. IND"
                          style={{ width: "100%", borderRadius: 16, border: "1px solid #cbd5e1", padding: "12px 14px", marginTop: 6, fontSize: 14 }}
                        />
                      </label>
                      <label style={{ display: "block", fontSize: 14, color: "#102a43", fontWeight: 700 }}>
                        Team 2
                        <input
                          value={team2}
                          onChange={(e) => setTeam2(e.target.value)}
                          placeholder="e.g. AUS"
                          style={{ width: "100%", borderRadius: 16, border: "1px solid #cbd5e1", padding: "12px 14px", marginTop: 6, fontSize: 14 }}
                        />
                      </label>
                    </div>

                    <label style={{ display: "block", fontSize: 14, color: "#102a43", fontWeight: 700 }}>
                      Final Score
                      <input
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="e.g. 180/5 (20 overs)"
                        style={{ width: "100%", borderRadius: 16, border: "1px solid #cbd5e1", padding: "12px 14px", marginTop: 6, fontSize: 14 }}
                      />
                    </label>

                    <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, marginTop: 8 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                        Will be hashed as: <code style={{ color: "#2563eb" }}>{matchId || "{id}"}|{team1 || "{team1}"} vs {team2 || "{team2}"}|Winner: {winner || "{winner}"}|Score: {score || "{score}"}</code>
                      </p>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                      <button
                        onClick={handleStoreFinal}
                        disabled={loading}
                        style={{ border: "none", borderRadius: 14, padding: "14px 24px", background: "#2563eb", color: "white", fontWeight: 700, cursor: "pointer" }}
                      >
                        Store Final Result
                      </button>
                      <button
                        onClick={handleVerify}
                        disabled={loading}
                        style={{ border: "1px solid #2563eb", borderRadius: 14, padding: "14px 24px", background: "white", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}
                      >
                        Verify Match ID
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: "#2563eb", fontWeight: 700 }}>
                    Live match integrity
                  </p>
                  <h2 style={{ margin: "16px 0 12px", fontSize: 26, color: "#102a43" }}>
                    Hash key events and let anyone verify the feed.
                  </h2>
                  <p style={{ margin: 0, color: "rgba(16, 42, 67, 0.8)", lineHeight: 1.75 }}>
                    Use RapidAPI match data, create a deterministic event hash, and publish the resulting digest to a smart contract.
                  </p>

                  <div style={{ marginTop: 24, display: "grid", gap: 18 }}>
                    <label style={{ display: "block", fontSize: 14, color: "#102a43", fontWeight: 700 }}>
                      Match ID
                      <input
                        value={eventMatchId}
                        onChange={(e) => setEventMatchId(e.target.value)}
                        placeholder="e.g. 1234567"
                        style={{ width: "100%", borderRadius: 16, border: "1px solid #cbd5e1", padding: "14px 16px", marginTop: 8, fontSize: 14 }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: 14, color: "#102a43", fontWeight: 700 }}>
                      Event type
                      <input
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        placeholder="e.g. wicket, runs, milestone"
                        style={{ width: "100%", borderRadius: 16, border: "1px solid #cbd5e1", padding: "14px 16px", marginTop: 8, fontSize: 14 }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: 14, color: "#102a43", fontWeight: 700 }}>
                      Event payload
                      <textarea
                        value={eventData}
                        onChange={(e) => setEventData(e.target.value)}
                        rows={6}
                        placeholder="Runs: 24, Wicket: false, Ball: 12.3"
                        style={{ width: "100%", borderRadius: 16, border: "1px solid #cbd5e1", padding: "14px 16px", marginTop: 8, fontSize: 14, resize: "vertical" }}
                      />
                    </label>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                      <button
                        onClick={handleStoreEvent}
                        disabled={loading}
                        style={{ border: "none", borderRadius: 14, padding: "14px 24px", background: "#2563eb", color: "white", fontWeight: 700, cursor: "pointer" }}
                      >
                        Store hash
                      </button>
                      <button
                        onClick={handleVerify}
                        disabled={loading}
                        style={{ border: "1px solid #2563eb", borderRadius: 14, padding: "14px 24px", background: "white", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}
                      >
                        Verify match ID
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div style={{ color: "#b91c1c", fontWeight: 600, marginTop: 16 }}>{error}</div>
              )}

              {result && (
                <div style={{ background: "#f8fafc", borderRadius: 18, padding: 18, border: "1px solid rgba(37, 99, 235, 0.12)", marginTop: 16 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#102a43" }}>{result.title}</p>
                  <p style={{ margin: "12px 0 0", fontSize: 14, color: "rgba(16, 42, 67, 0.85)", whiteSpace: "pre-line" }}>{result.message}</p>
                  {result.fullResult && (
                    <p style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                      Result: <code>{result.fullResult}</code>
                    </p>
                  )}
                  {result.hash && result.hash !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
                    <p style={{ marginTop: 10, wordBreak: "break-all", fontSize: 13, color: "#475569" }}>Hash: {result.hash}</p>
                  )}
                </div>
              )}
            </section>

            <section style={{ background: "#ffffff", border: "1px solid rgba(37, 99, 235, 0.15)", borderRadius: 24, padding: 28, boxShadow: "0 16px 32px rgba(15, 23, 42, 0.06)" }}>
              <p style={{ margin: 0, color: "#2563eb", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700 }}>
                Why it matters
              </p>
              <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
                {[
                  {
                    title: "Final Result Verification",
                    description: "Store match ID, teams, winner and final score. Anyone can later verify if the official record was tampered with.",
                  },
                  {
                    title: "Simple & Transparent",
                    description: `Format: "142131|IND vs AUS|Winner: IND|Score: 180/5". Human-readable, yet cryptographically sealed.`,
                  },
                  {
                    title: "Anti-tamper guarantee",
                    description: "Once stored on-chain, the hash cannot be altered. Any data manipulation becomes immediately detectable.",
                  },
                ].map((card) => (
                  <div key={card.title} style={{ padding: 18, borderRadius: 18, background: "#f8fafc", border: "1px solid rgba(37, 99, 235, 0.08)" }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#102a43" }}>{card.title}</p>
                    <p style={{ margin: "8px 0 0", color: "rgba(16, 42, 67, 0.78)", fontSize: 14, lineHeight: 1.7 }}>{card.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
