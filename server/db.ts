import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Path for SQLite file
const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), 'tanisol.db');

export const db = new DatabaseSync(DB_PATH);

// Configure SQLite for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

// Initialize Database Schema strictly adhering to PRD Section 12
export function initDatabase() {
  db.exec(`
    -- Rooms table
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      room_code TEXT UNIQUE NOT NULL,
      host_id TEXT,
      guest_id TEXT,
      status TEXT NOT NULL DEFAULT 'waiting_for_guest',
      created_at INTEGER NOT NULL,
      last_activity_at INTEGER NOT NULL
    );

    -- Participants table
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      session_token_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- 'host' | 'guest'
      last_seen_at INTEGER NOT NULL,
      connection_status TEXT NOT NULL DEFAULT 'connected', -- 'connected' | 'disconnected'
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    -- Games table
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      category TEXT NOT NULL,
      question_count INTEGER NOT NULL,
      time_per_question INTEGER NOT NULL,
      reveal_mode TEXT NOT NULL DEFAULT 'standard', -- 'standard' | 'immediate'
      status TEXT NOT NULL DEFAULT 'configuring',
      current_question_index INTEGER NOT NULL DEFAULT 0,
      question_started_at INTEGER,
      question_deadline_at INTEGER,
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    -- Questions bank
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question_text TEXT NOT NULL,
      normalized_text TEXT NOT NULL,
      similarity_hash TEXT NOT NULL,
      topic_tags TEXT, -- JSON array of strings
      ngram_signature TEXT, -- JSON array of 3-grams
      source TEXT NOT NULL DEFAULT 'seed', -- 'gemini' | 'seed' | 'manual'
      created_at INTEGER NOT NULL,
      times_used INTEGER NOT NULL DEFAULT 0
    );

    -- GameQuestions linking table
    CREATE TABLE IF NOT EXISTS game_questions (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      question_order INTEGER NOT NULL,
      UNIQUE (game_id, question_order),
      UNIQUE (game_id, question_id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    -- Answers table with UNIQUE constraint preventing double submits
    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      answer_text TEXT NOT NULL,
      submitted_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'answered', -- 'answered' | 'no_answer'
      UNIQUE (game_id, question_id, participant_id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );

    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      game_id TEXT,
      sender_id TEXT NOT NULL,
      message_text TEXT NOT NULL,
      question_ref TEXT, -- Question order/title ref (e.g. 'Sual 3')
      created_at INTEGER NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES participants(id) ON DELETE CASCADE
    );

    -- GameReadiness & Replay table
    CREATE TABLE IF NOT EXISTS game_readiness (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      is_ready INTEGER NOT NULL DEFAULT 0,
      replay_consent INTEGER NOT NULL DEFAULT 0,
      UNIQUE (game_id, participant_id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );

    -- ApiUsage metrics tracking
    CREATE TABLE IF NOT EXISTS api_usage (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD
      request_count INTEGER NOT NULL DEFAULT 0,
      tokens_in INTEGER NOT NULL DEFAULT 0,
      tokens_out INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      rate_limit_hits INTEGER NOT NULL DEFAULT 0
    );

    -- Performance Indices
    CREATE INDEX IF NOT EXISTS idx_questions_category_norm ON questions(category, normalized_text);
    CREATE INDEX IF NOT EXISTS idx_questions_similarity_hash ON questions(similarity_hash);
    CREATE INDEX IF NOT EXISTS idx_answers_game_question ON answers(game_id, question_id);
    CREATE INDEX IF NOT EXISTS idx_messages_room_time ON messages(room_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_token_hash);
    CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
  `);
}

// Data Retention Cleanup: purge inactive rooms older than DATA_RETENTION_DAYS (PRD Section 11)
export function runDataRetentionCleanup(retentionDays = 30) {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  
  // Find inactive rooms
  const oldRooms = db.prepare(`SELECT id FROM rooms WHERE last_activity_at < ?`).all(cutoffTime) as { id: string }[];
  if (oldRooms.length === 0) return 0;

  const roomIds = oldRooms.map(r => r.id);
  const placeholders = roomIds.map(() => '?').join(',');

  // Delete associated records
  db.exec(`BEGIN TRANSACTION;`);
  try {
    db.prepare(`DELETE FROM rooms WHERE id IN (${placeholders})`).run(...roomIds);
    db.exec(`COMMIT;`);
    return roomIds.length;
  } catch (err) {
    db.exec(`ROLLBACK;`);
    console.error('Data retention cleanup failed:', err);
    return 0;
  }
}
