/**
 * The town's stories. Each plot is a sequence of conversations between
 * subscribers of one district. When a fragment is due, the next call comes
 * from the right caller; once that call is connected the fragment has been
 * offered, and the operator may listen in. Plots advance whether or not the
 * player listens: missing a conversation is part of the choice.
 *
 * Only the structure lives here; the words are in src/content.
 */

import { CONFIG } from './config';
import type { DistrictId, SubscriberId } from './directory';
import { isAutomated, isOpen } from './progression';
import type { GameState, StepResult, UpgradeId } from './types';

export const PLOT_IDS = ['looms', 'waltz', 'crossing', 'grocery', 'longDistance'] as const;
export type PlotId = (typeof PLOT_IDS)[number];

/** Fragment ids look like "looms-3": the plot, then the 1-based position. */
export type FragmentId = `${PlotId}-${number}`;

interface Plot {
  district: DistrictId;
  /** The purchase that silences the district: it waits for the plot to be told. */
  closedBy: UpgradeId;
  fragments: readonly { from: SubscriberId; to: SubscriberId }[];
}

/**
 * Plots in the order their districts are automated, which is also the order
 * in which they get priority for the next story call.
 */
export const PLOTS: Readonly<Record<PlotId, Plot>> = {
  looms: {
    district: 'mill',
    closedBy: 'switchMill',
    fragments: [
      { from: 'mill', to: 'foreman' },
      { from: 'foreman', to: 'tavern' },
      { from: 'boardingHouse', to: 'foreman' },
      { from: 'chapel', to: 'fireStation' },
      { from: 'foreman', to: 'mill' },
      { from: 'tavern', to: 'boardingHouse' },
      { from: 'mill', to: 'foreman' },
    ],
  },
  waltz: {
    district: 'hill',
    closedBy: 'switchHill',
    fragments: [
      { from: 'colonel', to: 'pianoTeacher' },
      { from: 'widow', to: 'pianoTeacher' },
      { from: 'colonel', to: 'mayor' },
      { from: 'widow', to: 'judge' },
      { from: 'pianoTeacher', to: 'colonel' },
      { from: 'mayor', to: 'banker' },
    ],
  },
  crossing: {
    district: 'river',
    closedBy: 'switchRiver',
    fragments: [
      { from: 'ferry', to: 'lockKeeper' },
      { from: 'farm', to: 'ferry' },
      { from: 'boatyard', to: 'ferry' },
      { from: 'dancehall', to: 'veterinarian' },
      { from: 'lockKeeper', to: 'ferry' },
      { from: 'ferry', to: 'boatyard' },
      { from: 'dancehall', to: 'farm' },
    ],
  },
  grocery: {
    district: 'main',
    closedBy: 'dial',
    fragments: [
      { from: 'grocer', to: 'doctor' },
      { from: 'hotel', to: 'grocer' },
      { from: 'grocer', to: 'bakery' },
      { from: 'newspaper', to: 'grocer' },
      { from: 'doctor', to: 'grocer' },
      { from: 'grocer', to: 'hotel' },
      { from: 'newspaper', to: 'bakery' },
    ],
  },
  longDistance: {
    district: 'trunk',
    closedBy: 'automaticExchange',
    fragments: [
      { from: 'longDistance', to: 'boardingHouse' },
      { from: 'longDistance', to: 'boardingHouse' },
      { from: 'longDistance', to: 'chapel' },
      { from: 'longDistance', to: 'boardingHouse' },
      { from: 'longDistance', to: 'boardingHouse' },
      { from: 'longDistance', to: 'boardingHouse' },
    ],
  },
};

export const FRAGMENT_COUNT = PLOT_IDS.reduce((sum, id) => sum + PLOTS[id].fragments.length, 0);

export function fragmentId(plot: PlotId, index: number): FragmentId {
  return `${plot}-${index + 1}`;
}

export function parseFragmentId(id: FragmentId): { plot: PlotId; index: number } {
  const dash = id.lastIndexOf('-');
  return { plot: id.slice(0, dash) as PlotId, index: Number(id.slice(dash + 1)) - 1 };
}

export function isFragmentId(value: unknown): value is FragmentId {
  if (typeof value !== 'string') return false;
  const dash = value.lastIndexOf('-');
  const plot = PLOT_IDS.find((id) => id === value.slice(0, dash));
  const position = Number(value.slice(dash + 1));
  return (
    plot !== undefined &&
    Number.isInteger(position) &&
    position >= 1 &&
    position <= PLOTS[plot].fragments.length
  );
}

