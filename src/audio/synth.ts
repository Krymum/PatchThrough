import type { Cue } from './cues';

/**
 * Every sound in the game is synthesised here with the Web Audio API: no
 * audio files. The audio context is only created after a user gesture, as
 * browsers require, and every failure is silent: sound is a nicety.
 */

const MASTER_VOLUME = 0.5;

interface Voice {
  ctx: AudioContext;
  out: AudioNode;
  at: number;
}

/** A sine or square tone with a short attack and an exponential decay. */
function tone(
  { ctx, out, at }: Voice,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  endFrequency = frequency,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  osc.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

/** A burst of filtered noise: the click of brass on brass. */
function click({ ctx, out, at }: Voice, duration: number, frequency: number, volume: number): void {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(out);
  source.start(at);
}

const PLAYERS: Record<Cue, (voice: Voice) => void> = {
  // Two short strokes of a small bell.
  ring: (v) => {
    tone(v, 1320, 0.12, 0.08, 'triangle');
    tone({ ...v, at: v.at + 0.16 }, 1320, 0.12, 0.08, 'triangle');
  },
  // A plug seated in its jack: a click and a dull knock.
  plug: (v) => {
    click(v, 0.03, 2400, 0.5);
    tone(v, 140, 0.08, 0.12, 'sine', 90);
  },
  // A caller gives up: the lamp goes out with a low fall.
  lost: (v) => {
    tone(v, 330, 0.3, 0.05, 'sine', 160);
  },
  // Two notes of a cash drawer chime.
  purchase: (v) => {
    tone(v, 660, 0.18, 0.07);
    tone({ ...v, at: v.at + 0.1 }, 990, 0.25, 0.07);
  },
  // An automatic switch comes to life: a run of relay clicks.
  relays: (v) => {
    for (let i = 0; i < 9; i++) click({ ...v, at: v.at + i * 0.045 }, 0.02, 3200 - i * 150, 0.4);
  },
  // A conversation heard to the end: the soft click of the earpiece set down.
  heard: (v) => {
    click(v, 0.02, 1800, 0.3);
    tone({ ...v, at: v.at + 0.05 }, 520, 0.4, 0.04);
  },
};

export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Creates or resumes the audio context; call it from a user gesture. */
  unlock(): void {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = MASTER_VOLUME;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  play(cues: readonly Cue[]): void {
    const { ctx, master } = this;
    if (this.muted || !ctx || !master || ctx.state !== 'running') return;
    try {
      for (const cue of cues) PLAYERS[cue]({ ctx, out: master, at: ctx.currentTime + 0.01 });
    } catch {
      // A failed sound must never interrupt the game.
    }
  }
}
