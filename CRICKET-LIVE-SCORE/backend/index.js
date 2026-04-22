import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import axios from 'axios';

dotenv.config();

// Define __dirname first (needed for file paths)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── RapidAPI Configuration ───────────────────────────────────────────
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.VITE_RAPIDAPI_HOST || process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

const cricApi = axios.create({
  baseURL: 'https://cricbuzz-cricket.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
  },
  timeout: 20000,
});

// Track processed matches to avoid duplicates
const processedMatches = new Set();
const VERIFIED_MATCHES_FILE = path.join(__dirname, 'verified_matches.json');

// Load previously verified matches from disk
function loadVerifiedMatches() {
  try {
    if (fs.existsSync(VERIFIED_MATCHES_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERIFIED_MATCHES_FILE, 'utf8'));
      data.forEach(id => processedMatches.add(id));
      console.log(`[blockchain] Loaded ${processedMatches.size} previously verified matches`);
    }
  } catch (err) {
    console.error('[blockchain] Error loading verified matches:', err.message);
  }
}

// Save verified matches to disk
function saveVerifiedMatches() {
  try {
    fs.writeFileSync(VERIFIED_MATCHES_FILE, JSON.stringify([...processedMatches]), 'utf8');
  } catch (err) {
    console.error('[blockchain] Error saving verified matches:', err.message);
  }
}
const abiFile = path.join(__dirname, 'abi', 'MatchVerifier.json');
const contractABI = JSON.parse(fs.readFileSync(abiFile, 'utf8'));

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY || '';
const RPC_URL = process.env.RPC_URL || '';

const provider = RPC_URL ? new ethers.JsonRpcProvider(RPC_URL) : null;
const signer = provider && PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;
const contract = signer && CONTRACT_ADDRESS ? new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer) : null;
const isBlockchainReady = Boolean(provider && signer && contract);

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function buildEventHash(matchId, eventType, eventData) {
  const normalized = JSON.stringify({
    matchId: matchId.trim(),
    eventType: eventType.trim(),
    eventData: typeof eventData === 'string' ? eventData.trim() : JSON.parse(stableStringify(eventData)),
  });

  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    blockchainReady: isBlockchainReady,
    contractAddress: CONTRACT_ADDRESS || null,
  });
});

app.post('/api/hash-event', async (req, res) => {
  try {
    const { matchId, eventType, eventData } = req.body;
    if (!matchId || !eventType || eventData === undefined || eventData === null) {
      return res.status(400).json({ error: 'matchId, eventType, and eventData are required.' });
    }

    const eventHash = buildEventHash(matchId, eventType, eventData);
    let txHash = null;

    if (isBlockchainReady) {
      const matchKey = ethers.id(matchId);
      const tx = await contract.storeMatchEvent(matchKey, eventHash);
      const receipt = await tx.wait();
      txHash = receipt.transactionHash;
    }

    return res.json({
      matchId,
      eventType,
      eventHash,
      txHash,
      blockchainStored: Boolean(txHash),
      blockchainReady: isBlockchainReady,
    });
  } catch (error) {
    console.error('[backend] hash-event', error);
    return res.status(500).json({ error: error.message || 'Failed to hash event.' });
  }
});

app.get('/api/verify-event/:matchId', async (req, res) => {
  try {
    const matchId = req.params.matchId;
    if (!matchId) return res.status(400).json({ error: 'matchId is required.' });

    if (!isBlockchainReady) {
      return res.status(500).json({
        error: 'Blockchain integration is not configured. Set RPC_URL, BACKEND_PRIVATE_KEY, and CONTRACT_ADDRESS.',
      });
    }

    const matchKey = ethers.id(matchId);
    const storedHash = await contract.eventHash(matchKey);

    return res.json({
      matchId,
      storedHash,
      hasStoredHash: storedHash !== ethers.ZeroHash,
    });
  } catch (error) {
    console.error('[backend] verify-event', error);
    return res.status(500).json({ error: error.message || 'Failed to verify event.' });
  }
});

function buildFinalResultHash(matchId, team1, team2, winner, score) {
  const resultString = `${matchId}|${team1} vs ${team2}|Winner: ${winner}|Score: ${score}`;
  return ethers.keccak256(ethers.toUtf8Bytes(resultString));
}

// ─── Automatic Match Verification ─────────────────────────────────────

async function fetchRecentMatches() {
  try {
    const response = await cricApi.get('/matches/v1/recent');
    return response.data?.typeMatches || [];
  } catch (err) {
    console.error('[poll] Error fetching recent matches:', err.message);
    return [];
  }
}

