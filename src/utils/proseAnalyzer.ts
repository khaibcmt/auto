/**
 * Prose analysis and AI-likeness metric evaluation.
 * Enforces the <130 char sentence cap, flags AI clichés, and checks contractions.
 */

import { AI_CLICHES } from '../data/proseRules';

export interface SentenceAnalysis {
  text: string;
  charCount: number;
  wordCount: number;
  isOverLimit: boolean; // > 130 chars
  clichésFound: string[];
}

export interface ProseReport {
  totalChars: number;
  totalWords: number;
  sentenceCount: number;
  avgSentenceChars: number;
  overLimitSentences: SentenceAnalysis[];
  overLimitCount: number;
  clichéMatches: { phrase: string; count: number; replacement: string }[];
  contractionsFound: string[];
  humanScore: number; // 0 - 100
  aiLikenessScore: number; // 0 - 100
  verdict: 'Human Senior Dev' | 'Natural Human' | 'Borderline AI' | 'Detectable AI';
  verdictColor: string;
  sentences: SentenceAnalysis[];
}

export function analyzeProse(text: string): ProseReport {
  if (!text || !text.trim()) {
    return {
      totalChars: 0,
      totalWords: 0,
      sentenceCount: 0,
      avgSentenceChars: 0,
      overLimitSentences: [],
      overLimitCount: 0,
      clichéMatches: [],
      contractionsFound: [],
      humanScore: 100,
      aiLikenessScore: 0,
      verdict: 'Natural Human',
      verdictColor: 'text-emerald-400',
      sentences: [],
    };
  }

  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const totalChars = clean.length;
  const totalWords = words.length;

  // Split into sentences using punctuation boundaries (. ? !)
  const rawSentences = clean
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('```'));

  const lower = clean.toLowerCase();
  const clichéMatches: { phrase: string; count: number; replacement: string }[] = [];

  for (const item of AI_CLICHES) {
    const regex = new RegExp(`\\b${item.phrase}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      clichéMatches.push({
        phrase: item.phrase,
        count: matches.length,
        replacement: item.replacement,
      });
    }
  }

  const contractionRegex = /\b([a-z]+['’](?:t|s|d|ll|re|ve|m))\b/gi;
  const contractionsFound = Array.from(new Set(clean.match(contractionRegex) || [])).map(c => c.toLowerCase());

  const analyzedSentences: SentenceAnalysis[] = rawSentences.map((s) => {
    const sLower = s.toLowerCase();
    const found: string[] = [];
    for (const c of AI_CLICHES) {
      if (sLower.includes(c.phrase)) {
        found.push(c.phrase);
      }
    }
    return {
      text: s,
      charCount: s.length,
      wordCount: s.split(/\s+/).filter(Boolean).length,
      isOverLimit: s.length > 130,
      clichésFound: found,
    };
  });

  const overLimitSentences = analyzedSentences.filter((s) => s.isOverLimit);
  const overLimitCount = overLimitSentences.length;
  const avgSentenceChars =
    analyzedSentences.length > 0
      ? Math.round(
          analyzedSentences.reduce((acc, s) => acc + s.charCount, 0) /
            analyzedSentences.length
        )
      : 0;

  // Calculate AI Likeness Score (Penalty model)
  let aiPenalty = 0;

  // 1. Cliché penalty (up to 40 pts)
  const totalClichéOccurrences = clichéMatches.reduce((acc, c) => acc + c.count, 0);
  aiPenalty += Math.min(totalClichéOccurrences * 12, 40);

  // 2. Over-length sentence penalty (up to 30 pts)
  const overRatio = analyzedSentences.length > 0 ? overLimitCount / analyzedSentences.length : 0;
  aiPenalty += Math.min(Math.round(overRatio * 50), 30);

  // 3. Lack of contractions penalty (up to 15 pts)
  if (totalWords > 80 && contractionsFound.length === 0) {
    aiPenalty += 15;
  } else if (totalWords > 150 && contractionsFound.length < 2) {
    aiPenalty += 8;
  }

  // 4. Em dash overuse penalty (AI loves —)
  const emDashCount = (clean.match(/—|--/g) || []).length;
  if (emDashCount >= 3) {
    aiPenalty += Math.min(emDashCount * 4, 15);
  }

  const aiLikenessScore = Math.min(Math.max(aiPenalty, 0), 100);
  const humanScore = 100 - aiLikenessScore;

  let verdict: 'Human Senior Dev' | 'Natural Human' | 'Borderline AI' | 'Detectable AI';
  let verdictColor = 'text-emerald-400';

  if (humanScore >= 88) {
    verdict = 'Human Senior Dev';
    verdictColor = 'text-emerald-400';
  } else if (humanScore >= 70) {
    verdict = 'Natural Human';
    verdictColor = 'text-sky-400';
  } else if (humanScore >= 45) {
    verdict = 'Borderline AI';
    verdictColor = 'text-amber-400';
  } else {
    verdict = 'Detectable AI';
    verdictColor = 'text-rose-400';
  }

  return {
    totalChars,
    totalWords,
    sentenceCount: analyzedSentences.length,
    avgSentenceChars,
    overLimitSentences,
    overLimitCount,
    clichéMatches,
    contractionsFound,
    humanScore,
    aiLikenessScore,
    verdict,
    verdictColor,
    sentences: analyzedSentences,
  };
}
