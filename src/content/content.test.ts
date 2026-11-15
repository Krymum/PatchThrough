import { describe, expect, it } from 'vitest';
import { PLOTS, PLOT_IDS } from '../game/story';
import { LOCALES } from '../game/save/schema';
import { CONTENT, detectLocale } from '.';

describe.each(LOCALES)('%s stories', (locale) => {
  const { stories } = CONTENT[locale];

  it.each(PLOT_IDS)('tell every fragment of %s', (plot) => {
    const text = stories[plot];
    expect(text.fragments).toHaveLength(PLOTS[plot].fragments.length);
    for (const lines of text.fragments) {
      expect(lines.length).toBeGreaterThanOrEqual(2);
      for (const line of lines) expect(line.trim()).not.toBe('');
    }
    expect(text.title.trim()).not.toBe('');
    expect(text.epilogue.trim()).not.toBe('');
  });
});

describe('translations', () => {
  it('tell the same conversations with the same number of lines', () => {
    for (const plot of PLOT_IDS) {
      const en = CONTENT.en.stories[plot].fragments.map((lines) => lines.length);
      const fr = CONTENT.fr.stories[plot].fragments.map((lines) => lines.length);
      expect({ plot, lines: fr }).toEqual({ plot, lines: en });
    }
  });
});

describe('detectLocale', () => {
  it("follows the browser's preferred language", () => {
    expect(detectLocale(['fr-FR', 'en'])).toBe('fr');
    expect(detectLocale(['en-US', 'fr'])).toBe('en');
    expect(detectLocale(['de-DE'])).toBe('en');
    expect(detectLocale([])).toBe('en');
  });
});
