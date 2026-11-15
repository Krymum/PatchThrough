import { CONFIG } from './config';
import { districtOf } from './directory';
import { AUTOMATED_BY, activeApprentices, hasEnded } from './progression';
import { plotHoldingUpgrade } from './story';
import { UPGRADE_IDS, type GameState, type StepResult, type UpgradeId } from './types';

/** Price of the next level of an upgrade, or null when it is maxed out. */
export function nextUpgradeCost(state: GameState, upgrade: UpgradeId): number | null {
  const costs = CONFIG.upgrades[upgrade].costsCents;
  return costs[state.upgrades[upgrade]] ?? null;
}

export function maxUpgradeLevel(upgrade: UpgradeId): number {
  return CONFIG.upgrades[upgrade].costsCents.length;
}

/** Whether the shop shows this upgrade: its prerequisites are met. */
export function isUpgradeUnlocked(state: Pick<GameState, 'upgrades'>, upgrade: UpgradeId): boolean {
  const requires: Partial<Record<UpgradeId, number>> = CONFIG.upgrades[upgrade].requires;
  return UPGRADE_IDS.every((id) => state.upgrades[id] >= (requires[id] ?? 0));
}

/** Upgrades the shop offers right now, in catalogue order. */
export function availableUpgrades(state: GameState): UpgradeId[] {
  if (hasEnded(state)) return [];
  return UPGRADE_IDS.filter(
    (id) => isUpgradeUnlocked(state, id) && nextUpgradeCost(state, id) !== null,
  );
}

export function canBuyUpgrade(state: GameState, upgrade: UpgradeId): boolean {
  const cost = nextUpgradeCost(state, upgrade);
  return (
    !hasEnded(state) &&
    isUpgradeUnlocked(state, upgrade) &&
    plotHoldingUpgrade(state, upgrade) === null &&
    cost !== null &&
    state.moneyCents >= cost
  );
}

const AUTOMATION_DISTRICT = new Map(
  Object.entries(AUTOMATED_BY).map(([district, upgrade]) => [upgrade, district]),
);

/** Keeps one busy-until slot per working apprentice; newcomers start free. */
function staffPositions(state: GameState): GameState {
  const count = activeApprentices(state);
  const current = state.apprenticeBusyUntil;
  if (current.length === count) return state;
  const kept = current.slice(0, count);
  while (kept.length < count) kept.push(state.clock);
  return { ...state, apprenticeBusyUntil: kept };
}

/** Side effects of a purchase on the live board. */
function applyPurchase(state: GameState, upgrade: UpgradeId): GameState {
  if (upgrade === 'automaticExchange') {
    return { ...state, calls: [], apprenticeBusyUntil: [], nextCallAt: Infinity };
  }
  const district = AUTOMATION_DISTRICT.get(upgrade);
  if (district === undefined) return staffPositions(state);
  // The switch takes over the district's lines, and one apprentice is let go.
  return staffPositions({
    ...state,
    calls: state.calls.filter(
      (call) => districtOf(call.from) !== district && districtOf(call.to) !== district,
    ),
  });
}

export function buyUpgrade(state: GameState, upgrade: UpgradeId): StepResult {
  const cost = nextUpgradeCost(state, upgrade);
  if (cost === null || !canBuyUpgrade(state, upgrade)) {
    return { state, events: [] };
  }
  const level = state.upgrades[upgrade] + 1;
  const paid: GameState = {
    ...state,
    moneyCents: state.moneyCents - cost,
    upgrades: { ...state.upgrades, [upgrade]: level },
  };
  return {
    state: applyPurchase(paid, upgrade),
    events: [{ type: 'upgrade-bought', upgrade, level }],
  };
}

/** Number of cord pairs the operator can have plugged in at once. */
export function cordCount(state: Pick<GameState, 'upgrades'>): number {
  return CONFIG.cords.initial + state.upgrades.cord;
}
