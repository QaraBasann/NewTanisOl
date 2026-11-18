import crypto from 'crypto';
import { db } from './db.js';

// Normalizes Azerbaijani text: converts to lowercase, replaces accented chars, removes punctuation & extra whitespace
export function normalizeAzerbaijaniText(text: string): string {
  if (!text) return '';

  let normalized = text
    // Replace uppercase Azerbaijani letters explicitly before toLowerCase to avoid locale unicode combining dot
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ə/g, 'ə')
    .replace(/Ö/g, 'ö')
    .replace(/Ü/g, 'ü')
    .replace(/Ş/g, 'ş')
    .replace(/Ç/g, 'ç')
    .replace(/Ğ/g, 'ğ')
    .toLowerCase()
    .trim()
    // Specific Azerbaijani characters mapping for phonetic similarity
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Remove punctuation, special characters and collapse whitespaces
  normalized = normalized.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized;
}

// Level 1: Deterministic SHA-256 hash of normalized text
export function computeSimilarityHash(normalizedText: string): string {
  return crypto.createHash('sha256').update(normalizedText).digest('hex');
}

// Generate N-grams (character or token level, default 3-gram character shingles)
export function extractNgrams(text: string, n = 3): Set<string> {
  const norm = normalizeAzerbaijaniText(text).replace(/\s+/g, '');
  const ngrams = new Set<string>();
  if (norm.length < n) {
    ngrams.add(norm);
    return ngrams;
  }
  for (let i = 0; i <= norm.length - n; i++) {
    ngrams.add(norm.substring(i, i + n));
  }
  return ngrams;
}

// Jaccard similarity index between two sets
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  level?: 1 | 2 | 3;
  reason?: string;
  matchedQuestionId?: string;
}

// Extract word tokens
export function extractWords(text: string): Set<string> {
  const norm = normalizeAzerbaijaniText(text);
  const words = norm.split(/\s+/).filter(w => w.length > 1);
  return new Set(words);
}

// Configurable similarity threshold (PRD Section 17)
const DEFAULT_SIMILARITY_THRESHOLD = 0.55;

export function checkQuestionDeduplication(
  questionText: string,
  topicTags: string[] = [],
  category: string,
  roomId?: string
): DeduplicationResult {
  const normalized = normalizeAzerbaijaniText(questionText);
  if (!normalized || normalized.length < 5) {
    return { isDuplicate: true, reason: 'Sual mətni həddindən artıq qısadır və ya boşdur' };
  }

  const hash = computeSimilarityHash(normalized);

  // LEVEL 1: Exact Normalized Match across entire platform
  const exactMatch = db.prepare('SELECT id, question_text FROM questions WHERE similarity_hash = ? LIMIT 1').get(hash) as any;
  if (exactMatch) {
    return {
      isDuplicate: true,
      level: 1,
      reason: `Dəqiq təkrar tapıldı (Level 1 Hash): "${exactMatch.question_text}"`,
      matchedQuestionId: exactMatch.id
    };
  }

  // LEVEL 2: N-gram, Word Overlap & Topic Overlap within Category
  const threshold = process.env.SIMILARITY_THRESHOLD 
    ? parseFloat(process.env.SIMILARITY_THRESHOLD) 
    : DEFAULT_SIMILARITY_THRESHOLD;

  const targetNgrams = extractNgrams(questionText, 3);
  const targetWords = extractWords(questionText);
  const targetTagSet = new Set(topicTags.map(t => normalizeAzerbaijaniText(t)));

  // Retrieve questions from the same category to inspect similarity
  const existingQuestions = db.prepare(`
    SELECT id, question_text, topic_tags, ngram_signature
    FROM questions 
    WHERE category = ?
    ORDER BY created_at DESC
    LIMIT 300
  `).all(category) as any[];

  for (const eq of existingQuestions) {
    let eqNgrams: Set<string>;
    if (eq.ngram_signature) {
      try {
        eqNgrams = new Set(JSON.parse(eq.ngram_signature));
      } catch {
        eqNgrams = extractNgrams(eq.question_text, 3);
      }
    } else {
      eqNgrams = extractNgrams(eq.question_text, 3);
    }

    const ngramSim = calculateJaccardSimilarity(targetNgrams, eqNgrams);
    const wordSim = calculateJaccardSimilarity(targetWords, extractWords(eq.question_text));
    const combinedSim = Math.max(ngramSim, wordSim);

    // Topic intersection
    let topicOverlap = 0;
    if (eq.topic_tags) {
      try {
        const eqTags = JSON.parse(eq.topic_tags) as string[];
        for (const t of eqTags) {
          if (targetTagSet.has(normalizeAzerbaijaniText(t))) {
            topicOverlap++;
          }
        }
      } catch {
        // ignore parse error
      }
    }

    // If similarity exceeds threshold, or moderate similarity with topic overlap
    if (combinedSim >= threshold || (combinedSim >= 0.45 && topicOverlap >= 1)) {
      return {
        isDuplicate: true,
        level: 2,
        reason: `Məna / n-gram oxşarlığı tapıldı (Level 2: ${(combinedSim * 100).toFixed(1)}%): "${eq.question_text}"`,
        matchedQuestionId: eq.id
      };
    }
  }

  // Check room history (PRD 6.3: "Bir otaqda eyni sual ikinci dəfə göstərilməməlidir")
  if (roomId) {
    const roomUsed = db.prepare(`
      SELECT q.id, q.question_text
      FROM game_questions gq
      JOIN games g ON g.id = gq.game_id
      JOIN questions q ON q.id = gq.question_id
      WHERE g.room_id = ? AND q.similarity_hash = ?
      LIMIT 1
    `).get(roomId, hash) as any;

    if (roomUsed) {
      return {
        isDuplicate: true,
        level: 1,
        reason: `Bu sual artıq bu otaqda daha əvvəlki oyunlarda istifadə olunub`,
        matchedQuestionId: roomUsed.id
      };
    }
  }

  // Not a duplicate
  return { isDuplicate: false };
}
