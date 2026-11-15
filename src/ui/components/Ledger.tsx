import { LOCALES, type Locale } from '../../game/save/schema';
import { useContent } from '../ContentContext';
import { formatMoney } from '../format';

interface LedgerProps {
  moneyCents: number;
  /** Income the exchange makes without the operator, in cents per minute. */
  passivePerMinute: number;
  freeCords: number;
  totalCords: number;
  onLocaleChange: (locale: Locale) => void;
}

export function Ledger({
  moneyCents,
  passivePerMinute,
  freeCords,
  totalCords,
  onLocaleChange,
}: LedgerProps) {
  const { ui, locale } = useContent();
  return (
    <header className="ledger">
      <div className="ledger__title">
        <h1>{ui.title}</h1>
        <p>{ui.tagline}</p>
      </div>
      <dl className="ledger__figures">
        <div>
          <dt>{ui.money}</dt>
          <dd className="ledger__money">{formatMoney(moneyCents, locale)}</dd>
          {passivePerMinute >= 1 && (
            <dd className="ledger__passive">
              {ui.perMinute(formatMoney(Math.round(passivePerMinute), locale))}
            </dd>
          )}
        </div>
        <div>
          <dt className="visually-hidden">{ui.cords(freeCords, totalCords)}</dt>
          <dd className="ledger__cords" aria-hidden="true">
            {Array.from({ length: totalCords }, (_, i) => (
              <span key={i} className={i < freeCords ? 'cord cord--free' : 'cord'} />
            ))}
          </dd>
        </div>
      </dl>
      <label className="ledger__locale">
        <span className="visually-hidden">{ui.language}</span>
        <select
          value={locale}
          onChange={(event) => {
            const next = LOCALES.find((l) => l === event.target.value);
            if (next) onLocaleChange(next);
          }}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {ui.localeNames[l]}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}
