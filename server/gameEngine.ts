import { db } from './db.js';
import { transitionRoomState, transitionGameState } from './stateMachine.js';
import { prepareQuestionsForGame, PreparedQuestion } from './questionManager.js';
import { generateId, touchRoomActivity } from './session.js';

export interface ActiveQuestionView {
  questionId: string;
  order: number;
  totalQuestions: number;
  text: string;
  category: string;
  secondsRemaining: number;
  deadlineAt: number;
  hasYouAnswered: boolean;
  hasPartnerAnswered: boolean;
  isPartnerTyping?: boolean;
}

export interface RevealAnswerCard {
  questionId: string;
  order: number;
  questionText: string;
  category: string;
  participant1: {
    id: string;
    nickname: string;
    answer: string;
    status: 'answered' | 'no_answer';
  };
  participant2: {
    id: string;
    nickname: string;
    answer: string;
    status: 'answered' | 'no_answer';
  };
}

export interface ChatMessageView {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  questionRef?: string | null;
  createdAt: number;
}

// In-memory active timer tracking
const activeTimers = new Map<string, NodeJS.Timeout>();

// Clear any timer for a game
export function clearGameTimer(gameId: string) {
  if (activeTimers.has(gameId)) {
    clearTimeout(activeTimers.get(gameId)!);
    activeTimers.delete(gameId);
  }
}

