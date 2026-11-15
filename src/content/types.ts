import type { DistrictId, SubscriberId } from '../game/directory';
import type { Locale } from '../game/save/schema';
import type { PlotId } from '../game/story';
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
  listenIn: (caller: string, callee: string) => string;
  storyOnLine: string;
  listeningTo: (caller: string, callee: string) => string;
  stopListening: string;
  busyListening: string;
  storyHeld: (district: string) => string;
  endedTitle: string;
  endedText: string;
  whatBecameTitle: string;
  heardOf: (heard: number, total: number) => string;
  statsTitle: string;
  statConnected: (count: number) => string;
  statMissed: (count: number) => string;
  statPlayed: (duration: string) => string;
  statHeard: (heard: number, total: number) => string;
  creditsTitle: string;
  creditsLines: readonly string[];
  newShift: string;
  newShiftConfirm: string;
  language: string;
  localeNames: Record<Locale, string>;
  storageUnavailable: string;
  saveRecovered: string;
}

export interface StoryText {
  title: string;
  /** One entry per fragment; lines alternate between caller and callee. */
  fragments: readonly (readonly string[])[];
  /** What became of everyone, shown in the credits. */
  epilogue: string;
}

export type StoryTexts = Record<PlotId, StoryText>;

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
  stories: StoryTexts;
}
