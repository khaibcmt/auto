/**
 * Direct port of humanize_engine.py post-processing (_strip_rewrite_preamble, _clean_prose)
 * plus multi-pass client-side humanizer engine for static deployments (e.g., GitHub Pages)
 * and instant zero-latency rewriting.
 */

import { AI_CLICHES } from '../data/proseRules';

const PREAMBLE_REGEX = /^\s*(?:(?:certainly|sure|absolutely|of course|okay|ok|here(?:'|’)s|here is|here are)\b[^\n]*?:\s*\n+|(?:rewritten(?: text| version)?|rewrite|humanized(?: text| version)?)\s*:\s*)/i;
const POSTAMBLE_REGEX = /\n+\s*(?:let me know|i hope this|feel free to|hope this helps)[^\n]*\s*$/i;

const CONTRACTION_REPLACEMENTS: [RegExp, string][] = [
  [/\bdo not\b/gi, "don't"],
  [/\bdoes not\b/gi, "doesn't"],
  [/\bdid not\b/gi, "didn't"],
  [/\bcannot\b/gi, "can't"],
  [/\bcan not\b/gi, "can't"],
  [/\bcould not\b/gi, "couldn't"],
  [/\bwould not\b/gi, "wouldn't"],
  [/\bshould not\b/gi, "shouldn't"],
  [/\bwill not\b/gi, "won't"],
  [/\bis not\b/gi, "isn't"],
  [/\bare not\b/gi, "aren't"],
  [/\bwas not\b/gi, "wasn't"],
  [/\bwere not\b/gi, "weren't"],
  [/\bhave not\b/gi, "haven't"],
  [/\bhas not\b/gi, "hasn't"],
  [/\bhad not\b/gi, "hadn't"],
  [/\bit is\b/gi, "it's"],
  [/\bthat is\b/gi, "that's"],
  [/\bthere is\b/gi, "there's"],
  [/\bwhat is\b/gi, "what's"],
  [/\bI would\b/gi, "I'd"],
  [/\bI will\b/gi, "I'll"],
  [/\bI have\b/gi, "I've"],
  [/\bI am\b/gi, "I'm"],
  [/\byou are\b/gi, "you're"],
  [/\byou will\b/gi, "you'll"],
  [/\byou have\b/gi, "you've"],
  [/\bthey are\b/gi, "they're"],
  [/\bthey will\b/gi, "they'll"],
  [/\bwe are\b/gi, "we're"],
  [/\bwe will\b/gi, "we'll"]
];

const SENIOR_PHRASE_TRANSFORMS: [RegExp, string][] = [
  [/\bIn order to\b/g, 'To'],
  [/\bin order to\b/g, 'to'],
  [/\bDue to the fact that\b/g, 'Because'],
  [/\bdue to the fact that\b/g, 'because'],
  [/\bAt the end of the day,\s*/gi, ''],
  [/\bIt is worth noting that\s*/gi, 'Note that '],
  [/\bIt's worth noting that\s*/gi, 'Note that '],
  [/\bIt is important to remember that\s*/gi, 'Remember: '],
  [/\butilize\b/gi, 'use'],
  [/\butilizing\b/gi, 'using'],
  [/\bfacilitate\b/gi, 'help'],
  [/\bsubsequently\b/gi, 'then'],
  [/\bnevertheless\b/gi, 'still'],
  [/\bconsequently\b/gi, 'so'],
  [/\bmoreover\b/gi, 'also'],
  [/\badditionally\b/gi, 'plus']
];

export function cleanProse(chunk: string): string {
  let text = chunk
    .replace(/[               　]/g, ' ')
    .replace(/[​‌‍⁠﻿­]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/−/g, '-');

  // Em dashes -> comma or period
  text = text.replace(/\s*—\s*/g, ', ');
  // Numeric range en-dash
  text = text.replace(/(\d)\s*–\s*(\d)/g, '$1-$2');
  // General en-dash
  text = text.replace(/\s*–\s*/g, ' - ');
  // Strip artificial bolding from markdown prose
  text = text.replace(/\*\*(.+?)\*\*|__(.+?)__/g, '$1$2');

  return text;
}

export function stripRewritePreamble(text: string): string {
  let out = text.trim();
  const codeBlockMatch = out.match(/^```[\w+-]*\n([\s\S]*?)\n?```$/);
  if (codeBlockMatch && !codeBlockMatch[1].includes('```')) {
    out = codeBlockMatch[1].trim();
  }

  out = out.replace(PREAMBLE_REGEX, '');
  out = out.replace(POSTAMBLE_REGEX, '');

  if (
    out.length > 1 &&
    ((out.startsWith('"') && out.endsWith('"')) ||
      (out.startsWith("'") && out.endsWith("'")))
  ) {
    if ((out.match(new RegExp(`\\${out[0]}`, 'g')) || []).length === 2) {
      out = out.slice(1, -1);
    }
  }

  const parts = out.split('```');
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = cleanProse(parts[i]);
  }

  return parts.join('```').trim();
}

/**
 * Splits a single sentence that exceeds 130 characters at natural clause boundaries.
 */
function splitLongSentence(sentence: string): string {
  if (sentence.length <= 130) return sentence;

  // 1. Replace semicolons with periods and capitalize next letter
  let current = sentence.replace(/;\s+([a-z])/g, (_, ch) => `. ${ch.toUpperCase()}`);

  // 2. Split at ", which ", ", and ", ", but ", ", so "
  current = current
    .replace(/,\s+which\s+/g, '. That ')
    .replace(/,\s+and\s+/g, '. Also, ')
    .replace(/,\s+but\s+/g, '. However, ')
    .replace(/,\s+so\s+/g, '. So ')
    .replace(/,\s+because\s+/g, '. That is because ');

  return current;
}

/**
 * Multi-pass client-side smart humanizer for immediate zero-latency rewriting
 * and static hosting (GitHub Pages) compatibility.
 */
export function ruleBasedHumanize(
  text: string,
  strength: 'subtle' | 'standard' | 'strong' = 'standard'
): string {
  if (!text || !text.trim()) return '';

  let processed = stripRewritePreamble(text);

  // Preserve code blocks and inline code during transformation
  const codeBlocks: string[] = [];
  processed = processed.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 1. Apply Natural Contractions
  for (const [regex, replacement] of CONTRACTION_REPLACEMENTS) {
    processed = processed.replace(regex, replacement);
  }

  // 2. Apply Senior Engineer Phrase Tightening
  if (strength !== 'subtle') {
    for (const [regex, replacement] of SENIOR_PHRASE_TRANSFORMS) {
      processed = processed.replace(regex, replacement);
    }
  }

  // 3. Remove / Replace AI Clichés
  for (const item of AI_CLICHES) {
    const reg = new RegExp(`\\b${item.phrase}\\b`, 'gi');
    const choices = item.replacement.split('/').map((s) => s.trim());
    const chosen = strength === 'strong' ? choices[choices.length - 1] : choices[0];
    processed = processed.replace(reg, chosen);
  }

  // 4. Enforce Sentence Length Cap (< 130 chars)
  const lines = processed.split('\n');
  const transformedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('__CODE_BLOCK_') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('from ') ||
      trimmed.startsWith('def ') ||
      trimmed.startsWith('for ') ||
      trimmed.startsWith('while ') ||
      trimmed.startsWith('if ') ||
      line.startsWith('    ') ||
      trimmed.length <= 130
    ) {
      return line;
    }

    return splitLongSentence(line);
  });

  processed = transformedLines.join('\n');

  // Restore code blocks
  processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => {
    return codeBlocks[parseInt(idx, 10)] || '';
  });

  return stripRewritePreamble(processed);
}
