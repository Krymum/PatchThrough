import type { SubscriberId } from '../game/directory';
import type { Locale } from '../game/save/schema';

export interface UiStrings {
  title: string;
  tagline: string;
  money: string;
  cords: (free: number, total: number) => string;
  boardLabel: string;
  ringing: string;
  onTheLine: string;
  idle: string;
  hintIdle: string;
  callerAsks: (caller: string, callee: string) => string;
  hintPickLine: string;
  cancel: string;
  wrongLine: (callee: string) => string;
  noFreeCord: string;
  connected: (caller: string, callee: string, payout: string) => string;
  callLost: (caller: string) => string;
  incoming: (caller: string) => string;
  shopTitle: string;
  upgradeCordName: string;
  upgradeCordDescription: string;
  buyFor: (price: string) => string;
  soldOut: string;
  language: string;
  localeNames: Record<Locale, string>;
  storageUnavailable: string;
  saveRecovered: string;
}

export interface Content {
  ui: UiStrings;
  subscribers: Record<SubscriberId, string>;
}
