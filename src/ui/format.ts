import type { Locale } from '../game/save/schema';

const INTL_LOCALES: Record<Locale, string> = { en: 'en-US', fr: 'fr-FR' };
const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale: Locale, fractionDigits: number): Intl.NumberFormat {
  const key = `${locale}:${fractionDigits}`;
  let format = formatters.get(key);
  if (!format) {
    format = new Intl.NumberFormat(INTL_LOCALES[locale], {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(key, format);
  }
  return format;
}

/** Formats integer cents as dollars, e.g. "$12.50" or "12,50 $". */
export function formatMoney(cents: number, locale: Locale): string {
  return formatter(locale, 2).format(cents / 100);
}

/** Like formatMoney, but drops the cents of round prices: "$160", "$2.50". */
export function formatPrice(cents: number, locale: Locale): string {
  return formatter(locale, cents % 100 === 0 ? 0 : 2).format(cents / 100);
}
