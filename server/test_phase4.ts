import { initDatabase, db } from './db.js';
import { seedQuestionsDatabase, SEED_QUESTIONS } from './seedQuestions.js';
import { 
  normalizeAzerbaijaniText, 
  computeSimilarityHash, 
  checkQuestionDeduplication 
} from './questionDeduplication.js';
import { prepareQuestionsForGame } from './questionManager.js';
import { createRoom } from './lobbyManager.js';

console.log('--- Testing Phase 4: AI Question System & 3-Level Deduplication ---');

initDatabase();

// 1. Test Seed Questions Database
const count = seedQuestionsDatabase();
console.log(`✔ Seed questions verified: ${count} questions ready in database.`);
if (count < 100) {
  throw new Error('Seed questions count is too low!');
}

// 2. Test Level 1: Normalization and Exact Duplicate Detection
const original = 'Sənin üçün həqiqi dost kimdir və bunu ən çox hansı anda hiss etmisən?';
const slightVariation = '  sənin  üçün HƏQİQİ DOST kimdir, və bunu ən çox hansı anda hiss etmisən?! ';
const norm1 = normalizeAzerbaijaniText(original);
const norm2 = normalizeAzerbaijaniText(slightVariation);

if (norm1 !== norm2) {
  throw new Error(`Normalization mismatch:\n1: ${norm1}\n2: ${norm2}`);
}
console.log('✔ Azerbaijani text normalization verified: punctuation, casing, spacing normalized identically.');

const hash1 = computeSimilarityHash(norm1);
const hash2 = computeSimilarityHash(norm2);
if (hash1 !== hash2) {
  throw new Error('Similarity hash mismatch for normalized text');
}
console.log('✔ Level 1 Hash check verified: hashes match perfectly.');

// Test deduplication detection for exact match
const dedup1 = checkQuestionDeduplication(slightVariation, ['dostluq'], 'friendship');
if (!dedup1.isDuplicate || dedup1.level !== 1) {
  throw new Error(`Expected Level 1 duplicate detection, got: ${JSON.stringify(dedup1)}`);
}
console.log(`✔ Level 1 exact duplicate successfully blocked: ${dedup1.reason}`);

// 3. Test Level 2: 3-Gram & Token Similarity Detection for Reworded Question
// Original in seed: "Özünü ən çox nə vaxt azad və özün kimi hiss edirsən?"
const rewordedQuestion = 'Özünü ən çox hansı vaxt azad və özün kimi hiss etmisən?';
const dedup2 = checkQuestionDeduplication(rewordedQuestion, ['azadlıq'], 'deep_thoughtful');
if (!dedup2.isDuplicate) {
  throw new Error('Expected Level 2 near-duplicate detection to catch reworded question!');
}
console.log(`✔ Level 2 near-duplicate successfully caught: ${dedup2.reason}`);

// 4. Test "Database First" Pipeline with Room
const room = createRoom('Resul');
const game1Questions = await prepareQuestionsForGame(room.gameId, room.roomId, 'love', 5);
console.log(`✔ Game 1: 5 questions prepared from database:`);
for (const q of game1Questions) {
  console.log(`   [${q.order + 1}] (${q.source}) ${q.text.substring(0, 50)}...`);
}

if (game1Questions.length !== 5) {
  throw new Error(`Expected 5 questions, got ${game1Questions.length}`);
}

// 5. Test Idempotency (calling again on same game returns identical questions)
const game1QuestionsAgain = await prepareQuestionsForGame(room.gameId, room.roomId, 'love', 5);
if (game1QuestionsAgain[0].id !== game1Questions[0].id || game1QuestionsAgain[4].id !== game1Questions[4].id) {
  throw new Error('Idempotency check failed: questions changed on re-fetch!');
}
console.log('✔ Idempotency check verified: repeat call returned exact same questions.');

// 6. Test Room Exclusion (Game 2 in same room must not repeat Game 1 questions)
const game2Id = 'game_2_' + Date.now();
db.prepare(`
  INSERT INTO games (id, room_id, category, question_count, time_per_question, status, created_at)
  VALUES (?, ?, 'love', 5, 60, 'configuring', ?)
`).run(game2Id, room.roomId, Date.now());

const game2Questions = await prepareQuestionsForGame(game2Id, room.roomId, 'love', 5);
const game1Ids = new Set(game1Questions.map(q => q.id));
for (const q2 of game2Questions) {
  if (game1Ids.has(q2.id)) {
    throw new Error(`Game 2 repeated question from Game 1: ${q2.text}`);
  }
}
console.log('✔ Room exclusion verified: Game 2 received completely distinct questions from Game 1.');

console.log('\n========================================');
console.log('🎉 ALL PHASE 4 TESTS PASSED PERFECTLY!');
console.log('========================================');
