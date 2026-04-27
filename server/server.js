import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import olympicsRouter from './src/routes/olympics.js';
import authRouter from './src/routes/auth.js';
import { initSocket } from './src/socket/index.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '15mb' })); // generous limit for base64 images

// Routes
app.use('/api/olympics', olympicsRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Socket.IO
initSocket(io);

// Connect to MongoDB then start server
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/party-olympiade';
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
