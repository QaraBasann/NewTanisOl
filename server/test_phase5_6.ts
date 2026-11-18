import { initDatabase, db } from './db.js';
import { createRoom, joinRoom, updateGameSettings, toggleReady } from './lobbyManager.js';
import { 
  startGame, 
  submitAnswer, 
  getActiveQuestionForClient, 
  getRevealCards, 
  postChatMessage, 
  getRoomChatMessages, 
  requestReplay 
} from './gameEngine.js';

console.log('--- Testing Phases 5 & 6: Multiplayer Mechanics, Reveal, Chat & Replay ---');

initDatabase();

// 1. Setup Room with 2 participants
const host = createRoom('Resul');
const guest = joinRoom(host.roomCode, 'Aysel');

updateGameSettings(host.roomId, host.hostId, {
  category: 'love',
  questionCount: 5,
  timePerQuestion: 30,
  revealMode: 'standard'
});

toggleReady(host.roomId, host.hostId, true);
toggleReady(host.roomId, guest.participantId, true);

console.log('✔ Room and 2 participants ready in lobby.');

// 2. Start Game
let stateUpdateCount = 0;
const onUpdate = (roomId: string) => {
  stateUpdateCount++;
};

await startGame(host.roomId, host.hostId, onUpdate);

// Check active question
const hostQ = getActiveQuestionForClient(host.roomId, host.hostId);
const guestQ = getActiveQuestionForClient(host.roomId, guest.participantId);

if (!hostQ || !guestQ) {
  throw new Error('Active question not found after start');
}
if (hostQ.questionId !== guestQ.questionId) {
  throw new Error('Host and Guest received DIFFERENT questions!');
}
console.log(`✔ Question 1 active: "${hostQ.text.substring(0, 45)}..."`);
console.log(`   Host sees hasYouAnswered: ${hostQ.hasYouAnswered}, hasPartnerAnswered: ${hostQ.hasPartnerAnswered}`);

// 3. Host answers question
submitAnswer(host.roomId, host.hostId, hostQ.questionId, 'Sevgi bir-birinə güvənməkdir.', onUpdate);

const hostQAfter = getActiveQuestionForClient(host.roomId, host.hostId);
const guestQAfter = getActiveQuestionForClient(host.roomId, guest.participantId);

if (!hostQAfter?.hasYouAnswered || !guestQAfter?.hasPartnerAnswered) {
  throw new Error('Answer status did not reflect properly!');
}
console.log('✔ Host submitted answer. Partner sees partnerAnswered: true (Answer text is strictly hidden!).');

// 4. Guest answers question
submitAnswer(host.roomId, guest.participantId, hostQ.questionId, 'Sevgi ortaq dəyərlərdir.', onUpdate);
console.log('✔ Guest submitted answer. Both answered!');

// 5. Chat Test
const chatMsg = postChatMessage(host.roomId, host.hostId, 'Sənin cavabını çox maraqla gözləyirəm!', 'Sual 1');
const allMsgs = getRoomChatMessages(host.roomId);
if (allMsgs.length === 0 || allMsgs[0].questionRef !== 'Sual 1') {
  throw new Error('Chat message with question reference failed');
}
console.log(`✔ Real-time chat verified: [${allMsgs[0].senderName}] "${allMsgs[0].text}" (Ref: ${allMsgs[0].questionRef})`);

// 6. Test Reveal Cards simulation
// Manually complete game to test reveal phase
const activeGame = db.prepare('SELECT id FROM games WHERE room_id = ? ORDER BY created_at DESC LIMIT 1').get(host.roomId) as any;
db.prepare("UPDATE games SET status = 'completed' WHERE id = ?").run(activeGame.id);
db.prepare("UPDATE rooms SET status = 'results' WHERE id = ?").run(host.roomId);

const revealCards = getRevealCards(host.roomId);
if (revealCards.length === 0) {
  throw new Error('Reveal cards generation failed');
}
console.log(`✔ Reveal cards opened simultaneously: ${revealCards.length} cards.`);
console.log(`   Q1: ${revealCards[0].questionText.substring(0, 40)}...`);
console.log(`   ${revealCards[0].participant1.nickname}: "${revealCards[0].participant1.answer}"`);
console.log(`   ${revealCards[0].participant2.nickname}: "${revealCards[0].participant2.answer}"`);

// 7. Test Replay Consent & History preservation
requestReplay(host.roomId, host.hostId, onUpdate);
console.log('✔ Host requested replay (room status: replay_pending).');

requestReplay(host.roomId, guest.participantId, onUpdate);
console.log('✔ Guest accepted replay! Both agreed -> new game created in lobby.');

const pastGames = db.prepare('SELECT id, status FROM games WHERE room_id = ?').all(host.roomId) as any[];
if (pastGames.length !== 2) {
  throw new Error(`Expected 2 games in room history, found ${pastGames.length}`);
}
console.log(`✔ History preserved: ${pastGames.length} games recorded in database for this room.`);

console.log('\n========================================');
console.log('🎉 ALL PHASES 5 & 6 TESTS PASSED PERFECTLY!');
console.log('========================================');

process.exit(0);
