import { db } from './db.js';
import { 
  generateRoomCode, 
  generateSessionToken, 
  hashToken, 
  generateId, 
  findParticipantByToken,
  touchRoomActivity 
} from './session.js';
import { transitionRoomState, transitionGameState } from './stateMachine.js';
import { 
  CATEGORIES, 
  VALID_QUESTION_COUNTS, 
  VALID_TIMES_PER_QUESTION, 
  VALID_REVEAL_MODES,
  QuestionCount,
  TimePerQuestion,
  RevealMode 
} from './categories.js';

// Simple in-memory rate limiter for join attempts (to prevent brute-force attacks)
const joinAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ipOrKey: string): boolean {
  const now = Date.now();
  const record = joinAttempts.get(ipOrKey);
  if (!record || now > record.resetAt) {
    joinAttempts.set(ipOrKey, { count: 1, resetAt: now + 60000 }); // 60s window
    return true;
  }
  if (record.count >= 15) {
    return false; // Max 15 attempts per minute
  }
  record.count += 1;
  return true;
}

export interface ClientParticipantView {
  id: string;
  nickname: string;
  role: 'host' | 'guest';
  isReady: boolean;
  connectionStatus: 'connected' | 'disconnected';
}

export interface RoomSnapshot {
  roomCode: string;
  roomId: string;
  roomStatus: string;
  gameId: string | null;
  gameStatus: string | null;
  settings: {
    category: string;
    questionCount: number;
    timePerQuestion: number;
    revealMode: string;
  };
  participants: ClientParticipantView[];
  yourRole?: 'host' | 'guest';
  yourParticipantId?: string;
  categories: typeof CATEGORIES;
}

export function validateNickname(name: string): string {
  const trimmed = name ? name.trim() : '';
  if (trimmed.length < 2 || trimmed.length > 20) {
    throw new Error('Ad 2 ilə 20 simvol arasında olmalıdır.');
  }
  return trimmed;
}

