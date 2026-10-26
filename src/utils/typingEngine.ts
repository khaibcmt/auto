/**
 * Accurate port and expansion of human_type.py for browser interactive typing simulation.
 * Includes QWERTY neighbor typos, realistic Gaussian timing, micro-pauses, burst mode, and sound triggers.
 */

import { soundSynth } from './audioSynth';

export const QWERTY_NEIGHBORS: Record<string, string> = {
  a: 'qwsz',
  b: 'vghn',
  c: 'xdfv',
  d: 'serfcx',
  e: 'wsdr',
  f: 'drtgvc',
  g: 'ftyhbv',
  h: 'gyujnb',
  i: 'ujko',
  j: 'huikmn',
  k: 'jiolm',
  l: 'kop',
  m: 'njk',
  n: 'bhjm',
  o: 'iklp',
  p: 'ol',
  q: 'wa',
  r: 'edft',
  s: 'awedxz',
  t: 'rfgy',
  u: 'yhji',
  v: 'cfgb',
  w: 'qase',
  x: 'zsdc',
  y: 'tghu',
  z: 'asx',
};

const PUNCT_CHARS = new Set(['.', ',', '!', '?', ';', ':']);

export interface TypingConfig {
  delayMin: number; // e.g. 0.10s
  delayMax: number; // e.g. 0.15s
  fixedDelay?: number; // e.g. 0.12s for robot mode
  isHuman: boolean;
  typoRate: number; // 0 to 1, default 0.025 (2.5%)
  playAudio: boolean;
  hotkeyWait: number; // countdown before typing in seconds
}

export interface TypingStats {
  typedChars: number;
  totalChars: number;
  typoCount: number;
  startTime: number | null;
  wpm: number;
  currentDelayMs: number;
  isBursting: boolean;
  isPaused: boolean;
  isFinished: boolean;
}

export type TypingCallback = (state: {
  currentText: string;
  char: string;
  isTypo: boolean;
  isBackspace: boolean;
  stats: TypingStats;
}) => void;

function randomGauss(mean: number, stdev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdev + mean;
}

