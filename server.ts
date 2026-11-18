import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase, db, runDataRetentionCleanup } from './server/db.js';
import { seedQuestionsDatabase } from './server/seedQuestions.js';
import { setupWebSocketServer } from './server/socketServer.js';
import { getRoomSnapshot } from './server/lobbyManager.js';
import { getRevealCards, getRoomChatMessages } from './server/gameEngine.js';

dotenv.config();

// 1. Initialize Database & Seed Questions
initDatabase();
seedQuestionsDatabase();

// Run daily cleanup for inactive rooms (> 30 days)
const retentionDays = process.env.DATA_RETENTION_DAYS ? parseInt(process.env.DATA_RETENTION_DAYS, 10) : 30;
runDataRetentionCleanup(retentionDays);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

// 2. REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(), 
    version: '2.0.0',
    platform: 'Tanış Ol'
  });
});

app.get('/api/room/:code', (req, res) => {
  const code = (req.params.code || '').trim().toUpperCase();
  const room = db.prepare('SELECT id, room_code, status FROM rooms WHERE room_code = ?').get(code) as any;
  if (!room) {
    return res.status(404).json({ error: 'Otaq tapılmadı' });
  }

  const snapshot = getRoomSnapshot(room.id);
  res.json({
    roomCode: snapshot.roomCode,
    roomStatus: snapshot.roomStatus,
    gameStatus: snapshot.gameStatus,
    participantCount: snapshot.participants.length,
    settings: snapshot.settings
  });
});

// Room History (PRD Section 11: previous games history)
app.get('/api/room/:code/history', (req, res) => {
  const code = (req.params.code || '').trim().toUpperCase();
  const room = db.prepare('SELECT id FROM rooms WHERE room_code = ?').get(code) as any;
  if (!room) {
    return res.status(404).json({ error: 'Otaq tapılmadı' });
  }

  const pastGames = db.prepare(`
    SELECT id, category, question_count, time_per_question, reveal_mode, status, created_at, completed_at
    FROM games
    WHERE room_id = ? AND status = 'completed'
    ORDER BY created_at DESC
  `).all(room.id) as any[];

  const history = pastGames.map(game => ({
    gameId: game.id,
    category: game.category,
    questionCount: game.question_count,
    timePerQuestion: game.time_per_question,
    createdAt: game.created_at,
    completedAt: game.completed_at,
    cards: getRevealCards(room.id, game.id)
  }));

  res.json({ history });
});

// Setup WebSocket Server
setupWebSocketServer(server);

// Vite middleware in dev or static serving in prod
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🍷 Tanış Ol v2.0 server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic();
