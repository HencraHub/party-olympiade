import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const JWT_EXPIRES = '7d';

function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Invalid email address' });

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (exists) {
      const field = exists.email === email.toLowerCase() ? 'email' : 'username';
      return res.status(409).json({ error: `That ${field} is already taken` });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user);

    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email, avatarColor: user.avatarColor ?? 0 } });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, avatarColor: user.avatarColor ?? 0 } });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — verify token and return user
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: { id: user._id, username: user.username, email: user.email, avatarColor: user.avatarColor ?? 0 } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// PATCH /api/auth/profile — update username and/or avatarColor
router.patch('/profile', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { username, avatarColor } = req.body;

    if (username !== undefined) {
      const trimmed = String(username).trim().slice(0, 30);
      if (trimmed.length < 2) return res.status(400).json({ error: 'Username must be at least 2 characters' });
      const taken = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
      if (taken) return res.status(409).json({ error: 'Username already taken' });
      user.username = trimmed;
    }
    if (avatarColor !== undefined) {
      const c = Number(avatarColor);
      if (!Number.isInteger(c) || c < 0 || c > 7) return res.status(400).json({ error: 'Invalid avatarColor' });
      user.avatarColor = c;
    }

    await user.save();
    res.json({ user: { id: user._id, username: user.username, email: user.email, avatarColor: user.avatarColor } });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    res.status(500).json({ error: 'Profile update failed' });
  }
});

export default router;