// 1. Start Game
export async function startGame(
  roomId: string, 
  hostParticipantId: string,
  onStateUpdate: (roomId: string) => void
) {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as any;
  if (!room) throw new Error('Otaq tapılmadı.');

  const host = db.prepare('SELECT role FROM participants WHERE id = ? AND room_id = ?').get(hostParticipantId, roomId) as any;
  if (!host || host.role !== 'host') {
    throw new Error('Yalnız otaq sahibi oyunu başlada bilər.');
  }

  const activeGame = db.prepare('SELECT * FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId) as any;
  if (!activeGame) throw new Error('Aktiv oyun tapılmadı.');

  // Transition to generating
  transitionGameState(activeGame.id, 'generating');
  onStateUpdate(roomId);

  // Prepare questions (Database first, then Gemini with 3-level deduplication)
  const questions = await prepareQuestionsForGame(
    activeGame.id, 
    roomId, 
    activeGame.category, 
    activeGame.question_count
  );

  if (questions.length === 0) {
    throw new Error('Suallar hazırlanarkən xəta baş verdi.');
  }

  // Start question 0
  const now = Date.now();
  const timeMs = activeGame.time_per_question * 1000;
  const deadlineAt = now + timeMs;

  db.prepare(`
    UPDATE games 
    SET status = 'question_active',
        current_question_index = 0,
        question_started_at = ?,
        question_deadline_at = ?
    WHERE id = ?
  `).run(now, deadlineAt, activeGame.id);

  transitionRoomState(roomId, 'in_game');
  touchRoomActivity(roomId);
  onStateUpdate(roomId);

  // Schedule server-side timeout
  scheduleQuestionTimeout(roomId, activeGame.id, 0, activeGame.time_per_question, onStateUpdate);
}

// 2. Schedule Server Question Timeout
function scheduleQuestionTimeout(
  roomId: string,
  gameId: string,
  questionIndex: number,
  timeSeconds: number,
  onStateUpdate: (roomId: string) => void
) {
  clearGameTimer(gameId);

  const timer = setTimeout(() => {
    handleQuestionTimeout(roomId, gameId, questionIndex, onStateUpdate);
  }, timeSeconds * 1000);

  activeTimers.set(gameId, timer);
}

// 3. Handle Question Timeout (Deadline passed)
function handleQuestionTimeout(
  roomId: string,
  gameId: string,
  questionIndex: number,
  onStateUpdate: (roomId: string) => void
) {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
  if (!game || game.status !== 'question_active' || game.current_question_index !== questionIndex) {
    return;
  }

  const currentQ = db.prepare(`
    SELECT question_id FROM game_questions 
    WHERE game_id = ? AND question_order = ?
  `).get(gameId, questionIndex) as { question_id: string } | undefined;

  if (currentQ) {
    // Fill "Cavab verilmədi" for participants who did not answer
    const participants = db.prepare('SELECT id FROM participants WHERE room_id = ?').all(roomId) as { id: string }[];
    for (const p of participants) {
      db.prepare(`
        INSERT OR IGNORE INTO answers (id, game_id, question_id, participant_id, answer_text, submitted_at, status)
        VALUES (?, ?, ?, ?, 'Cavab verilmədi', ?, 'no_answer')
      `).run(generateId(), gameId, currentQ.question_id, p.id, Date.now());
    }
  }

  advanceToNextQuestionOrFinish(roomId, gameId, questionIndex, onStateUpdate);
}

// 4. Submit Answer (Participant)
export function submitAnswer(
  roomId: string,
  participantId: string,
  questionId: string,
  rawAnswer: string,
  onStateUpdate: (roomId: string) => void
) {
  const game = db.prepare('SELECT * FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId) as any;
  if (!game || game.status !== 'question_active') {
    throw new Error('Hazırda aktiv sual yoxdur.');
  }

  const currentQ = db.prepare(`
    SELECT question_id FROM game_questions 
    WHERE game_id = ? AND question_order = ?
  `).get(game.id, game.current_question_index) as { question_id: string } | undefined;

  if (!currentQ || currentQ.question_id !== questionId) {
    throw new Error('Yalnız cari aktiv suala cavab göndərə bilərsiniz.');
  }

  const answerText = rawAnswer ? rawAnswer.trim() : '';
  if (!answerText) {
    throw new Error('Boş cavab göndərmək mümkün deyil.');
  }
  if (answerText.length > 500) {
    throw new Error('Cavab maksimum 500 simvol ola bilər.');
  }

  // Check deadline (with 2.5s network grace period)
  if (Date.now() > game.question_deadline_at + 2500) {
    throw new Error('Bu sual üçün ayrılan vaxt artıq bitmişdir.');
  }

  // Insert answer (UNIQUE constraint ensures idempotency)
  db.prepare(`
    INSERT INTO answers (id, game_id, question_id, participant_id, answer_text, submitted_at, status)
    VALUES (?, ?, ?, ?, ?, ?, 'answered')
    ON CONFLICT(game_id, question_id, participant_id) DO NOTHING
  `).run(generateId(), game.id, questionId, participantId, answerText, Date.now());

  touchRoomActivity(roomId);

  // Check if both participants answered
  const participants = db.prepare('SELECT id FROM participants WHERE room_id = ?').all(roomId) as { id: string }[];
  const answersCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM answers 
    WHERE game_id = ? AND question_id = ?
  `).get(game.id, questionId) as { count: number };

  if (answersCount.count >= participants.length && participants.length === 2) {
    // Both answered! Cancel timeout and transition immediately
    clearGameTimer(game.id);
    advanceToNextQuestionOrFinish(roomId, game.id, game.current_question_index, onStateUpdate);
  } else {
    onStateUpdate(roomId);
  }
}

// 5. Advance to Next Question or Finish
function advanceToNextQuestionOrFinish(
  roomId: string,
  gameId: string,
  currentIndex: number,
  onStateUpdate: (roomId: string) => void
) {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
  if (!game) return;

  // 2.5 second question transition buffer (PRD Section 4 & 7)
  transitionGameState(gameId, 'question_transition');
  onStateUpdate(roomId);

  setTimeout(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < game.question_count) {
      // Move to next question
      const now = Date.now();
      const deadlineAt = now + game.time_per_question * 1000;

      db.prepare(`
        UPDATE games 
        SET status = 'question_active',
            current_question_index = ?,
            question_started_at = ?,
            question_deadline_at = ?
        WHERE id = ?
      `).run(nextIndex, now, deadlineAt, gameId);

      onStateUpdate(roomId);
      scheduleQuestionTimeout(roomId, gameId, nextIndex, game.time_per_question, onStateUpdate);
    } else {
      // Completed all questions! Reveal phase open (PRD Section 8)
      transitionGameState(gameId, 'completed');
      transitionRoomState(roomId, 'results');
      clearGameTimer(gameId);
      onStateUpdate(roomId);
    }
  }, 2500);
}

// 6. Get Active Question Info for Client (partner's answer is STRICTLY HIDDEN)
export function getActiveQuestionForClient(
  roomId: string, 
  participantId: string
): ActiveQuestionView | null {
  const game = db.prepare('SELECT * FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId) as any;
  if (!game || (game.status !== 'question_active' && game.status !== 'question_transition')) {
    return null;
  }

  const q = db.prepare(`
    SELECT q.id, q.question_text, q.category
    FROM game_questions gq
    JOIN questions q ON q.id = gq.question_id
    WHERE gq.game_id = ? AND gq.question_order = ?
  `).get(game.id, game.current_question_index) as any;

  if (!q) return null;

  // Check answers status
  const answers = db.prepare(`
    SELECT participant_id, status FROM answers 
    WHERE game_id = ? AND question_id = ?
  `).all(game.id, q.id) as { participant_id: string; status: string }[];

  const youAnswered = answers.some(a => a.participant_id === participantId);
  const partnerAnswered = answers.some(a => a.participant_id !== participantId);

  const secondsRemaining = Math.max(0, Math.ceil((game.question_deadline_at - Date.now()) / 1000));

  return {
    questionId: q.id,
    order: game.current_question_index,
    totalQuestions: game.question_count,
    text: q.question_text,
    category: q.category,
    secondsRemaining,
    deadlineAt: game.question_deadline_at,
    hasYouAnswered: youAnswered,
    hasPartnerAnswered: partnerAnswered
  };
}

// 7. Get Reveal Cards for Completed Game (Both answers revealed simultaneously)
export function getRevealCards(roomId: string, gameId?: string): RevealAnswerCard[] {
  const activeGame = gameId 
    ? db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any
    : db.prepare('SELECT * FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId) as any;

  if (!activeGame || activeGame.status !== 'completed') {
    return [];
  }

  const participants = db.prepare(`
    SELECT id, nickname, role FROM participants WHERE room_id = ? ORDER BY role DESC
  `).all(roomId) as any[];

  const p1 = participants[0] || { id: '', nickname: 'İştirakçı 1' };
  const p2 = participants[1] || { id: '', nickname: 'İştirakçı 2' };

  const questions = db.prepare(`
    SELECT q.id, gq.question_order, q.question_text, q.category
    FROM game_questions gq
    JOIN questions q ON q.id = gq.question_id
    WHERE gq.game_id = ?
    ORDER BY gq.question_order ASC
  `).all(activeGame.id) as any[];

  const answers = db.prepare(`
    SELECT question_id, participant_id, answer_text, status
    FROM answers
    WHERE game_id = ?
  `).all(activeGame.id) as any[];

  return questions.map(q => {
    const ans1 = answers.find(a => a.question_id === q.id && a.participant_id === p1.id);
    const ans2 = answers.find(a => a.question_id === q.id && a.participant_id === p2.id);

    return {
      questionId: q.id,
      order: q.question_order,
      questionText: q.question_text,
      category: q.category,
      participant1: {
        id: p1.id,
        nickname: p1.nickname,
        answer: ans1 ? ans1.answer_text : 'Cavab verilmədi',
        status: ans1 ? ans1.status : 'no_answer'
      },
      participant2: {
        id: p2.id,
        nickname: p2.nickname,
        answer: ans2 ? ans2.answer_text : 'Cavab verilmədi',
        status: ans2 ? ans2.status : 'no_answer'
      }
    };
  });
}

// 8. Chat Message Handling (Sanitized, max 500 chars, with question reference)
export function postChatMessage(
  roomId: string,
  senderId: string,
  rawText: string,
  questionRef?: string
): ChatMessageView {
  const text = rawText ? rawText.trim() : '';
  if (!text) throw new Error('Mesaj mətni boş ola bilməz.');
  if (text.length > 500) throw new Error('Mesaj maksimum 500 simvol ola bilər.');

  // Basic HTML escape for XSS prevention
  const sanitized = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const sender = db.prepare('SELECT nickname FROM participants WHERE id = ? AND room_id = ?').get(senderId, roomId) as { nickname: string } | undefined;
  if (!sender) throw new Error('Göndərən tapılmadı.');

  const msgId = generateId();
  const now = Date.now();

  const activeGame = db.prepare('SELECT id FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId) as any;

  db.prepare(`
    INSERT INTO messages (id, room_id, game_id, sender_id, message_text, question_ref, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(msgId, roomId, activeGame ? activeGame.id : null, senderId, sanitized, questionRef || null, now);

  touchRoomActivity(roomId);

  return {
    id: msgId,
    senderId,
    senderName: sender.nickname,
    text: sanitized,
    questionRef: questionRef || null,
    createdAt: now
  };
}

export function getRoomChatMessages(roomId: string): ChatMessageView[] {
  return db.prepare(`
    SELECT m.id, m.sender_id as "senderId", p.nickname as "senderName", m.message_text as "text", m.question_ref as "questionRef", m.created_at as "createdAt"
    FROM messages m
    JOIN participants p ON p.id = m.sender_id
    WHERE m.room_id = ?
    ORDER BY m.created_at ASC
  `).all(roomId) as ChatMessageView[];
}

// 9. Replay Management (Two-sided consent, previous games preserved)
export function requestReplay(
  roomId: string, 
  participantId: string,
  onStateUpdate: (roomId: string) => void
) {
  const activeGame = db.prepare('SELECT id, status FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(roomId) as any;
  if (!activeGame || activeGame.status !== 'completed') {
    throw new Error('Yalnız tamamlanmış oyun üçün yenidən oynama təklifi göndərilə bilər.');
  }

  // Set replay consent for this participant
  db.prepare(`
    UPDATE game_readiness 
    SET replay_consent = 1 
    WHERE game_id = ? AND participant_id = ?
  `).run(activeGame.id, participantId);

  touchRoomActivity(roomId);

  // Check if both participants gave consent
  const consentCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM game_readiness 
    WHERE game_id = ? AND replay_consent = 1
  `).get(activeGame.id) as { count: number };

  if (consentCount.count >= 2) {
    // Both agreed! Create a NEW game preserving previous games (PRD Section 10)
    const newGameId = generateId();
    const now = Date.now();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO games (id, room_id, category, question_count, time_per_question, reveal_mode, status, created_at)
        VALUES (?, ?, 'love', 10, 60, 'standard', 'configuring', ?)
      `).run(newGameId, roomId, now);

      const participants = db.prepare('SELECT id FROM participants WHERE room_id = ?').all(roomId) as { id: string }[];
      for (const p of participants) {
        db.prepare(`
          INSERT INTO game_readiness (id, game_id, participant_id, is_ready, replay_consent)
          VALUES (?, ?, ?, 0, 0)
        `).run(generateId(), newGameId, p.id);
      }

      transitionRoomState(roomId, 'lobby');
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  } else {
    transitionRoomState(roomId, 'replay_pending');
  }

  onStateUpdate(roomId);
}
