import type { GameEvent, UpgradeId } from '../game/types';

/** The handful of sounds the exchange makes. */
export type Cue = 'ring' | 'plug' | 'lost' | 'purchase' | 'relays' | 'heard';

const MACHINE_PURCHASES: ReadonlySet<UpgradeId> = new Set([
  'switchMill',
  'switchHill',
  'switchRiver',
  'dial',
  'automaticExchange',
]);

/**
 * Sounds for a batch of engine events, each at most once per batch so a busy
 * frame never turns into a din. Apprentices work quietly at the next
 * positions: only the operator's own plugs click.
 */
export function cuesFor(events: readonly GameEvent[]): Cue[] {
  const cues = new Set<Cue>();
  for (const event of events) {
    switch (event.type) {
      case 'call-incoming':
        cues.add('ring');
        break;
      case 'call-connected':
        if (event.handler === 'player') cues.add('plug');
        break;
      case 'call-lost':
        cues.add('lost');
        break;
      case 'upgrade-bought':
        cues.add(MACHINE_PURCHASES.has(event.upgrade) ? 'relays' : 'purchase');
        break;
      case 'fragment-heard':
        cues.add('heard');
        break;
      case 'call-ended':
      case 'listen-started':
      case 'listen-stopped':
        break;
    }
  }
  return [...cues];
}
