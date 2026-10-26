/**
 * Direct port of humanize_engine.py post-processing (_strip_rewrite_preamble, _clean_prose)
 * plus client-side intelligent rule-based humanizer.
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
  [/\byou will\b/gi, "you'll"],
  [/\byou have\b/gi, "you've"],
  [/\bthey will\b/gi, "they'll"],
  [/\bwe will\b/gi, "we'll"]
];

export function cleanProse(chunk: string): string {
  // Normalize smart quotes, dashes, non-breaking spaces
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
  // Strip code block wrap if the entire output was wrapped in one markdown codeblock
  const codeBlockMatch = out.match(/^```[\w+-]*\n([\s\S]*?)\n?```$/);
  if (codeBlockMatch && !codeBlockMatch[1].includes('```')) {
    out = codeBlockMatch[1].trim();
  }

  out = out.replace(PREAMBLE_REGEX, '');
  out = out.replace(POSTAMBLE_REGEX, '');

  // Strip leading/trailing quote marks if the whole answer was enclosed
  if (
    out.length > 1 &&
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith("'") && out.endsWith("'"))
  ) {
    if ((out.match(new RegExp(`\\${out[0]}`, 'g')) || []).length === 2) {
      out = out.slice(1, -1);
    }
  }

  // Preserve fenced code while cleaning prose
  const parts = out.split('```');
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = cleanProse(parts[i]);
  }

  return parts.join('```').trim();
}

/**
 * Fast client-side smart humanizer for immediate zero-latency rewriting
 * and offline/no-key usage. Applies contractions, replaces cliches,
 * splits run-ons under 130 chars, and ensures senior dev tone.
 */
export function ruleBasedHumanize(
  text: string,
  strength: 'subtle' | 'standard' | 'strong' = 'standard'
): string {
  if (!text || !text.trim()) return '';

  let processed = stripRewritePreamble(text);

  // Preserve code blocks during transformation
  const codeBlocks: string[] = [];
  processed = processed.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 1. Apply Natural Contractions
  for (const [regex, replacement] of CONTRACTION_REPLACEMENTS) {
    processed = processed.replace(regex, replacement);
  }

  // 2. Remove / Replace AI Clichés
  for (const item of AI_CLICHES) {
    const reg = new RegExp(`\\b${item.phrase}\\b`, 'gi');
    if (strength === 'subtle') {
      // Subtle: just replace direct robotic terms
      if (['furthermore', 'in conclusion', "it's important to note", 'delve into', 'delve', 'leverage'].includes(item.phrase)) {
        const replacement = item.replacement.split('/')[0].trim();
        processed = processed.replace(reg, replacement);
      }
    } else {
      // Standard & Strong: replace all clichés with idiomatic phrasing
      const choices = item.replacement.split('/').map((s) => s.trim());
      const chosen = choices[Math.floor(Math.random() * choices.length)];
      processed = processed.replace(reg, chosen);
    }
  }

  // 3. Sentence Length Cap (< 130 chars)
  // Split long sentences at semicolon or coordinating conjunctions (and, but, because)
  const lines = processed.split('\n');
  const transformedLines = lines.map((line) => {
    if (line.startsWith('__CODE_BLOCK_') || line.trim().startsWith('#') || line.trim().length <= 130) {
      return line;
    }

    // Split at semicolons
    let modified = line.replace(/;\s+/g, '. ');

    // If still long, break at conjunctions like " and ", " but "
    if (modified.length > 130 && strength !== 'subtle') {
      modified = modified.replace(/,\s+which\s+/g, '. That ');
      modified = modified.replace(/,\s+and\s+/g, '. And ');
      modified = modified.replace(/,\s+so\s+that\s+/g, '. So ');
      modified = modified.replace(/\s+in\s+order\s+to\s+/g, ' to ');
    }

    return modified;
  });

  processed = transformedLines.join('\n');

  // Restore code blocks
  processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => {
    return codeBlocks[parseInt(idx, 10)] || '';
  });

  return stripRewritePreamble(processed);
}