function randomUniform(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clampDelay(seconds: number, minimum: number = 0.025): number {
  return Math.max(minimum, seconds);
}

export function getTypoChar(ch: string): string | null {
  const lower = ch.toLowerCase();
  const neighbors = QWERTY_NEIGHBORS[lower];
  if (!neighbors) return null;
  const wrong = neighbors[Math.floor(Math.random() * neighbors.length)];
  return ch === ch.toUpperCase() && ch !== lower ? wrong.toUpperCase() : wrong;
}

export class TypingSimulator {
  private abortRequested: boolean = false;
  private paused: boolean = false;
  private resolvePause: (() => void) | null = null;

  public stop() {
    this.abortRequested = true;
    if (this.resolvePause) {
      this.resolvePause();
      this.resolvePause = null;
    }
  }

  public pause() {
    this.paused = true;
  }

  public resume() {
    this.paused = false;
    if (this.resolvePause) {
      this.resolvePause();
      this.resolvePause = null;
    }
  }

  private async sleep(ms: number): Promise<void> {
    if (this.abortRequested) return;
    if (this.paused) {
      await new Promise<void>((resolve) => {
        this.resolvePause = resolve;
      });
    }
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }

  public async run(
    targetText: string,
    config: TypingConfig,
    onUpdate: TypingCallback,
    onDone: () => void
  ) {
    this.abortRequested = false;
    this.paused = false;

    let currentText = '';
    let keysSinceBreak = 0;
    let burstLeft = 0;
    let typoCount = 0;
    const startTime = Date.now();

    const lo = Math.min(config.delayMin, config.delayMax);
    const hi = Math.max(config.delayMin, config.delayMax);

    const updateStats = (
      char: string,
      isTypo: boolean,
      isBackspace: boolean,
      delayMs: number
    ) => {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const words = currentText.length / 5;
      const wpm = elapsedMinutes > 0.01 ? Math.round(words / elapsedMinutes) : 0;

      onUpdate({
        currentText,
        char,
        isTypo,
        isBackspace,
        stats: {
          typedChars: currentText.length,
          totalChars: targetText.length,
          typoCount,
          startTime,
          wpm,
          currentDelayMs: Math.round(delayMs),
          isBursting: burstLeft > 0,
          isPaused: this.paused,
          isFinished: false,
        },
      });
    };

    for (let i = 0; i < targetText.length; i++) {
      if (this.abortRequested) break;

      const ch = targetText[i];
      if (ch.charCodeAt(0) < 32 && ch !== '\n' && ch !== '\t') {
        continue;
      }

      if (!config.isHuman) {
        // Robot mode: flat metronomic delay
        currentText += ch;
        if (config.playAudio) soundSynth.playKeyClick(ch);
        const delayMs = (config.fixedDelay ?? 0.12) * 1000;
        updateStats(ch, false, false, delayMs);
        await this.sleep(delayMs);
        continue;
      }

      // Human mode:
      const base = hi > lo ? randomUniform(lo, hi) : lo;

      // Check if typo happens
      const isAlpha = /[a-zA-Z]/.test(ch);
      if (isAlpha && Math.random() < config.typoRate) {
        const wrongChar = getTypoChar(ch);
        if (wrongChar) {
          typoCount++;
          // 1. Type wrong character
          currentText += wrongChar;
          if (config.playAudio) soundSynth.playKeyClick(wrongChar);
          const typoDelayMs = clampDelay(randomUniform(base * 2, base * 5)) * 1000;
          updateStats(wrongChar, true, false, typoDelayMs);
          await this.sleep(typoDelayMs);

          if (this.abortRequested) break;

          // 2. Realize mistake and hit backspace
          currentText = currentText.slice(0, -1);
          if (config.playAudio) soundSynth.playKeyClick('Backspace');
          const backspaceDelayMs = clampDelay(randomUniform(base * 0.8, base * 2)) * 1000;
          updateStats('⌫', false, true, backspaceDelayMs);
          await this.sleep(backspaceDelayMs);

          if (this.abortRequested) break;
        }
      }

      // Type the intended character
      currentText += ch;
      if (config.playAudio) soundSynth.playKeyClick(ch);

      keysSinceBreak++;
      if (burstLeft <= 0 && /[a-zA-Z0-9]/.test(ch) && Math.random() < 0.12) {
        burstLeft = Math.floor(randomUniform(3, 8)); // 3 to 7 chars
      }

      // Calculate micro-pause based on punctuation & structure
      let pauseDelaySec: number;
      if (ch === '\n') {
        pauseDelaySec = randomUniform(base * 4.0, base * 10.0);
        burstLeft = 0;
      } else if (ch === ' ') {
        pauseDelaySec = randomGauss(base * 1.35, base * 0.4);
      } else if (PUNCT_CHARS.has(ch)) {
        pauseDelaySec = randomUniform(base * 2.5, base * 6.0);
      } else if (burstLeft > 0) {
        pauseDelaySec = randomGauss(base * 0.75, base * 0.25);
        burstLeft--;
      } else {
        pauseDelaySec = randomGauss(base, base * 0.35);
      }

      // Occasional random thinking hesitation (2.2% chance)
      if (keysSinceBreak > 0 && Math.random() < 0.022) {
        pauseDelaySec += randomUniform(0.4, 1.8);
      }

      // Hesitation before long words (>= 8 characters)
      if (ch === ' ') {
        let j = i + 1;
        while (j < targetText.length && targetText[j] === ' ') j++;
        let wordLen = 0;
        while (j + wordLen < targetText.length && /[a-zA-Z]/.test(targetText[j + wordLen])) {
          wordLen++;
        }
        if (wordLen >= 8 && Math.random() < 0.4) {
          pauseDelaySec += randomUniform(base * 2, base * 6);
        }
      }

      const totalDelayMs = clampDelay(pauseDelaySec) * 1000;
      updateStats(ch, false, false, totalDelayMs);
      await this.sleep(totalDelayMs);
    }

    onDone();
  }
}
