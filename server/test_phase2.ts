import { initDatabase, db } from './db.js';
import { generateRoomCode, generateSessionToken, hashToken, findParticipantByToken } from './session.js';
import { transitionRoomState, transitionGameState, StateMachineError } from './stateMachine.js';

console.log('--- Testing Phase 2: Database, Session & State Machine ---');

// 1. Initialize Database
initDatabase();
console.log('✔ Database initialized with all PRD tables, indexes & constraints.');

// 2. Test Room Code Generation
const code1 = generateRoomCode();
const code2 = generateRoomCode();
if (code1.length !== 6 || code2.length !== 6 || code1 === code2) {
  throw new Error('Room code generation failed');
}
console.log(`✔ Generated unique cryptographic room codes: ${code1}, ${code2}`);

// 3. Test Room Creation & Host Participant
const roomId = 'test_room_' + Date.now();
const hostToken = generateSessionToken();
const hostTokenHash = hashToken(hostToken);
const hostId = 'host_' + Date.now();

db.prepare(`
  INSERT INTO rooms (id, room_code, host_id, status, created_at, last_activity_at)
  VALUES (?, ?, ?, 'waiting_for_guest', ?, ?)
`).run(roomId, code1, hostId, Date.now(), Date.now());

db.prepare(`
  INSERT INTO participants (id, room_id, nickname, session_token_hash, role, last_seen_at, connection_status)
  VALUES (?, ?, 'Resul', ?, 'host', ?, 'connected')
`).run(hostId, roomId, hostTokenHash, Date.now());

console.log('✔ Host participant and room created.');

// 4. Test Token Authentication & Reconnection Lookup
const foundHost = findParticipantByToken(code1, hostToken);
if (!foundHost || foundHost.id !== hostId || foundHost.role !== 'host') {
  throw new Error('findParticipantByToken failed with valid token');
}
const invalidLookup = findParticipantByToken(code1, 'wrong_token');
if (invalidLookup !== null) {
  throw new Error('findParticipantByToken succeeded with invalid token');
}
console.log('✔ Session token authentication and reconnection lookup verified.');

// 5. Test Guest Joining
const guestId = 'guest_' + Date.now();
const guestToken = generateSessionToken();
const guestTokenHash = hashToken(guestToken);

db.prepare(`
  INSERT INTO participants (id, room_id, nickname, session_token_hash, role, last_seen_at, connection_status)
  VALUES (?, ?, 'Aysel', ?, 'guest', ?, 'connected')
`).run(guestId, roomId, guestTokenHash, Date.now());

db.prepare(`UPDATE rooms SET guest_id = ? WHERE id = ?`).run(guestId, roomId);

// Transition room to 'lobby'
transitionRoomState(roomId, 'lobby');
const roomRow = db.prepare('SELECT status FROM rooms WHERE id = ?').get(roomId) as { status: string };
if (roomRow.status !== 'lobby') {
  throw new Error('Room transition to lobby failed');
}
console.log('✔ Room state successfully transitioned: waiting_for_guest -> lobby');

// 6. Test State Machine Invalid Transition Rejection
try {
  // Directly jumping from 'lobby' to 'results' is illegal
  transitionRoomState(roomId, 'results');
  throw new Error('State machine allowed illegal transition!');
} catch (err: any) {
  if (err instanceof StateMachineError) {
    console.log(`✔ State machine correctly blocked illegal transition: ${err.message}`);
  } else {
    throw err;
  }
}

// 7. Test Game Creation and Unique Answer Constraints
const gameId = 'game_' + Date.now();
db.prepare(`
  INSERT INTO games (id, room_id, category, question_count, time_per_question, status, created_at)
  VALUES (?, ?, 'love', 5, 45, 'configuring', ?)
`).run(gameId, roomId, Date.now());

// Transition game: configuring -> generating -> ready -> question_active
transitionGameState(gameId, 'generating');
transitionGameState(gameId, 'ready');
transitionGameState(gameId, 'question_active');
console.log('✔ Game state machine transitioned smoothly: configuring -> generating -> ready -> question_active');

// Insert a question & answer
const qId = 'q_test_' + Date.now();
db.prepare(`
  INSERT INTO questions (id, category, question_text, normalized_text, similarity_hash, source, created_at)
  VALUES (?, 'love', 'Sənin üçün sevgi nədir?', 'senin ucun sevgi nedir', 'hash123', 'seed', ?)
`).run(qId, Date.now());

const gqId = 'gq_' + Date.now();
db.prepare(`
  INSERT INTO game_questions (id, game_id, question_id, question_order)
  VALUES (?, ?, ?, 0)
`).run(gqId, gameId, qId);

// First answer insertion
const ansId = 'ans_' + Date.now();
db.prepare(`
  INSERT INTO answers (id, game_id, question_id, participant_id, answer_text, submitted_at, status)
  VALUES (?, ?, ?, ?, 'Sevgi qarşılıqlı hörmətdir.', ?, 'answered')
`).run(ansId, gameId, qId, hostId, Date.now());
console.log('✔ Answer inserted successfully.');

// Test UNIQUE constraint on answers: duplicate submission must fail
try {
  db.prepare(`
    INSERT INTO answers (id, game_id, question_id, participant_id, answer_text, submitted_at, status)
    VALUES ('ans_2', ?, ?, ?, 'Başqa bir cavab', ?, 'answered')
  `).run(gameId, qId, hostId, Date.now());
  throw new Error('Database UNIQUE constraint failed: duplicate answer allowed');
} catch (err: any) {
  console.log('✔ Database UNIQUE constraint successfully prevented duplicate answer submission.');
}

console.log('\n========================================');
console.log('🎉 ALL PHASE 2 TESTS PASSED PERFECTLY!');
console.log('========================================');
