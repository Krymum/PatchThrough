import { describe, expect, it } from 'vitest';
import { nextRandom, randomInt } from './rng';

describe('nextRandom', () => {
  it('is deterministic for a given seed', () => {
    expect(nextRandom(42)).toEqual(nextRandom(42));
  });

  it('produces values in [0, 1) and advances the seed', () => {
    let seed = 7;
    for (let i = 0; i < 1000; i++) {
      const draw = nextRandom(seed);
      expect(draw.value).toBeGreaterThanOrEqual(0);
      expect(draw.value).toBeLessThan(1);
      expect(draw.seed).not.toBe(seed);
      seed = draw.seed;
    }
  });
});

describe('randomInt', () => {
  it('stays within inclusive bounds and reaches both ends', () => {
    const seen = new Set<number>();
    let seed = 1;
    for (let i = 0; i < 500; i++) {
      const draw = randomInt(seed, 3, 6);
      seen.add(draw.value);
      seed = draw.seed;
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });
});
