/**
 * Small seeded pseudo-random generator (mulberry32).
 *
 * The generator state is a plain 32-bit integer kept inside the game state,
 * so every engine function stays pure and fully reproducible in tests.
 */

export interface RandomResult {
  /** Uniform float in [0, 1). */
  value: number;
  /** Seed to store for the next draw. */
  seed: number;
}

export function nextRandom(seed: number): RandomResult {
  const nextSeed = (seed + 0x6d2b79f5) | 0;
  let t = nextSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, seed: nextSeed };
}

/** Uniform integer in [min, max], both inclusive. */
export function randomInt(seed: number, min: number, max: number): RandomResult {
  const draw = nextRandom(seed);
  return { value: min + Math.floor(draw.value * (max - min + 1)), seed: draw.seed };
}

/** Creates a fresh seed for a new session. */
export function createSeed(): number {
  return (Math.random() * 4294967296) | 0;
}
