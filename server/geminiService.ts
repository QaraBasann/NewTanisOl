import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';

export interface GeneratedQuestionItem {
  question: string;
  topic_tags: string[];
}

export interface GeminiBatchResult {
  success: boolean;
  questions: GeneratedQuestionItem[];
  tokensIn?: number;
  tokensOut?: number;
  error?: string;
}

const DEFAULT_DAILY_LIMIT = 100;
const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_MAX_TOKENS = 1500;

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Ensure today's row in api_usage exists
function trackApiUsage(reqDelta: number, inTokens: number, outTokens: number, errors: number, rateLimits: number) {
  const today = getTodayString();
  const id = 'usage_' + today;

  db.prepare(`
    INSERT INTO api_usage (id, date, request_count, tokens_in, tokens_out, error_count, rate_limit_hits)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      request_count = request_count + excluded.request_count,
      tokens_in = tokens_in + excluded.tokens_in,
      tokens_out = tokens_out + excluded.tokens_out,
      error_count = error_count + excluded.error_count,
      rate_limit_hits = rate_limit_hits + excluded.rate_limit_hits
  `).run(id, today, reqDelta, inTokens, outTokens, errors, rateLimits);
}

// Check if daily request limit is reached
export function isDailyLimitReached(): boolean {
  const today = getTodayString();
  const limit = process.env.GEMINI_DAILY_REQUEST_LIMIT 
    ? parseInt(process.env.GEMINI_DAILY_REQUEST_LIMIT, 10) 
    : DEFAULT_DAILY_LIMIT;

  const row = db.prepare('SELECT request_count FROM api_usage WHERE date = ?').get(today) as { request_count: number } | undefined;
  if (row && row.request_count >= limit) {
    return true;
  }
  return false;
}

export async function generateGeminiQuestionsBatch(
  categoryName: string,
  categoryDesc: string,
  countNeeded: number,
  avoidTopics: string[] = []
): Promise<GeminiBatchResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      questions: [],
      error: 'GEMINI_API_KEY mühit dəyişəni təyin olunmayıb. Seed bazası istifadə edilir.'
    };
  }

  if (isDailyLimitReached()) {
    trackApiUsage(0, 0, 0, 0, 1);
    return {
      success: false,
      questions: [],
      error: 'Gündəlik Gemini sorğu limiti çatmışdır. Ehtiyat baza istifadə olunur.'
    };
  }

  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const maxOutputTokens = process.env.GEMINI_MAX_OUTPUT_TOKENS 
    ? parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 10) 
    : DEFAULT_MAX_TOKENS;

  const ai = new GoogleGenAI({ apiKey });

  const avoidText = avoidTopics.length > 0 
    ? `Aşağıdakı mövzulardan və təkrarlardan qaç: ${avoidTopics.slice(0, 15).join(', ')}.`
    : '';

  const prompt = `Sən iki nəfərin bir-birini daha yaxından tanıması üçün "Tanış Ol" platformasının sual redaktorusan.
Kateqoriya: "${categoryName}" (${categoryDesc}).
Tələb olunan sual sayı: ${countNeeded} ədəd.
${avoidText}

Mühüm Qaydalar:
1. Suallar təmiz, təbii, axıcı Azərbaycan dilində olmalıdır (heç bir tərcümə və ya süni hiss olmamalıdır).
2. Hər sual maraqlı, düşündürücü, səmimi olmalı və iki nəfər arasında dərin və ya əyləncəli müzakirə yaratmalıdır.
3. Eyni şablonla başlama ("Sən ... nə edərdin?", "Heç olubmu ki..." kimi təkrarlardan qaç, müxtəlif cümlə quruluşları istifadə et).
4. Məzmun təhlükəsiz və etik olmalıdır (vulqar, təhqiramiz, cinsi açıq, siyasi mövzular yoxdur).
5. Hər sual üçün 2-3 mövzu açar sözü (topic_tags) əlavə et.

Yalnız aşağıdakı JSON formatında cavab qaytar (başqa heç bir mətn yazma):
[
  {
    "question": "Sual mətni",
    "topic_tags": ["açar1", "açar2"]
  }
]`;

  let lastError = '';
  // Maximum 2 attempts with exponential backoff (PRD 6.4)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      trackApiUsage(1, 0, 0, 0, 0);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          maxOutputTokens,
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const questions: GeneratedQuestionItem[] = parsed
          .filter(item => item && typeof item.question === 'string' && item.question.trim().length > 10)
          .map(item => ({
            question: item.question.trim(),
            topic_tags: Array.isArray(item.topic_tags) ? item.topic_tags.map((t: any) => String(t).trim()) : []
          }));

        const inTokens = response.usageMetadata?.promptTokenCount || 0;
        const outTokens = response.usageMetadata?.candidatesTokenCount || 0;
        trackApiUsage(0, inTokens, outTokens, 0, 0);

        return {
          success: true,
          questions,
          tokensIn: inTokens,
          tokensOut: outTokens
        };
      }
    } catch (err: any) {
      lastError = err.message || String(err);
      const isRateLimit = err.status === 429 || lastError.includes('429') || lastError.includes('RESOURCE_EXHAUSTED');
      trackApiUsage(0, 0, 0, 1, isRateLimit ? 1 : 0);

      if (attempt < 2 && !isRateLimit) {
        // Wait 1 second before retry
        await new Promise(res => setTimeout(res, 1000));
      } else {
        break;
      }
    }
  }

  return {
    success: false,
    questions: [],
    error: `Gemini sorğusu uğursuz oldu: ${lastError}`
  };
}
