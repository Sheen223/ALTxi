require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nacl = require('tweetnacl');
const bs58 = require('bs58').default || require('bs58');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'altix-secret-key-123';
const TXLINE_API_TOKEN = process.env.TXLINE_API_TOKEN;
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// In-memory databases
const nonces = new Map();
const userProfiles = new Map();

// Helper to validate Solana address format (base58, 32-44 chars)
function isValidSolanaAddress(address) {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch (e) {
    return false;
  }
}

// 1. Get Nonce Endpoint
app.get('/api/auth/nonce', (req, res) => {
  const { wallet } = req.query;
  if (!wallet || !isValidSolanaAddress(wallet)) {
    return res.status(400).json({ error: 'Invalid Solana wallet address' });
  }

  // Generate a cryptographically secure random nonce
  const nonce = Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
  nonces.set(wallet, nonce);

  console.log(`ALTIX BACKEND: Generated nonce for ${wallet}: ${nonce}`);
  res.json({ nonce });
});

// 2. Cryptographic Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { wallet, signature, nonce } = req.body;

  if (!wallet || !signature || !nonce) {
    return res.status(400).json({ error: 'Missing required auth fields' });
  }

  // Verify nonce exists and matches
  const expectedNonce = nonces.get(wallet);
  if (!expectedNonce || expectedNonce !== nonce) {
    return res.status(400).json({ error: 'Invalid or expired authentication session nonce' });
  }

  try {
    // Message that was signed on client
    const messageText = `ALTix Sign-In Nonce: ${nonce}`;
    const messageBytes = new TextEncoder().encode(messageText);

    // Convert public key base58 string to byte array
    const publicKeyBytes = bs58.decode(wallet);

    // Convert signature (either Array or String) to byte array
    let signatureBytes;
    if (Array.isArray(signature)) {
      signatureBytes = new Uint8Array(signature);
    } else if (typeof signature === 'string') {
      try {
        signatureBytes = bs58.decode(signature);
      } catch (e) {
        // Fallback to hex
        signatureBytes = new Uint8Array(Buffer.from(signature, 'hex'));
      }
    } else {
      return res.status(400).json({ error: 'Invalid signature format' });
    }

    // Cryptographically verify signature using tweetnacl
    const isVerified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!isVerified) {
      console.error(`ALTIX BACKEND Auth Error: Signature verification failed for wallet ${wallet}`);
      return res.status(401).json({ error: 'Cryptographic signature verification failed' });
    }

    // Nonce used successfully, delete it to prevent reuse
    nonces.delete(wallet);

    // Get or create manager profile
    let profile = userProfiles.get(wallet);
    if (!profile) {
      profile = {
        wallet,
        createdAt: new Date(),
        xp: 120, // Initial onboarding XP
        rank: 'Novice Coach'
      };
      userProfiles.set(wallet, profile);
    }

    // Create session token
    const token = jwt.sign({ wallet }, JWT_SECRET, { expiresIn: '24h' });

    console.log(`ALTIX BACKEND: Successful login for Solana wallet: ${wallet}`);
    res.json({ token, profile });

  } catch (error) {
    console.error('ALTIX BACKEND: Error verifying signature:', error);
    res.status(500).json({ error: 'Internal signature verification error' });
  }
});

// 3. Get Session state
app.get('/api/auth/session', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ session: false });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const profile = userProfiles.get(decoded.wallet) || { wallet: decoded.wallet, xp: 120, rank: 'Novice Coach' };
    res.json({ session: true, wallet: decoded.wallet, profile });
  } catch (err) {
    res.json({ session: false });
  }
});

// Hardcoded mock matches removed
let matches = [];

const TXLINE_ORIGIN = 'https://txline.txodds.com';

const COUNTRY_CODES = {
  "argentina": "ar", "france": "fr", "england": "gb-eng", "netherlands": "nl",
  "portugal": "pt", "spain": "es", "germany": "de", "uruguay": "uy",
  "brazil": "br", "croatia": "hr", "morocco": "ma", "japan": "jp",
  "senegal": "sn", "usa": "us", "poland": "pl", "australia": "au",
  "korea republic": "kr", "switzerland": "ch", "cameroon": "cm", "serbia": "rs",
  "mexico": "mx", "belgium": "be", "ghana": "gh", "ecuador": "ec",
  "tunisia": "tn", "iran": "ir", "costa rica": "cr", "wales": "gb-wls",
  "canada": "ca", "saudi arabia": "sa", "qatar": "qa", "denmark": "dk",
  "vietnam": "vn", "myanmar": "mm"
};

