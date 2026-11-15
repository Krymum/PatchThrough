import type { SubscriberId } from './directory';

export type UpgradeId = 'cord';

export type CallStatus = 'ringing' | 'connected';

export interface Call {
  id: number;
  from: SubscriberId;
  to: SubscriberId;
  status: CallStatus;
  /** Game-clock time after which a ringing call is lost. */
  expiresAt: number;
  /** Game-clock time at which a connected call hangs up; null while ringing. */
  endsAt: number | null;
}

export interface Stats {
  connected: number;
  missed: number;
  earnedCents: number;
  playMs: number;
}

export interface GameState {
  /** Session clock in milliseconds; restarts at zero on every load. */
  clock: number;
  /** Seed of the deterministic random generator. */
  seed: number;
  moneyCents: number;
  upgrades: Record<UpgradeId, number>;
  stats: Stats;
  calls: readonly Call[];
  nextCallId: number;
  nextCallAt: number;
}

export type GameEvent =
  | { type: 'call-incoming'; callId: number }
  | { type: 'call-lost'; callId: number }
  | { type: 'call-connected'; callId: number; payoutCents: number }
  | { type: 'call-ended'; callId: number }
  | { type: 'upgrade-bought'; upgrade: UpgradeId; level: number };

export interface StepResult {
  state: GameState;
  events: GameEvent[];
}
