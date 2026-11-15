import { createContext, useContext } from 'react';
import { CONTENT } from '../content';
import type { Content } from '../content/types';
import type { Locale } from '../game/save/schema';

export interface LocalizedContent extends Content {
  locale: Locale;
}

export const ContentContext = createContext<LocalizedContent>({ ...CONTENT.en, locale: 'en' });

export function useContent(): LocalizedContent {
  return useContext(ContentContext);
}