function extractCompletedMatches(typeMatches) {
  const completed = [];
  
  for (const typeMatch of typeMatches) {
    const seriesMatches = typeMatch?.seriesMatches || [];
    
    for (const series of seriesMatches) {
      const matches = series?.seriesAdWrapper?.matches || [];
      
      for (const match of matches) {
        const matchInfo = match?.matchInfo;
        if (!matchInfo) continue;
        
        const status = matchInfo?.status?.toLowerCase() || '';
        const matchId = matchInfo?.matchId;
        
        // Check if match is completed (various status indicators)
        const isCompleted = status.includes('won') || 
                           status.includes('result') ||
                           status.includes('completed') ||
                           status.includes('draw') ||
                           status.includes('tie') ||
                           status.includes('no result') ||
                           matchInfo?.state === 'Complete';
        
        if (isCompleted && matchId && !processedMatches.has(String(matchId))) {
          const team1 = matchInfo?.team1?.teamSName || matchInfo?.team1?.teamName || 'Team1';
          const team2 = matchInfo?.team2?.teamSName || matchInfo?.team2?.teamName || 'Team2';
          
          // Determine winner
          let winner = 'Unknown';
          if (status.includes(matchInfo?.team1?.teamSName?.toLowerCase()) && status.includes('won')) {
            winner = team1;
          } else if (status.includes(matchInfo?.team2?.teamSName?.toLowerCase()) && status.includes('won')) {
            winner = team2;
          } else if (status.includes('tie') || status.includes('draw')) {
            winner = status.includes('tie') ? 'Tie' : 'Draw';
          }
          
          // Get score from matchScore if available
          const matchScore = match?.matchScore;
          let score = 'N/A';
          if (matchScore) {
            const t1Score = matchScore?.team1Score?.inngs1;
            const t2Score = matchScore?.team2Score?.inngs1;
            if (t1Score && t2Score) {
              score = `${t1Score.runs || 0}/${t1Score.wickets || 0} vs ${t2Score.runs || 0}/${t2Score.wickets || 0}`;
            }
          }
          
          completed.push({
            matchId: String(matchId),
            team1,
            team2,
            winner,
            score,
            status: matchInfo?.status,
          });
        }
      }
    }
  }
  
  return completed;
}

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function storeMatchOnBlockchain(matchData) {
  if (!isBlockchainReady) {
    console.log('[poll] Blockchain not ready, skipping storage for match:', matchData.matchId);
    return false;
  }
  
  try {
    const { matchId, team1, team2, winner, score } = matchData;
    const resultHash = buildFinalResultHash(matchId, team1, team2, winner, score);
    
    const matchKey = ethers.id(matchId);
    
    // Get fresh nonce each time
    const nonce = await signer.getNonce();
    const tx = await contract.storeMatchEvent(matchKey, resultHash, { nonce });
    const receipt = await tx.wait();
    
    const txHash = receipt?.transactionHash || 'unknown';
    console.log(`[poll] ✅ Match ${matchId} verified on-chain. Tx: ${txHash.slice(0, 20)}...`);
    
    // Mark as processed
    processedMatches.add(matchId);
    saveVerifiedMatches();
    
    return true;
  } catch (err) {
    // Check if already stored (event already exists)
    if (err.message?.includes('event already stored') || err.message?.includes('MatchVerifier: event already stored')) {
      console.log(`[poll] ⚠️ Match ${matchData.matchId} already stored on blockchain`);
      processedMatches.add(matchData.matchId);
      saveVerifiedMatches();
      return true;
    }
    console.error(`[poll] ❌ Failed to store match ${matchData.matchId}:`, err.message);
    return false;
  }
}

async function pollAndVerifyMatches() {
  console.log('[poll] Scanning for completed matches...');
  
  const typeMatches = await fetchRecentMatches();
  const completedMatches = extractCompletedMatches(typeMatches);
  
  if (completedMatches.length === 0) {
    console.log('[poll] No new completed matches found.');
    return;
  }
  
  console.log(`[poll] Found ${completedMatches.length} new completed match(es):`);
  
  // Process one at a time with delay to avoid nonce issues
  for (const match of completedMatches) {
    console.log(`  - ${match.matchId}: ${match.team1} vs ${match.team2} → Winner: ${match.winner}`);
    await storeMatchOnBlockchain(match);
    // Wait 3 seconds between transactions to avoid nonce conflicts
    await delay(3000);
  }
}

// Start polling every 60 seconds
function startPolling() {
  loadVerifiedMatches();
  
  // Run immediately on startup
  pollAndVerifyMatches();
  
  // Then every 60 seconds
  setInterval(pollAndVerifyMatches, 60000);
  
  console.log('[poll] Automatic match verification started (polling every 60s)');
}

// ─── Verified Matches List Endpoint ───────────────────────────────────

app.get('/api/verified-matches', (req, res) => {
  res.json({
    verifiedMatchIds: [...processedMatches],
    count: processedMatches.size,
    blockchainReady: isBlockchainReady,
  });
});

// ─── Check if specific match is verified ────────────────────────────────

app.get('/api/verified-matches/:matchId', (req, res) => {
  const { matchId } = req.params;
  const isVerified = processedMatches.has(matchId);
  
  res.json({
    matchId,
    isVerified,
    verifiedAt: isVerified ? 'Previously processed' : null,
  });
});

app.post('/api/final-result', async (req, res) => {
  try {
    const { matchId, team1, team2, winner, score } = req.body;
    if (!matchId || !team1 || !team2 || !winner || !score) {
      return res.status(400).json({ error: 'matchId, team1, team2, winner, and score are required.' });
    }

    const resultHash = buildFinalResultHash(matchId, team1, team2, winner, score);
    let txHash = null;

    if (isBlockchainReady) {
      const matchKey = ethers.id(matchId);
      const tx = await contract.storeMatchEvent(matchKey, resultHash);
      const receipt = await tx.wait();
      txHash = receipt.transactionHash;
    }

    return res.json({
      matchId,
      team1,
      team2,
      winner,
      score,
      resultHash,
      txHash,
      blockchainStored: Boolean(txHash),
      blockchainReady: isBlockchainReady,
    });
  } catch (error) {
    console.error('[backend] final-result', error);
    return res.status(500).json({ error: error.message || 'Failed to store final result.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Blockchain ready: ${isBlockchainReady}`);
  
  // Start automatic match verification polling
  startPolling();
});
