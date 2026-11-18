import crypto from 'crypto';
import { db } from './db.js';

// Room code characters excluding confusing ones (0/O, 1/I/L)
const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateRoomCode(): string {
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  
  // Check if room code already exists in active rooms
  const existing = db.prepare('SELECT id FROM rooms WHERE room_code = ?').get(code);
  if (existing) {
    return generateRoomCode();
  }
  return code;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export interface ParticipantRecord {
  id: string;
  room_id: string;
  nickname: string;
  session_token_hash: string;
  role: 'host' | 'guest';
  last_seen_at: number;
  connection_status: 'connected' | 'disconnected';
}

export function findParticipantByToken(roomCode: string, rawToken: string): ParticipantRecord | null {
  const tokenHash = hashToken(rawToken);
  const row = db.prepare(`
    SELECT p.* 
    FROM participants p
    JOIN rooms r ON r.id = p.room_id
    WHERE r.room_code = ? AND p.session_token_hash = ?
  `).get(roomCode, tokenHash) as ParticipantRecord | undefined;

  return row || null;
}

export function updateParticipantStatus(participantId: string, status: 'connected' | 'disconnected') {
  db.prepare(`
    UPDATE participants 
    SET connection_status = ?, last_seen_at = ?
    WHERE id = ?
  `).run(status, Date.now(), participantId);
}

export function touchRoomActivity(roomId: string) {
  db.prepare(`
    UPDATE rooms 
    SET last_activity_at = ? 
    WHERE id = ?
  `).run(Date.now(), roomId);
}
