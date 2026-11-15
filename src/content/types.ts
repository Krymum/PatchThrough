import type { DistrictId, SubscriberId } from '../game/directory';
import type { Locale } from '../game/save/schema';
import type { UpgradeId } from '../game/types';

export interface UiStrings {
  title: string;
  tagline: string;
  money: string;
  perMinute: (amount: string) => string;
  cords: (free: number, total: number) => string;
  boardLabel: string;
  ringing: string;
  onTheLine: string;
  idle: string;
  hintIdle: string;
  answerNext: (lit: number) => string;
  callerAsks: (caller: string, callee: string) => string;
  hintPickLine: string;
  hintPickSwitch: string;
  cancel: string;
  wrongLine: (callee: string) => string;
  noFreeCord: string;
  connected: (caller: string, callee: string, payout: string) => string;
  callLost: (caller: string) => string;
  incoming: (caller: string) => string;
  automaticSwitch: string;
  automaticSwitchNote: string;
  colleaguesTitle: string;
  colleagueWorking: (name: string) => string;
  colleagueGone: (name: string) => string;
  shopTitle: string;
  buyFor: (price: string) => string;
  duration: (hours: number, minutes: number) => string;
  welcomeBack: (duration: string, amount: string) => string;
  welcomeBackNothing: (duration: string) => string;
  dismiss: string;
  endedTitle: string;
  endedText: string;
  language: string;
  localeNames: Record<Locale, string>;
  storageUnavailable: string;
  saveRecovered: string;
}

export interface UpgradeText {
  name: string;
  description: string;
}

export interface Content {
  ui: UiStrings;
  districts: Record<DistrictId, string>;
  subscribers: Record<SubscriberId, string>;
  upgrades: Record<UpgradeId, UpgradeText>;
  /** First names of the apprentices, in hiring order. */
  apprentices: readonly string[];
}
