import axios from 'axios';

const BASE = 'https://cricbuzz-cricket.p.rapidapi.com';
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || '';

const api = axios.create({
  baseURL: BASE,
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY || '8191a8fa93msh91f60787aca1a0bp1313afjsn6d8fe8a1432f',
    'x-rapidapi-host': RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com',
  },
  timeout: 20000,
});

/**
 * Wrapper around api.get that always resolves (never throws on HTTP errors).
 * Returns { data, rawResponse } in the shape every caller expects.
 */
async function safeGet(path, config = {}) {
  try {
    const response = await api.get(path, config);
    return { data: response.data, rawResponse: response };
  } catch (err) {
    const status = err?.response?.status;
    const message = err?.response?.data?.message || err?.message || 'Request failed';
    console.error(`[cricApi] safeGet(${path}) failed — ${status ?? 'network'}: ${message}`);
    throw err;
  }
}

/* ─── Matches ────────────────────────────────────────────────────────────── */
export async function getLiveMatches() {
  const { data, rawResponse } = await safeGet('/matches/v1/live');
  return { data, rawResponse };
}
export async function getUpcomingMatches() {
  const { data, rawResponse } = await safeGet('/matches/v1/upcoming');
  return { data, rawResponse };
}
export async function getRecentMatches() {
  const { data, rawResponse } = await safeGet('/matches/v1/recent');
  return { data, rawResponse };
}

/* ─── Match center / scorecards ──────────────────────────────────────────── */
export async function getMatchCenter(matchId) {
  if (!matchId) throw new Error('matchId required');
  const { data, rawResponse } = await safeGet(`/mcenter/v1/${matchId}`);
  return { data, rawResponse };
}
export async function getScard(matchId) {
  if (!matchId) throw new Error('matchId required');
  const { data, rawResponse } = await safeGet(`/mcenter/v1/${matchId}/scard`);
  return { data, rawResponse };
}
export async function getHscard(matchId) {
  if (!matchId) throw new Error('matchId required');
  const { data, rawResponse } = await safeGet(`/mcenter/v1/${matchId}/hscard`);
  return { data, rawResponse };
}
export async function getTeamForMatch(matchId, teamId) {
  if (!matchId || !teamId) throw new Error('matchId and teamId required');
  const { data, rawResponse } = await safeGet(`/mcenter/v1/${matchId}/team/${teamId}`);
  return { data, rawResponse };
}

/* ─── Photos ─────────────────────────────────────────────────────────────── */
export async function getPhotosList() {
  const { data, rawResponse } = await safeGet('/photos/list');
  return { data, rawResponse };
}

export async function getPhotoGallery(params = {}) {
  const { data, rawResponse } = await safeGet('/photos/get-gallery', { params });
  return { data, rawResponse };
}

export async function getPlayerImage(imageId) {
  if (!imageId) throw new Error('imageId required');
  const { data, rawResponse } = await safeGet(`/get-image`, { params: { id: imageId } });
  return { data, rawResponse };
}

/* ─── Schedules ──────────────────────────────────────────────────────────── */
export async function getSchedulesList() {
  const { data, rawResponse } = await safeGet('/schedules/v1/list');
  return { data, rawResponse };
}

/* ─── Series ─────────────────────────────────────────────────────────────── */
export async function getSeriesList() {
  const { data, rawResponse } = await safeGet('/series/v1/list');
  return { data, rawResponse };
}
export async function getSeriesListArchives(params = {}) {
  // params: { type, year } — e.g. { type: 'international', year: 2024 }
  const { data, rawResponse } = await safeGet('/series/v1/list-archives', { params });
  return { data, rawResponse };
}
export async function getSeriesMatches(seriesId) {
  if (!seriesId) throw new Error('seriesId required');
  const { data, rawResponse } = await safeGet(`/series/v1/${seriesId}/matches`);
  return { data, rawResponse };
}

export async function getSeriesNews(seriesId) {
  if (!seriesId) throw new Error('seriesId required');
  const { data, rawResponse } = await safeGet(`/series/v1/${seriesId}/news`);
  return { data, rawResponse };
}
export async function getSeriesPlayers(seriesId) {
  if (!seriesId) throw new Error('seriesId required');
  const { data, rawResponse } = await safeGet(`/series/v1/${seriesId}/players`);
  return { data, rawResponse };
}
export async function getSeriesVenues(seriesId) {
  if (!seriesId) throw new Error('seriesId required');
  const { data, rawResponse } = await safeGet(`/series/v1/${seriesId}/venues`);
  return { data, rawResponse };
}
export async function getSeriesPointsTable(seriesId) {
  if (!seriesId) throw new Error('seriesId required');
  const { data, rawResponse } = await safeGet(`/stats/v1/series/${seriesId}/points-table`);
  return { data, rawResponse };
}
export async function getSeriesStatsFilters(seriesId) {
  if (!seriesId) throw new Error('seriesId required');
  const { data, rawResponse } = await safeGet(`/stats/v1/series/${seriesId}/stats-filters`);
  return { data, rawResponse };
}
export async function getSeriesStats(seriesId, params = {}) {
  if (!seriesId) throw new Error('seriesId required');
  const { data, rawResponse } = await safeGet(`/series/v1/${seriesId}/stats`, { params });
  return { data, rawResponse };
}

