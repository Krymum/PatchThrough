import { LOCALES, type Locale } from '../../game/save/schema';
import { useContent } from '../ContentContext';
import { formatMoney } from '../format';

interface HeaderProps {
  moneyCents: number;
  /** Income the exchange makes without the operator, in cents per minute. */
  passivePerMinute: number;
  muted: boolean;
  onToggleSound: () => void;
  onLocaleChange: (locale: Locale) => void;
}

/** The brass name plate on the wall, the till, and the two settings. */
export function Header({
  moneyCents,
  passivePerMinute,
  muted,
  onToggleSound,
  onLocaleChange,
}: HeaderProps) {
  const { ui, locale } = useContent();
  return (
    <header className="header">
      <div className="plate">
        <h1>{ui.title}</h1>
        <p>{ui.tagline}</p>
      </div>
      <dl className="till">
        <dt className="visually-hidden">{ui.money}</dt>
        <dd className="till__money">{formatMoney(moneyCents, locale)}</dd>
        {passivePerMinute >= 1 && (
          <dd className="till__passive">
            {ui.perMinute(formatMoney(Math.round(passivePerMinute), locale))}
          </dd>
        )}
      </dl>
      <div className="header__settings">
        <button
          type="button"
          className="round-button"
          aria-pressed={!muted}
          aria-label={ui.sound}
          onClick={onToggleSound}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path className="round-button__fill" d="M4 9h4l5-4v14l-5-4H4z" />
            {muted ? (
              <path className="round-button__stroke" d="M16 9l5 6M21 9l-5 6" />
            ) : (
              <path className="round-button__stroke" d="M16 8.5q2.5 3.5 0 7M18.5 6q4.5 6 0 12" />
            )}
          </svg>
        </button>
        <label className="round-button round-button--select">
          <span className="visually-hidden">{ui.language}</span>
          <select
            value={locale}
            onChange={(event) => {
              const next = LOCALES.find((l) => l === event.target.value);
              if (next) onLocaleChange(next);
            }}
          >
            {LOCALES.map((l) => (
              <option key={l} value={l} aria-label={ui.localeNames[l]}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
