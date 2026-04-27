import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Olympic from '../models/Olympic.js';
import { computeLeaderboard } from '../utils/scoring.js';

const router = express.Router();

/** Generate a unique 4-char room code */
async function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let exists = true;
  while (exists) {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    exists = await Olympic.exists({ code });
  }
  return code;
}

/** Middleware: verify host token */
function requireHostToken(req, res, next) {
  const token = req.headers['x-host-token'];
  if (!token) return res.status(401).json({ error: 'Host token required' });
  req.hostToken = token;
  next();
}

// POST /api/olympics — Create a new Olympic
router.post('/', async (req, res) => {
  try {
    const { name, tieRule, extraRules, games, maxPlayers } = req.body;
    if (!name) return res.status(400).json({ error: 'Olympic name is required' });

    const code = await generateCode();
    const hostToken = uuidv4();

    const olympic = await Olympic.create({
      code,
      name,
      hostToken,
      tieRule: tieRule || 'tiebreaker',
      extraRules: extraRules || {},
      maxPlayers: maxPlayers || 20,
      participants: [],
      games: games || [],
      results: [],
      status: 'lobby',
      currentGameIndex: 0,
    });

    // Never return hostToken in general responses; only on creation
    res.status(201).json({ code: olympic.code, hostToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Olympic' });
  }
});

// GET /api/olympics/:code — Get Olympic state (no hostToken in response)
router.get('/:code', async (req, res) => {
  try {
    const olympic = await Olympic.findOne({ code: req.params.code.toUpperCase() }).lean();
    if (!olympic) return res.status(404).json({ error: 'Olympic not found' });

    const { hostToken: _ht, ...safeOlympic } = olympic;
    res.json(safeOlympic);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/olympics/:code/leaderboard — Computed leaderboard
router.get('/:code/leaderboard', async (req, res) => {
  try {
    const olympic = await Olympic.findOne({ code: req.params.code.toUpperCase() }).lean();
    if (!olympic) return res.status(404).json({ error: 'Olympic not found' });

    res.json(computeLeaderboard(olympic));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/olympics/:code/navigate — Move currentGameIndex
router.patch('/:code/navigate', requireHostToken, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({ code: req.params.code.toUpperCase() });
    if (!olympic) return res.status(404).json({ error: 'Olympic not found' });
    if (olympic.hostToken !== req.hostToken) return res.status(403).json({ error: 'Invalid host token' });

    const { direction } = req.body; // 'next' | 'prev'
    const maxIndex = olympic.games.length - 1;
    if (direction === 'next' && olympic.currentGameIndex < maxIndex) olympic.currentGameIndex += 1;
    else if (direction === 'prev' && olympic.currentGameIndex > 0) olympic.currentGameIndex -= 1;

    await olympic.save();
    const { hostToken: _ht, ...safe } = olympic.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/olympics/:code/status — Update status
router.patch('/:code/status', requireHostToken, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({ code: req.params.code.toUpperCase() });
    if (!olympic) return res.status(404).json({ error: 'Olympic not found' });
    if (olympic.hostToken !== req.hostToken) return res.status(403).json({ error: 'Invalid host token' });

    const { status } = req.body;
    if (!['setup', 'active', 'finished'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    olympic.status = status;
    await olympic.save();
    const { hostToken: _ht, ...safe } = olympic.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/olympics/:code/results — Submit / upsert game result
router.post('/:code/results', requireHostToken, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({ code: req.params.code.toUpperCase() });
    if (!olympic) return res.status(404).json({ error: 'Olympic not found' });
    if (olympic.hostToken !== req.hostToken) return res.status(403).json({ error: 'Invalid host token' });

    const { gameId, placements, teams } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });

    const existingIdx = olympic.results.findIndex((r) => String(r.gameId) === String(gameId));
    const resultData = { gameId, placements: placements || [], teams: teams || [] };

    if (existingIdx >= 0) olympic.results[existingIdx] = resultData;
    else olympic.results.push(resultData);

    await olympic.save();
    const { hostToken: _ht, ...safe } = olympic.toObject();
    const leaderboard = computeLeaderboard(safe);
    res.json({ olympic: safe, leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/olympics/:code/results/:gameId — Remove a game result
router.delete('/:code/results/:gameId', requireHostToken, async (req, res) => {
  try {
    const olympic = await Olympic.findOne({ code: req.params.code.toUpperCase() });
    if (!olympic) return res.status(404).json({ error: 'Olympic not found' });
    if (olympic.hostToken !== req.hostToken) return res.status(403).json({ error: 'Invalid host token' });

    olympic.results = olympic.results.filter((r) => String(r.gameId) !== req.params.gameId);
    await olympic.save();
    const { hostToken: _ht, ...safe } = olympic.toObject();
    res.json({ olympic: safe, leaderboard: computeLeaderboard(safe) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
