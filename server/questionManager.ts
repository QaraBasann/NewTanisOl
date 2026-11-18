import { db } from './db.js';
import { CATEGORIES } from './categories.js';
import { 
  normalizeAzerbaijaniText, 
  computeSimilarityHash, 
  extractNgrams, 
  checkQuestionDeduplication 
} from './questionDeduplication.js';
import { generateGeminiQuestionsBatch } from './geminiService.js';
import { generateId } from './session.js';
import { seedQuestionsDatabase } from './seedQuestions.js';

export interface PreparedQuestion {
  id: string;
  order: number;
  text: string;
  category: string;
  source: string;
}

// Ensure seed database is populated on start
seedQuestionsDatabase();

export async function prepareQuestionsForGame(
  gameId: string,
  roomId: string,
  category: string,
  questionCount: number
): Promise<PreparedQuestion[]> {
  // Check if questions are already assigned for this game (idempotency, e.g. refresh during generating)
  const existingGameQuestions = db.prepare(`
    SELECT q.id, gq.question_order as "order", q.question_text as "text", q.category, q.source
    FROM game_questions gq
    JOIN questions q ON q.id = gq.question_id
    WHERE gq.game_id = ?
    ORDER BY gq.question_order ASC
  `).all(gameId) as PreparedQuestion[];

  if (existingGameQuestions.length === questionCount) {
    return existingGameQuestions;
  }

  // 1. Determine Category or Random mix
  const isRandom = category === 'random';
  const categoryConfig = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  // 2. Fetch questions from DB that have NOT been used in this room
  // (PRD 6.2: "bu otaq iştirakçılarının və otağın daha əvvəl görmədiyi suallar götürülür")
  const categoryCondition = isRandom ? "1=1" : "q.category = ?";
  const categoryParam = isRandom ? [] : [category];

  const candidateQuestions = db.prepare(`
    SELECT q.id, q.question_text, q.category, q.source, q.times_used
    FROM questions q
    WHERE ${categoryCondition}
      AND q.id NOT IN (
        SELECT gq2.question_id
        FROM game_questions gq2
        JOIN games g2 ON g2.id = gq2.game_id
        WHERE g2.room_id = ?
      )
    ORDER BY q.times_used ASC, RANDOM()
    LIMIT ?
  `).all(...categoryParam, roomId, questionCount) as any[];

  const selectedQuestionIds: string[] = candidateQuestions.map(q => q.id);

  // 3. If missing questions, call Gemini for the deficit + 25% buffer
  const missingCount = questionCount - selectedQuestionIds.length;
  if (missingCount > 0) {
    const bufferCount = Math.max(2, Math.ceil(missingCount * 1.25));

    // Get recent 15 topics to avoid
    const recentTopics = db.prepare(`
      SELECT topic_tags FROM questions 
      WHERE ${categoryCondition} 
      ORDER BY created_at DESC LIMIT 15
    `).all(...categoryParam) as any[];

    const avoidList: string[] = [];
    for (const rt of recentTopics) {
      if (rt.topic_tags) {
        try {
          avoidList.push(...JSON.parse(rt.topic_tags));
        } catch {}
      }
    }

    const geminiRes = await generateGeminiQuestionsBatch(
      categoryConfig.name,
      categoryConfig.description,
      bufferCount,
      Array.from(new Set(avoidList))
    );

    if (geminiRes.success && geminiRes.questions.length > 0) {
      db.exec('BEGIN TRANSACTION;');
      try {
        for (const gq of geminiRes.questions) {
          if (selectedQuestionIds.length >= questionCount) break;

          // Three-level deduplication filter (PRD 6.3)
          const dedup = checkQuestionDeduplication(gq.question, gq.topic_tags, category, roomId);
          if (!dedup.isDuplicate) {
            const norm = normalizeAzerbaijaniText(gq.question);
            const hash = computeSimilarityHash(norm);
            const ngrams = Array.from(extractNgrams(gq.question, 3));
            const newQId = 'gemini_' + hash.substring(0, 16);

            // Save new question into DB
            db.prepare(`
              INSERT INTO questions (
                id, category, question_text, normalized_text, similarity_hash, topic_tags, ngram_signature, source, created_at, times_used
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 'gemini', ?, 1)
            `).run(
              newQId,
              isRandom ? 'deep_thoughtful' : category,
              gq.question,
              norm,
              hash,
              JSON.stringify(gq.topic_tags),
              JSON.stringify(ngrams),
              Date.now()
            );

            selectedQuestionIds.push(newQId);
          }
        }
        db.exec('COMMIT;');
      } catch (err) {
        db.exec('ROLLBACK;');
        console.error('Error inserting Gemini questions:', err);
      }
    }
  }

  // 4. If still missing, fill with any available seed questions (even if previously seen in room, least used first)
  if (selectedQuestionIds.length < questionCount) {
    const remainingNeed = questionCount - selectedQuestionIds.length;
    const placeholders = selectedQuestionIds.length > 0 ? selectedQuestionIds.map(() => '?').join(',') : "''";
    
    const fallbackQuestions = db.prepare(`
      SELECT id FROM questions
      WHERE ${categoryCondition} AND id NOT IN (${placeholders})
      ORDER BY times_used ASC, RANDOM()
      LIMIT ?
    `).all(...categoryParam, ...selectedQuestionIds, remainingNeed) as any[];

    for (const f of fallbackQuestions) {
      selectedQuestionIds.push(f.id);
    }
  }

  // 5. Link questions to game_questions with question_order (PRD Section 12)
  db.exec('BEGIN TRANSACTION;');
  try {
    // Clear any partial links
    db.prepare('DELETE FROM game_questions WHERE game_id = ?').run(gameId);

    const insertGQ = db.prepare(`
      INSERT INTO game_questions (id, game_id, question_id, question_order)
      VALUES (?, ?, ?, ?)
    `);

    const updateTimesUsed = db.prepare(`
      UPDATE questions SET times_used = times_used + 1 WHERE id = ?
    `);

    for (let order = 0; order < selectedQuestionIds.length; order++) {
      const qId = selectedQuestionIds[order];
      const gqId = `${gameId}_q${order}`;
      insertGQ.run(gqId, gameId, qId, order);
      updateTimesUsed.run(qId);
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  // Retrieve and return full prepared list
  return db.prepare(`
    SELECT q.id, gq.question_order as "order", q.question_text as "text", q.category, q.source
    FROM game_questions gq
    JOIN questions q ON q.id = gq.question_id
    WHERE gq.game_id = ?
    ORDER BY gq.question_order ASC
  `).all(gameId) as PreparedQuestion[];
}