// 1. Create Room (Host)
export function createRoom(nickname: string) {
  const validName = validateNickname(nickname);
  const roomId = generateId();
  const hostId = generateId();
  const roomCode = generateRoomCode();
  const sessionToken = generateSessionToken();
  const tokenHash = hashToken(sessionToken);
  const now = Date.now();

  db.exec('BEGIN TRANSACTION;');
  try {
    // Insert room
    db.prepare(`
      INSERT INTO rooms (id, room_code, host_id, status, created_at, last_activity_at)
      VALUES (?, ?, ?, 'waiting_for_guest', ?, ?)
    `).run(roomId, roomCode, hostId, now, now);

    // Insert host participant
    db.prepare(`
      INSERT INTO participants (id, room_id, nickname, session_token_hash, role, last_seen_at, connection_status)
      VALUES (?, ?, ?, ?, 'host', ?, 'connected')
    `).run(hostId, roomId, validName, tokenHash, now);

    // Create default game (love category, 10 questions, 60s, standard)
    const gameId = generateId();
    db.prepare(`
      INSERT INTO games (id, room_id, category, question_count, time_per_question, reveal_mode, status, created_at)
      VALUES (?, ?, 'love', 10, 60, 'standard', 'configuring', ?)
    `).run(gameId, roomId, now);

    // Host readiness
    db.prepare(`
      INSERT INTO game_readiness (id, game_id, participant_id, is_ready, replay_consent)
      VALUES (?, ?, ?, 0, 0)
    `).run(generateId(), gameId, hostId);

    db.exec('COMMIT;');

    return {
      roomCode,
      roomId,
      hostId,
      sessionToken,
      gameId
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// 2. Join Room (Guest or Reconnecting Participant)
export function joinRoom(roomCode: string, nickname: string, existingToken?: string, clientIp = 'global') {
  if (!checkRateLimit(clientIp)) {
    throw new Error('Həddindən artıq qoşulma cəhdi. Zəhmət olmasa bir dəqiqə gözləyin.');
  }

  const cleanCode = roomCode ? roomCode.trim().toUpperCase() : '';
  const room = db.prepare('SELECT * FROM rooms WHERE room_code = ?').get(cleanCode) as any;
  if (!room) {
    throw new Error('Bu koda uyğun otaq tapılmadı. Zəhmət olmasa kodu düzgün daxil edin.');
  }

  const now = Date.now();
  touchRoomActivity(room.id);

  // Check if participant is reconnecting with an existing valid session token
  if (existingToken) {
    const existing = findParticipantByToken(cleanCode, existingToken);
    if (existing) {
      db.prepare(`
        UPDATE participants 
        SET connection_status = 'connected', last_seen_at = ?
        WHERE id = ?
      `).run(now, existing.id);

      return {
        roomCode: cleanCode,
        roomId: room.id,
        participantId: existing.id,
        role: existing.role,
        sessionToken: existingToken,
        isReconnection: true
      };
    }
  }

  // Check existing participants count in the room
  const participants = db.prepare('SELECT * FROM participants WHERE room_id = ?').all(room.id) as any[];
  if (participants.length >= 2) {
    throw new Error('Bu otaq doludur (Maksimum 2 nəfər).');
  }

  // Register new Guest
  const validName = validateNickname(nickname);
  const guestId = generateId();
  const sessionToken = generateSessionToken();
  const tokenHash = hashToken(sessionToken);

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO participants (id, room_id, nickname, session_token_hash, role, last_seen_at, connection_status)
      VALUES (?, ?, ?, ?, 'guest', ?, 'connected')
    `).run(guestId, room.id, validName, tokenHash, now);

    db.prepare('UPDATE rooms SET guest_id = ?, status = ? WHERE id = ?').run(guestId, 'lobby', room.id);

    // Initialize readiness for guest in active game
    const activeGame = db.prepare('SELECT id FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(room.id) as any;
    if (activeGame) {
      db.prepare(`
        INSERT OR IGNORE INTO game_readiness (id, game_id, participant_id, is_ready, replay_consent)
        VALUES (?, ?, ?, 0, 0)
      `).run(generateId(), activeGame.id, guestId);
    }

    db.exec('COMMIT;');

    return {
      roomCode: cleanCode,
      roomId: room.id,
      participantId: guestId,
      role: 'guest' as const,
      sessionToken,
      isReconnection: false
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// 3. Update Game Settings (Host only)
export function updateGameSettings(
  roomId: string, 
  participantId: string, 
  settings: {
    category: string;
    questionCount: number;
    timePerQuestion: number;
    revealMode: string;
  }
) {
  // Verify participant is Host
  const participant = db.prepare('SELECT role FROM participants WHERE id = ? AND room_id = ?').get(participantId, roomId) as any;
  if (!participant || participant.role !== 'host') {
    throw new Error('Yalnız otaq sahibi (Host) oyun parametrlərini dəyişə bilər.');
  }

  // Validate Category
  const catExists = CATEGORIES.some(c => c.id === settings.category);
  if (!catExists) {
    throw new Error('Yanlış kateqoriya seçimi.');
  }

  // Validate Question Count
  if (!VALID_QUESTION_COUNTS.includes(settings.questionCount as QuestionCount)) {
    throw new Error(`Sual sayı yalnız ${VALID_QUESTION_COUNTS.join(', ')} ola bilər.`);
  }

  // Validate Time Per Question
  if (!VALID_TIMES_PER_QUESTION.includes(settings.timePerQuestion as TimePerQuestion)) {
    throw new Error(`Sual vaxtı yalnız ${VALID_TIMES_PER_QUESTION.join(', ')} saniyə ola bilər.`);
  }

  // Validate Reveal Mode
  if (!VALID_REVEAL_MODES.includes(settings.revealMode as RevealMode)) {
    throw new Error('Yanlış cavab açılma rejimi.');
  }

  const activeGame = db.prepare('SELECT id, status FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId) as any;
  if (!activeGame || (activeGame.status !== 'configuring' && activeGame.status !== 'ready')) {
    throw new Error('Hazırda oyun parametrlərini dəyişmək mümkün deyil.');
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      UPDATE games 
      SET category = ?, question_count = ?, time_per_question = ?, reveal_mode = ?, status = 'configuring'
      WHERE id = ?
    `).run(
      settings.category,
      settings.questionCount,
      settings.timePerQuestion,
      settings.revealMode,
      activeGame.id
    );

    // Reset readiness when settings change so both must re-confirm
    db.prepare('UPDATE game_readiness SET is_ready = 0 WHERE game_id = ?').run(activeGame.id);

    touchRoomActivity(roomId);
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// 4. Toggle Ready Status
export function toggleReady(roomId: string, participantId: string, isReady: boolean) {
  const activeGame = db.prepare('SELECT id, status FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId) as any;
  if (!activeGame) {
    throw new Error('Aktiv oyun tapılmadı.');
  }

  db.prepare(`
    UPDATE game_readiness 
    SET is_ready = ? 
    WHERE game_id = ? AND participant_id = ?
  `).run(isReady ? 1 : 0, activeGame.id, participantId);

  touchRoomActivity(roomId);

  // Check if both participants are ready
  const participants = db.prepare('SELECT id FROM participants WHERE room_id = ?').all(roomId) as any[];
  if (participants.length === 2) {
    const readyCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM game_readiness 
      WHERE game_id = ? AND is_ready = 1
    `).get(activeGame.id) as { count: number };

    if (readyCount.count === 2 && activeGame.status === 'configuring') {
      transitionGameState(activeGame.id, 'ready');
    } else if (readyCount.count < 2 && activeGame.status === 'ready') {
      transitionGameState(activeGame.id, 'configuring');
    }
  }
}

// 5. Generate Full Room Snapshot for Clients
export function getRoomSnapshot(roomId: string, participantId?: string): RoomSnapshot {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as any;
  if (!room) {
    throw new Error('Otaq tapılmadı.');
  }

  const participants = db.prepare(`
    SELECT p.id, p.nickname, p.role, p.connection_status, COALESCE(gr.is_ready, 0) as is_ready
    FROM participants p
    LEFT JOIN games g ON g.room_id = p.room_id
    LEFT JOIN game_readiness gr ON gr.game_id = g.id AND gr.participant_id = p.id
    WHERE p.room_id = ?
    ORDER BY p.role DESC
  `).all(roomId) as any[];

  const activeGame = db.prepare('SELECT * FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId) as any;

  const currentParticipant = participantId 
    ? participants.find(p => p.id === participantId)
    : undefined;

  return {
    roomCode: room.room_code,
    roomId: room.id,
    roomStatus: room.status,
    gameId: activeGame ? activeGame.id : null,
    gameStatus: activeGame ? activeGame.status : null,
    settings: {
      category: activeGame ? activeGame.category : 'love',
      questionCount: activeGame ? activeGame.question_count : 10,
      timePerQuestion: activeGame ? activeGame.time_per_question : 60,
      revealMode: activeGame ? activeGame.reveal_mode : 'standard',
    },
    participants: participants.map(p => ({
      id: p.id,
      nickname: p.nickname,
      role: p.role,
      isReady: Boolean(p.is_ready),
      connectionStatus: p.connection_status
    })),
    yourRole: currentParticipant ? currentParticipant.role : undefined,
    yourParticipantId: participantId,
    categories: CATEGORIES
  };
}
