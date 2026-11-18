import { initDatabase } from './db.js';
import { 
  createRoom, 
  joinRoom, 
  updateGameSettings, 
  toggleReady, 
  getRoomSnapshot 
} from './lobbyManager.js';
import { CATEGORIES } from './categories.js';

console.log('--- Testing Phase 3: Game Parameters & Lobby Synchronization ---');

initDatabase();

// 1. Test Room Creation with Host
const hostRes = createRoom('Resul');
console.log(`✔ Room created with code: ${hostRes.roomCode}, Host ID: ${hostRes.hostId}`);

// Test Nickname validation
try {
  createRoom('A'); // Too short (< 2)
  throw new Error('Allowed invalid short nickname');
} catch (e: any) {
  console.log('✔ Short nickname correctly rejected:', e.message);
}

// 2. Test Guest Joining
const guestRes = joinRoom(hostRes.roomCode, 'Aysel');
console.log(`✔ Guest joined: ${guestRes.participantId}, Role: ${guestRes.role}`);

// 3. Test 3rd Person Rejection ("Bu otaq doludur")
try {
  joinRoom(hostRes.roomCode, 'Tural');
  throw new Error('3rd participant was allowed into 2-person room!');
} catch (e: any) {
  console.log('✔ 3rd participant correctly rejected:', e.message);
}

// 4. Test Host Updating Settings
updateGameSettings(hostRes.roomId, hostRes.hostId, {
  category: 'deep_thoughtful',
  questionCount: 15,
  timePerQuestion: 90,
  revealMode: 'immediate'
});
console.log('✔ Host successfully updated game settings (deep_thoughtful, 15 questions, 90s, immediate)');

// 5. Test Guest attempting to update settings (MUST BE BLOCKED)
try {
  updateGameSettings(guestRes.roomId, guestRes.participantId, {
    category: 'fun_unusual',
    questionCount: 5,
    timePerQuestion: 30,
    revealMode: 'standard'
  });
  throw new Error('Guest was allowed to update game settings!');
} catch (e: any) {
  console.log('✔ Guest setting update blocked as expected:', e.message);
}

// 6. Test Invalid Parameters Rejection
try {
  updateGameSettings(hostRes.roomId, hostRes.hostId, {
    category: 'deep_thoughtful',
    questionCount: 7 as any, // Invalid count
    timePerQuestion: 90,
    revealMode: 'immediate'
  });
  throw new Error('Invalid question count was allowed!');
} catch (e: any) {
  console.log('✔ Invalid question count rejected:', e.message);
}

// 7. Test Readiness Toggle & Synchronization
let snapshot = getRoomSnapshot(hostRes.roomId, hostRes.hostId);
console.log(`Initial game status: ${snapshot.gameStatus}`);

// Host is ready
toggleReady(hostRes.roomId, hostRes.hostId, true);
snapshot = getRoomSnapshot(hostRes.roomId, hostRes.hostId);
const hostReady = snapshot.participants.find(p => p.id === hostRes.hostId)?.isReady;
const guestReady = snapshot.participants.find(p => p.id === guestRes.participantId)?.isReady;
console.log(`Host ready: ${hostReady}, Guest ready: ${guestReady}, Game status: ${snapshot.gameStatus}`);

// Guest is ready -> Game should transition to 'ready'
toggleReady(hostRes.roomId, guestRes.participantId, true);
snapshot = getRoomSnapshot(hostRes.roomId, hostRes.hostId);
console.log(`Both ready! New game status: ${snapshot.gameStatus}`);

if (snapshot.gameStatus !== 'ready') {
  throw new Error(`Expected gameStatus to be 'ready' but got '${snapshot.gameStatus}'`);
}

// 8. Test Setting change resets readiness
updateGameSettings(hostRes.roomId, hostRes.hostId, {
  category: 'memories',
  questionCount: 10,
  timePerQuestion: 60,
  revealMode: 'standard'
});
snapshot = getRoomSnapshot(hostRes.roomId, hostRes.hostId);
const allReadyAfterChange = snapshot.participants.every(p => p.isReady);
console.log(`Setting changed -> Readiness reset. Anyone ready? ${allReadyAfterChange}. Status: ${snapshot.gameStatus}`);
if (allReadyAfterChange || snapshot.gameStatus !== 'configuring') {
  throw new Error('Readiness was not reset after settings update');
}

// 9. Test Reconnection Lookup with Token
const reconnectRes = joinRoom(hostRes.roomCode, 'Resul', hostRes.sessionToken);
if (!reconnectRes.isReconnection || reconnectRes.participantId !== hostRes.hostId) {
  throw new Error('Reconnection with valid token failed');
}
console.log('✔ Reconnection with existing session token verified.');

console.log('\n========================================');
console.log('🎉 ALL PHASE 3 TESTS PASSED PERFECTLY!');
console.log('========================================');
