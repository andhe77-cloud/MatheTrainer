// Pure WebAudio synthesizer for gentle wooden marimba, chest creaks, chimes, and celebratory fanfares

class SoundEngine {
  private ctx: AudioContext | null = null;
  private effectsEnabled = true;

  setEffectsEnabled(enabled: boolean): void {
    this.effectsEnabled = enabled;
  }

  private getContext(): AudioContext | null {
    try {
      if (!this.effectsEnabled || typeof window === 'undefined') return null;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType,
    gainPeak: number,
    delaySec = 0,
    endFreq?: number
  ): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq && endFreq > 0) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + durationSec);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainPeak), now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec + 0.025);
    } catch {
      // Ignore WebAudio errors on restricted mobile browsers
    }
  }

  playBlockTap(): void {
    this.playTone(420, 0.06, 'triangle', 0.08);
  }

  playUiClick(): void {
    this.playTone(560, 0.045, 'sine', 0.055);
  }

  playCoinClink(): void {
    this.playTone(1318.5, 0.09, 'sine', 0.075, 0);
    this.playTone(1760.0, 0.16, 'sine', 0.085, 0.055);
  }

  playHopTone(stepIndex: number): void {
    // Rising C major scale for hop steps
    const scaleHz = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
    const freq = scaleHz[Math.max(0, stepIndex) % scaleHz.length];
    this.playTone(freq, 0.14, 'sine', 0.12);
  }

  playSuccessChime(): void {
    this.playTone(523.25, 0.14, 'triangle', 0.1, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.1, 0.09);
    this.playTone(783.99, 0.24, 'triangle', 0.12, 0.18);
  }

  playLevelFanfare(stars = 3): void {
    // Warm celebratory marimba/brass-style fanfare for level completion
    this.playTone(523.25, 0.14, 'triangle', 0.11, 0);      // C5
    this.playTone(659.25, 0.14, 'triangle', 0.11, 0.10);   // E5
    this.playTone(783.99, 0.14, 'triangle', 0.12, 0.20);   // G5
    this.playTone(1046.5, 0.34, 'triangle', 0.14, 0.31);   // C6
    this.playTone(523.25, 0.34, 'sine', 0.08, 0.31);       // Octave bass warmth
    if (stars >= 2) {
      this.playTone(1318.51, 0.28, 'sine', 0.08, 0.44);    // E6 shimmer
    }
    if (stars >= 3) {
      this.playTone(1567.98, 0.36, 'sine', 0.09, 0.56);    // G6 crown sparkle
    }
  }

  playHmTone(): void {
    // Gentle low-mid wooden tap, never harsh
    this.playTone(293.66, 0.12, 'sine', 0.08, 0);
    this.playTone(261.63, 0.16, 'sine', 0.07, 0.08);
  }

  playChestCreak(): void {
    // Suspenseful wooden creak sequence while chest wobbles before opening
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const creaks: Array<[number, number, number, number]> = [
        [0.05, 195, 152, 0.22],
        [0.36, 170, 218, 0.18],
        [0.68, 225, 165, 0.24],
        [1.02, 185, 250, 0.20],
      ];
      for (const [delay, fStart, fEnd, dur] of creaks) {
        const now = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(fStart, now);
        osc.frequency.exponentialRampToValueAtTime(fEnd, now + dur);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(520, now);
        filter.Q.setValueAtTime(4.5, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.065, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.03);
      }
      // Two gentle wooden thumps matching wobble rhythm
      this.playTone(115, 0.07, 'triangle', 0.06, 0.22, 85);
      this.playTone(125, 0.07, 'triangle', 0.065, 0.85, 92);
    } catch {
      // Ignore WebAudio errors
    }
  }

  playChestPop(): void {
    // Latch pop + rising celebratory chime
    this.playTone(220, 0.09, 'triangle', 0.12, 0, 480);
    this.playTone(392.0, 0.12, 'triangle', 0.09, 0.06);
    this.playTone(523.25, 0.14, 'triangle', 0.1, 0.14);
    this.playTone(783.99, 0.22, 'sine', 0.13, 0.22);
    this.playTone(1046.5, 0.30, 'sine', 0.11, 0.31);
  }

  playPuzzlePieceChime(completedNow = false): void {
    this.playTone(783.99, 0.12, 'sine', 0.08, 0);
    this.playTone(987.77, 0.14, 'sine', 0.085, 0.08);
    this.playTone(1174.66, 0.22, 'sine', 0.095, 0.16);
    if (completedNow) {
      this.playTone(1567.98, 0.35, 'triangle', 0.1, 0.26);
    }
  }
}

export const soundEngine = new SoundEngine();