export function isPlotTold(state: Pick<GameState, 'story'>, plot: PlotId): boolean {
  return state.story.offered[plot] >= PLOTS[plot].fragments.length;
}

/** The plot whose district this purchase silences, if its story is still being told. */
export function plotHoldingUpgrade(
  state: Pick<GameState, 'story'>,
  upgrade: UpgradeId,
): PlotId | null {
  return PLOT_IDS.find((id) => PLOTS[id].closedBy === upgrade && !isPlotTold(state, id)) ?? null;
}

function isPlotLive(state: GameState, plot: PlotId): boolean {
  const { district } = PLOTS[plot];
  if (district === 'trunk')
    return state.upgrades.trunk > 0 && state.upgrades.automaticExchange === 0;
  return isOpen(state, district) && !isAutomated(state, district);
}

/**
 * The next conversation waiting to be placed, if any: the first plot in
 * priority order that is live, rested since its last call, not already on
 * the board, and whose two subscribers are free.
 */
export function dueFragment(
  state: GameState,
  busy: ReadonlySet<SubscriberId>,
): { id: FragmentId; from: SubscriberId; to: SubscriberId } | null {
  if (state.clock < state.storyReadyAt) return null;
  for (const plot of PLOT_IDS) {
    const index = state.story.offered[plot];
    const fragment = PLOTS[plot].fragments[index];
    if (!fragment || !isPlotLive(state, plot)) continue;
    if ((state.plotReadyAt[plot] ?? 0) > state.clock) continue;
    const id = fragmentId(plot, index);
    if (state.calls.some((call) => call.fragment === id)) continue;
    if (busy.has(fragment.from) || busy.has(fragment.to)) continue;
    return { id, ...fragment };
  }
  return null;
}

/** Records that a story call was placed, so the next one waits its turn. */
export function noteStoryCallPlaced(state: GameState, id: FragmentId): GameState {
  const { plot } = parseFragmentId(id);
  return {
    ...state,
    storyReadyAt: state.clock + CONFIG.story.callGapMs,
    plotReadyAt: { ...state.plotReadyAt, [plot]: state.clock + CONFIG.story.plotGapMs },
  };
}

/** A story call got through: its fragment counts as told. */
export function noteFragmentOffered(state: GameState, id: FragmentId): GameState {
  const { plot, index } = parseFragmentId(id);
  if (state.story.offered[plot] !== index) return state;
  return {
    ...state,
    story: { ...state.story, offered: { ...state.story.offered, [plot]: index + 1 } },
  };
}

export type ListenOutcome = 'listening' | 'nothing-to-hear' | 'already-listening';

export interface ListenResult extends StepResult {
  outcome: ListenOutcome;
}

/** Calls the operator could listen in on right now. */
export function listenableCalls(state: GameState): GameState['calls'] {
  return state.calls.filter(
    (call) =>
      call.status === 'connected' &&
      call.fragment !== null &&
      !state.story.heard.includes(call.fragment),
  );
}

/**
 * The operator stays on the line of a conversation. Until it is over, or
 * until they hang up their earpiece, they cannot connect anything else.
 */
export function startListening(state: GameState, callId: number): ListenResult {
  if (state.listening) return { state, events: [], outcome: 'already-listening' };
  const call = listenableCalls(state).find((c) => c.id === callId);
  if (!call?.fragment) return { state, events: [], outcome: 'nothing-to-hear' };
  return {
    state: { ...state, listening: { callId, fragment: call.fragment, startedAt: state.clock } },
    events: [{ type: 'listen-started', fragment: call.fragment }],
    outcome: 'listening',
  };
}

export function stopListening(state: GameState): StepResult {
  if (!state.listening) return { state, events: [] };
  return {
    state: { ...state, listening: null },
    events: [{ type: 'listen-stopped', fragment: state.listening.fragment }],
  };
}

/** When the listening ends on its own: the fragment is heard, or the line went dead. */
export function listeningEndsAt(state: GameState): number {
  return state.listening ? state.listening.startedAt + CONFIG.story.listenMs : Infinity;
}

export function settleListening(state: GameState): StepResult {
  const { listening } = state;
  if (!listening) return { state, events: [] };
  if (state.clock >= listening.startedAt + CONFIG.story.listenMs) {
    return {
      state: {
        ...state,
        listening: null,
        story: { ...state.story, heard: [...state.story.heard, listening.fragment] },
      },
      events: [{ type: 'fragment-heard', fragment: listening.fragment }],
    };
  }
  if (!state.calls.some((call) => call.id === listening.callId)) {
    return stopListening(state);
  }
  return { state, events: [] };
}
