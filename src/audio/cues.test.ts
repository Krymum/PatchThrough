import { describe, expect, it } from 'vitest';
import { cuesFor } from './cues';

describe('cuesFor', () => {
  it('rings once however many lamps light up in a frame', () => {
    expect(
      cuesFor([
        { type: 'call-incoming', callId: 1, from: 'grocer' },
        { type: 'call-incoming', callId: 2, from: 'bakery' },
      ]),
    ).toEqual(['ring']);
  });

  it("clicks for the operator's plugs only", () => {
    const connected = {
      type: 'call-connected',
      callId: 1,
      from: 'grocer',
      to: 'doctor',
      payoutCents: 15,
    } as const;
    expect(cuesFor([{ ...connected, handler: 'player' }])).toEqual(['plug']);
    expect(cuesFor([{ ...connected, handler: 'apprentice' }])).toEqual([]);
  });

  it('chatters with relays when a machine is bought', () => {
    expect(cuesFor([{ type: 'upgrade-bought', upgrade: 'switchMill', level: 1 }])).toEqual([
      'relays',
    ]);
    expect(cuesFor([{ type: 'upgrade-bought', upgrade: 'cord', level: 2 }])).toEqual(['purchase']);
  });

  it('stays quiet for calls ending and listening changes', () => {
    expect(
      cuesFor([
        { type: 'call-ended', callId: 1 },
        { type: 'listen-started', fragment: 'grocery-1' },
        { type: 'listen-stopped', fragment: 'grocery-1' },
      ]),
    ).toEqual([]);
    expect(cuesFor([{ type: 'fragment-heard', fragment: 'grocery-1' }])).toEqual(['heard']);
    expect(cuesFor([{ type: 'call-lost', callId: 1, from: 'grocer' }])).toEqual(['lost']);
  });
});
