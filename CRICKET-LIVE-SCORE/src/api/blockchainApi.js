const API_BASE = '/api';

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }
  return data;
}

export async function submitMatchEventHash(matchId, eventType, eventData) {
  return request(`${API_BASE}/hash-event`, {
    method: 'POST',
    body: { matchId, eventType, eventData },
  });
}

export async function fetchStoredMatchHash(matchId) {
  return request(`${API_BASE}/verify-event/${encodeURIComponent(matchId)}`);
}

export async function submitFinalResult(matchId, team1, team2, winner, score) {
  return request(`${API_BASE}/final-result`, {
    method: 'POST',
    body: { matchId, team1, team2, winner, score },
  });
}

export async function getVerifiedMatches() {
  return request(`${API_BASE}/verified-matches`);
}

export async function isMatchVerified(matchId) {
  return request(`${API_BASE}/verified-matches/${encodeURIComponent(matchId)}`);
}
