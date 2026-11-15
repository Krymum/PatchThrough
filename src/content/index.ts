import type { Locale } from '../game/save/schema';
import { en } from './en';
import { fr } from './fr';
import type { Content } from './types';

export const CONTENT: Record<Locale, Content> = { en, fr };

/** Picks French when it is the browser's preferred language, English otherwise. */
export function detectLocale(languages: readonly string[]): Locale {
  return languages[0]?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