/* ─── Teams ──────────────────────────────────────────────────────────────── */
export async function getTeamsList(params = {}) {
  // params: { type } — e.g. { type: 'international' | 'domestic' | 'league' | 'women' }
  const { data, rawResponse } = await safeGet('/teams/v1/list', { params });
  return { data, rawResponse };
}
export async function getInternationalTeams() {
  return getTeamsList({ type: 'international' });
}
export async function getTeamSchedules(teamId) {
  if (!teamId) throw new Error('teamId required');
  const { data, rawResponse } = await safeGet(`/teams/v1/${teamId}/schedules`);
  return { data, rawResponse };
}
export async function getTeamResults(teamId) {
  if (!teamId) throw new Error('teamId required');
  const { data, rawResponse } = await safeGet(`/teams/v1/${teamId}/results`);
  return { data, rawResponse };
}
export async function getTeamNews(teamId) {
  if (!teamId) throw new Error('teamId required');
  const { data, rawResponse } = await safeGet(`/teams/v1/${teamId}/news`);
  return { data, rawResponse };
}
export async function getTeamPlayers(teamId) {
  if (!teamId) throw new Error('teamId required');
  const { data, rawResponse } = await safeGet(`/teams/v1/${teamId}/players`);
  return { data, rawResponse };
}
export async function getTeamStatsFilters(teamId) {
  if (!teamId) throw new Error('teamId required');
  const { data, rawResponse } = await safeGet(`/teams/v1/${teamId}/stats-filters`);
  return { data, rawResponse };
}
export async function getTeamStats(teamId, params = {}) {
  if (!teamId) throw new Error('teamId required');
  const { data, rawResponse } = await safeGet(`/teams/v1/${teamId}/stats`, { params });
  return { data, rawResponse };
}

/* ─── Venues ─────────────────────────────────────────────────────────────── */
export async function getVenuesList() {
  const { data, rawResponse } = await safeGet('/venues/v1/list');
  return { data, rawResponse };
}

/* ─── Players ────────────────────────────────────────────────────────────── */
export async function getPlayersTrending() {
  const { data, rawResponse } = await safeGet('/players/v1/list-trending');
  return { data, rawResponse };
}
export async function getPlayerCareer(playerId) {
  if (!playerId) throw new Error('playerId required');
  const { data, rawResponse } = await safeGet(`/players/v1/${playerId}/career`);
  return { data, rawResponse };
}
export async function getPlayerNews(playerId) {
  if (!playerId) throw new Error('playerId required');
  const { data, rawResponse } = await safeGet(`/players/v1/${playerId}/news`);
  return { data, rawResponse };
}
export async function getPlayerBowling(playerId) {
  if (!playerId) throw new Error('playerId required');
  const { data, rawResponse } = await safeGet(`/players/v1/${playerId}/bowling`);
  return { data, rawResponse };
}
export async function getPlayerBatting(playerId) {
  if (!playerId) throw new Error('playerId required');
  const { data, rawResponse } = await safeGet(`/players/v1/${playerId}/batting`);
  return { data, rawResponse };
}
export async function getPlayerInfo(playerId) {
  if (!playerId) throw new Error('playerId required');
  const { data, rawResponse } = await safeGet(`/players/v1/${playerId}/info`);
  return { data, rawResponse };
}
export async function searchPlayers(params = {}) {
  // params: { plrN } — player name search query
  const { data, rawResponse } = await safeGet('/players/v1/search', { params });
  return { data, rawResponse };
}

/* ─── News ───────────────────────────────────────────────────────────────── */
// AFTER
export async function getNewsList() {
  const { data, rawResponse } = await safeGet('/news/v1/index');
  return { data, rawResponse };
}


export async function getNewsDetail(newsId) {
  const { data, rawResponse } = await safeGet(`/news/${newsId}/detail`);
  return { data, rawResponse };
}


export async function getNewsListByCategory(params = {}) {
  const { data, rawResponse } = await safeGet('/news/list-by-category', { params });
  return { data, rawResponse };
    }

export async function getNewsTopics() {
  const { data, rawResponse } = await safeGet('/news/get-topics');
  return { data, rawResponse };
}

export async function getNewsListByTopic(params = {}) {
  const { data, rawResponse } = await safeGet('/news/list-by-topic', { params });
  return { data, rawResponse };
}

/* ─── Default export ─────────────────────────────────────────────────────── */
export default {
  // Matches
  getLiveMatches,
  getUpcomingMatches,
  getRecentMatches,
  // Match center
  getMatchCenter,
  getScard,
  getHscard,
  getTeamForMatch,
  // Schedules
  getSchedulesList,

  // Photos
getPhotosList,
getPhotoGallery,
getPlayerImage,

  // Series
  
  getSeriesList,
  getSeriesListArchives,
  getSeriesMatches,
  getSeriesNews,
  getSeriesPlayers,
  getSeriesVenues,
  getSeriesPointsTable,
  getSeriesStatsFilters,
  getSeriesStats,
  // Teams
  getTeamsList,
  getInternationalTeams,
  getTeamSchedules,
  getTeamResults,
  getTeamNews,
  getTeamPlayers,
  getTeamStatsFilters,
  getTeamStats,
  // Venues
  getVenuesList,
  // Players
  getPlayersTrending,
  getPlayerCareer,
  getPlayerNews,
  getPlayerBowling,
  getPlayerBatting,
  getPlayerInfo,
  searchPlayers,
  // News
  getNewsList,
  getNewsDetail,

  getNewsListByCategory,
  getNewsTopics,
  getNewsListByTopic,
};