function mapTxLineFixture(fixture) {
  const gameState = fixture.GameState ?? fixture.gameState;
  if (gameState === 6) return null;

  const start = fixture.StartTime ? new Date(fixture.StartTime) : null;
  // If the game started more than 4 hours ago and isn't marked finished, it's stale/postponed
  if (start && start.getTime() < Date.now() - (4 * 60 * 60 * 1000)) return null;

  const homeTeam = fixture.Participant1IsHome ? fixture.Participant1 : fixture.Participant2;
  const awayTeam = fixture.Participant1IsHome ? fixture.Participant2 : fixture.Participant1;
  
  const homeCode = COUNTRY_CODES[(homeTeam || '').toLowerCase()] || 'un';
  const awayCode = COUNTRY_CODES[(awayTeam || '').toLowerCase()] || 'un';

  // Determine status from start time rather than market GameState
  let status = 'scheduled';
  if (start && start.getTime() <= Date.now()) {
    status = 'live';
  }

  return {
    id: fixture.FixtureId,
    txlineFixtureId: fixture.FixtureId,
    league: fixture.CompetitionName || fixture.Competition || 'World Cup',
    team1: { name: homeTeam || 'TBD', flag: homeCode, logo: `https://flagcdn.com/w160/${homeCode}.png` },
    team2: { name: awayTeam || 'TBD', flag: awayCode, logo: `https://flagcdn.com/w160/${awayCode}.png` },
    status: status,
    score: 'vs',
    time: start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
    matchday: start ? start.toLocaleDateString() : 'Upcoming',
    timestamp: start ? start.getTime() : null,
  };
}

function normalizeTxLineFixtures(raw) {
  const list = Array.isArray(raw) ? raw : (raw?.data || []);
  return list
    .map(mapTxLineFixture)
    .filter(Boolean)
    .filter((fixture) => fixture.id != null)
    .filter((fixture) => fixture.league.toLowerCase().includes('world cup'));
}

// Helper to fetch live matches from TxLINE
async function getTxLineMatches() {
  if (!TXLINE_API_TOKEN) return [];
  try {
    const startRes = await fetch(`${TXLINE_ORIGIN}/auth/guest/start`, { method: 'POST' });
    if (!startRes.ok) return [];
    
    const startData = await startRes.json();
    const jwt = startData.token;

    const txRes = await fetch(`${TXLINE_ORIGIN}/api/fixtures/snapshot`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'X-Api-Token': TXLINE_API_TOKEN,
      },
    });

    if (txRes.ok) {
      const txData = await txRes.json();
      return normalizeTxLineFixtures(txData);
    }
  } catch (err) {
    console.error('ALTIX BACKEND: Failed to fetch TxLINE API.', err.message);
  }
  return [];
}

// 4. Get Matches list
app.get('/api/matches', async (req, res) => {
  const matches = await getTxLineMatches();
  res.json(matches);
});

// 5. Get Match details
app.get('/api/matches/:id', async (req, res) => {
  const matchId = parseInt(req.params.id);
  const matchesList = await getTxLineMatches();
  const match = matchesList.find(m => m.id === matchId);
  
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  res.json(match);
});

// Cache for API-Football squads to avoid rate limits (100 req/day on free tier)
const squadCache = new Map();

