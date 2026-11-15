import type { Locale } from '../game/save/schema';

const INTL_LOCALES: Record<Locale, string> = { en: 'en-US', fr: 'fr-FR' };
const formatters = new Map<Locale, Intl.NumberFormat>();

/** Formats integer cents as dollars, e.g. "$12.50" or "12,50 $". */
export function formatMoney(cents: number, locale: Locale): string {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(INTL_LOCALES[locale], {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'narrowSymbol',
    });
    formatters.set(locale, formatter);
  }
  return formatter.format(cents / 100);
}
