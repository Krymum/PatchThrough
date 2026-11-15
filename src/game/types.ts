import type { SubscriberId } from './directory';
import type { FragmentId, PlotId } from './story';

/** Every purchase in the game, in the order the shop lists them. */
export const UPGRADE_IDS = [
  'cord',
  'headset',
  'extendMill',
  'apprentice',
  'extendHill',
  'trunk',
  'extendRiver',
  'switchMill',
  'switchHill',
  'switchRiver',
  'dial',
  'automaticExchange',
] as const;
export type UpgradeId = (typeof UPGRADE_IDS)[number];

export type CallStatus = 'ringing' | 'connected';

/** Who plugged a call in: the player, or an apprentice at a neighbouring position. */
export type Handler = 'player' | 'apprentice';

export interface Call {
  id: number;
  from: SubscriberId;
  to: SubscriberId;
  status: CallStatus;
  /** Game-clock time the lamp lit up. */
  rangAt: number;
  /** Game-clock time after which a ringing call is lost. */
  expiresAt: number;
  /** Game-clock time at which a connected call hangs up; null while ringing. */
  endsAt: number | null;
  /** Null while ringing. */
  handler: Handler | null;
  /** The story conversation this call carries, if any. */
  fragment: FragmentId | null;
}

export interface Stats {
  connected: number;
  missed: number;
  earnedCents: number;
  playMs: number;
}

export interface StoryProgress {
  /** How many fragments of each plot have been placed and connected. */
  offered: Record<PlotId, number>;
  /** Fragments the operator listened to until the end. */
  heard: readonly FragmentId[];
}

export interface Listening {
  callId: number;
  fragment: FragmentId;
  startedAt: number;
}

export interface GameState {
  /** Session clock in milliseconds; restarts at zero on every load. */
  clock: number;
  /** Seed of the deterministic random generator. */
  seed: number;
  moneyCents: number;
  /** Fraction of a cent earned by automatic switches, carried to the next step. */
  incomeCarry: number;
  upgrades: Record<UpgradeId, number>;
  stats: Stats;
  calls: readonly Call[];
  nextCallId: number;
  nextCallAt: number;
  /** For each working apprentice, the game-clock time they are free again. */
  apprenticeBusyUntil: readonly number[];
  story: StoryProgress;
  /** The conversation the operator is listening to; they cannot connect meanwhile. */
  listening: Listening | null;
  /** No story call is placed before this game-clock time. */
  storyReadyAt: number;
  /** Per plot, no new fragment is placed before this game-clock time. */
  plotReadyAt: Partial<Record<PlotId, number>>;
}

export type GameEvent =
  | { type: 'call-incoming'; callId: number; from: SubscriberId }
  | { type: 'call-lost'; callId: number; from: SubscriberId }
  | {
      type: 'call-connected';
      callId: number;
      from: SubscriberId;
      to: SubscriberId;
      payoutCents: number;
      handler: Handler;
    }
  | { type: 'call-ended'; callId: number }
  | { type: 'listen-started'; fragment: FragmentId }
  | { type: 'listen-stopped'; fragment: FragmentId }
  | { type: 'fragment-heard'; fragment: FragmentId }
  | { type: 'upgrade-bought'; upgrade: UpgradeId; level: number };

export interface StepResult {
  state: GameState;
  events: GameEvent[];
}
