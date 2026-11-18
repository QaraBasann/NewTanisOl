import { db } from './db.js';

export type RoomStatus = 
  | 'waiting_for_guest' 
  | 'lobby' 
  | 'in_game' 
  | 'results' 
  | 'replay_pending';

export type GameStatus = 
  | 'configuring' 
  | 'generating' 
  | 'ready' 
  | 'question_active' 
  | 'question_transition' 
  | 'completed' 
  | 'aborted';

// Valid Room state transitions
const VALID_ROOM_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  waiting_for_guest: ['lobby'],
  lobby: ['in_game', 'waiting_for_guest'],
  in_game: ['results', 'aborted', 'lobby'],
  results: ['replay_pending', 'lobby'],
  replay_pending: ['lobby', 'results']
};

// Valid Game state transitions
const VALID_GAME_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  configuring: ['ready', 'generating', 'aborted'],
  generating: ['ready', 'question_active', 'configuring', 'aborted'],
  ready: ['configuring', 'generating', 'question_active', 'aborted'],
  question_active: ['question_transition', 'completed', 'aborted'],
  question_transition: ['question_active', 'completed', 'aborted'],
  completed: ['aborted'],
  aborted: []
};

export class StateMachineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateMachineError';
  }
}

export function transitionRoomState(roomId: string, nextStatus: RoomStatus): void {
  const room = db.prepare('SELECT status FROM rooms WHERE id = ?').get(roomId) as { status: RoomStatus } | undefined;
  if (!room) {
    throw new StateMachineError(`Room with id ${roomId} not found`);
  }

  const currentStatus = room.status;
  if (currentStatus === nextStatus) return; // Idempotent

  const allowed = VALID_ROOM_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new StateMachineError(`Invalid room transition from ${currentStatus} to ${nextStatus}`);
  }

  db.prepare('UPDATE rooms SET status = ?, last_activity_at = ? WHERE id = ?').run(
    nextStatus,
    Date.now(),
    roomId
  );
}

export function transitionGameState(gameId: string, nextStatus: GameStatus): void {
  const game = db.prepare('SELECT status FROM games WHERE id = ?').get(gameId) as { status: GameStatus } | undefined;
  if (!game) {
    throw new StateMachineError(`Game with id ${gameId} not found`);
  }

  const currentStatus = game.status;
  if (currentStatus === nextStatus) return; // Idempotent

  const allowed = VALID_GAME_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new StateMachineError(`Invalid game transition from ${currentStatus} to ${nextStatus}`);
  }

  const completedAt = nextStatus === 'completed' ? Date.now() : null;
  db.prepare(`
    UPDATE games 
    SET status = ?, 
        completed_at = COALESCE(?, completed_at)
    WHERE id = ?
  `).run(nextStatus, completedAt, gameId);
}