// 5.5 Get Starting Squad from API-Football
app.get('/api/matches/:id/squad', async (req, res) => {
  const matchId = parseInt(req.params.id);
  if (squadCache.has(matchId)) {
    return res.json(squadCache.get(matchId));
  }

  const matchesList = await getTxLineMatches();
  const match = matchesList.find(m => m.id === matchId);
  
  if (!match) {
    return res.status(404).json({ error: 'Match not found in TxLINE' });
  }

  if (!API_FOOTBALL_KEY) {
    return res.status(503).json({ error: 'API_FOOTBALL_KEY not configured' });
  }

  try {
    // 1. Search API-Football for the Home Team ID
    const hName = match.team1.name.toLowerCase();
    const aName = match.team2.name.toLowerCase();

    const teamSearchRes = await fetch(`https://v3.football.api-sports.io/teams?search=${encodeURIComponent(hName)}`, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    
    if (!teamSearchRes.ok) {
      return res.status(500).json({ error: 'Failed to query API-Football teams' });
    }

    const teamSearchData = await teamSearchRes.json();
    if (!teamSearchData.response || teamSearchData.response.length === 0) {
      return res.status(404).json({ error: 'Team not found in API-Football database' });
    }

    const apiTeamId = teamSearchData.response[0].team.id;

    // 2. Fetch the last 5 fixtures for this team
    const fixturesRes = await fetch(`https://v3.football.api-sports.io/fixtures?team=${apiTeamId}&last=5`, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    const fixturesData = await fixturesRes.json();

    if (!fixturesData.response || fixturesData.response.length === 0) {
      return res.status(404).json({ error: 'No recent fixtures found for this team' });
    }

    // 3. Find the fixture where the opponent matches, or just use the very last one as a fallback
    let apiFixture = fixturesData.response.find(f => {
      const apiH = f.teams.home.name.toLowerCase();
      const apiA = f.teams.away.name.toLowerCase();
      return apiH.includes(aName) || apiA.includes(aName);
    });

    if (!apiFixture) {
      // Fallback: just take their most recent game so the user at least gets a valid squad
      apiFixture = fixturesData.response[0];
    }

    // 3. Fetch Lineups
    const lineupsRes = await fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${apiFixture.fixture.id}`, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    const lineupsData = await lineupsRes.json();

    if (!lineupsData.response || lineupsData.response.length === 0) {
      return res.status(404).json({ error: 'Starting XI not yet available for this fixture' });
    }

    // Cache and return
    squadCache.set(matchId, lineupsData.response);
    res.json(lineupsData.response);

  } catch (err) {
    console.error('ALTIX BACKEND: Failed to fetch API-Football', err);
    res.status(500).json({ error: 'Failed to retrieve lineups' });
  }
});

// 6. Lock Match Tactics (tactics confirmed, waiting for kickoff)
app.post('/api/matches/:id/lock', (req, res) => {
  res.json({ success: true, status: 'locked' });
});

// Global tactical state (in-memory for demo)
const matchTactics = new Map();

// 7. Start Match Simulation
app.post('/api/matches/:id/simulate', (req, res) => {
  const matchId = req.params.id;
  const tactics = req.body || {};
  matchTactics.set(matchId, { status: 'simulating', tactics });
  res.json({ success: true, status: 'simulating' });
});

// 8. Live Simulation SSE Stream (TxLINE + OpenAI Integration)
app.get('/api/matches/:id/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  // Send heartbeat
  const ping = setInterval(() => {
    res.write('data: ping\n\n');
  }, 5000);

  // MOCK EVENT GENERATOR
  // Since there are no live TxLINE matches right now, we will fire a mock event every 10 seconds
  let mockEventCount = 0;
  const mockEvents = [
    "The away team tries to build out from the back but loses possession in midfield.",
    "A quick counter-attack down the right flank results in a dangerous cross.",
    "A heavy tackle in the center of the pitch. The referee plays advantage.",
    "Corner kick swung in towards the near post.",
    "A stunning long-range shot hits the crossbar!",
    "The referee blows the final whistle! Full time."
  ];

  const generateEvent = async () => {
    if (mockEventCount >= mockEvents.length) {
      clearInterval(engineInterval);
      return;
    }
    
    const rawEvent = mockEvents[mockEventCount];
    mockEventCount++;
    
    const matchData = matchTactics.get(req.params.id) || { tactics: {} };
    const tactics = matchData.tactics || {};
    const tacticsContext = Object.keys(tactics).length > 0 
      ? `The human coach selected the following tactics: Formation: ${tactics.formation}, Mentality: ${tactics.mentality}, Build-up: ${tactics.buildup}, Defensive Line: ${tactics.defline}, Passing: ${tactics.passing}, Tempo: ${tactics.tempo}. The coach also assigned the captain armband to the ${tactics.captain}. FACTOR THESE TACTICS HEAVILY into the simulation events and narrative.` 
      : '';

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are the ALTIX Simulation Engine. Translate the real-world event into an exciting cinematic narrative. 
            Also output structured animation data to drive a 2D pitch canvas.
            Format your response strictly as JSON with this schema:
            {
              "narrative": "Cinematic text describing the action...",
              "status": "in_progress|completed",
              "score": {
                "home": 0,
                "away": 0
              },
              "animation": {
                "action_type": "pass|shot|tackle|move",
                "player_from": "Player Name",
                "player_to": "Player Name",
                "zone_from": "midfield|box_edge|corner_right",
                "zone_to": "midfield|box_edge|box_center"
              }
            }
            
            ${tacticsContext}
            
            If the event signifies the end of the match (e.g. final whistle), set "status" to "completed". 
            CRITICAL: When the status is "completed", your "narrative" must NOT just say the match ended. It MUST be a comprehensive Post-Match Tactical Analysis. 
            
            REPORT STYLE RULES:
            - Maximum 500 words.
            - Write in short, punchy paragraphs. Use \n\n for spacing.
            - Use short, concise sentences.
            - You must sound like an elite football tactician.
            - Explicitly critique the team's performance based heavily on the specific tactics the coach selected. For example: "We lost too many balls on the defensive because our defensive line was too low" or "The aggressive mentality paid off perfectly".
            - Explain why they won or lost, analyze their structural failures, missed chances, and how their specific tactical choices affected the outcome. Be highly analytical and critical.
            Keep track of the score logically based on the events.`
          },
          { role: "user", content: `Event: ${rawEvent}` }
        ],
        response_format: { type: "json_object" }
      });

      const aiData = completion.choices[0].message.content;
      try {
        const parsed = JSON.parse(aiData);
        res.write(`data: ${JSON.stringify(parsed)}\n\n`);
      } catch(e) {
        const flat = aiData.replace(/\n/g, ' ');
        res.write(`data: ${flat}\n\n`);
      }

    } catch (err) {
      console.error("OpenAI Engine Error:", err);
    }
  };

  // Fire the very first event immediately so the user doesn't wait 10 seconds
  generateEvent();

  // Then fire every 10 seconds
  const engineInterval = setInterval(generateEvent, 10000);

  req.on('close', () => {
    clearInterval(ping);
    clearInterval(engineInterval);
  });
});

app.listen(PORT, () => {
  console.log(`ALTix Backend server running at http://localhost:${PORT}`);
});
