/**
 * Web Audio API procedural mechanical keyboard sound synthesizer.
 * Produces crisp switch clicks, key down/up sounds, spacebar thuds, and backspace clacks.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.35;
  public soundProfile: 'clicky' | 'thocky' | 'silent' = 'clicky';

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playKeyClick(char: string = 'a') {
    if (!this.enabled || this.soundProfile === 'silent') return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Buffer noise for the mechanical contact click
      const bufferSize = ctx.sampleRate * 0.02; // 20ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = ctx.createGain();

      if (char === ' ') {
        // Spacebar: deeper, hollower sound
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.05);

        gain.gain.setValueAtTime(this.volume * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        noiseGain.gain.setValueAtTime(this.volume * 0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      } else if (char === 'Backspace' || char === '\b') {
        // Backspace: sharper dual click
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);

        gain.gain.setValueAtTime(this.volume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        noiseGain.gain.setValueAtTime(this.volume * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      } else if (char === '\n' || char === 'Enter') {
        // Enter key: solid thud
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

        gain.gain.setValueAtTime(this.volume * 0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        noiseGain.gain.setValueAtTime(this.volume * 0.45, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      } else {
        // Standard letter key
        const basePitch = this.soundProfile === 'thocky' ? 260 : 750;
        const pitchVariance = (Math.random() - 0.5) * 80;

        filter.type = this.soundProfile === 'thocky' ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(basePitch + pitchVariance, now);

        osc.frequency.setValueAtTime(basePitch + pitchVariance, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

        gain.gain.setValueAtTime(this.volume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

        noiseGain.gain.setValueAtTime(this.volume * 0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      }

      // Connect graph
      osc.connect(gain);
      gain.connect(ctx.destination);

      noise.connect(noiseGain);
      noiseGain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.08);
      noise.stop(now + 0.08);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }
}

export const soundSynth = new AudioSynthesizer();
