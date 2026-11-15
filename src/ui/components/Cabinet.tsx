import type { LocalDistrictId } from '../../game/directory';
import { useContent } from '../ContentContext';

interface CabinetProps {
  district: LocalDistrictId;
  /** A long-distance call is plugged into this district right now. */
  busy: boolean;
  awaitingTarget: boolean;
  onPress: (district: LocalDistrictId) => void;
}

const RELAYS = Array.from({ length: 24 }, (_, i) => i);

/**
 * A grey switch cabinet standing where a district's jacks used to be. It has
 * one trunk jack left, for long-distance calls into the district.
 */
export function Cabinet({ district, busy, awaitingTarget, onPress }: CabinetProps) {
  const { ui, districts } = useContent();
  const name = districts[district];

  return (
    <section className="cabinet" aria-label={`${name}, ${ui.automaticSwitch}`}>
      <h2 className="board__heading">{name}</h2>
      <button
        type="button"
        className={`cabinet__body${awaitingTarget ? ' cabinet__body--target' : ''}`}
        aria-label={`${name}, ${ui.automaticSwitch}${busy ? `, ${ui.onTheLine}` : ''}`}
        onClick={() => {
          onPress(district);
        }}
      >
        <svg className="cabinet__relays" viewBox="0 0 120 40" aria-hidden="true">
          {RELAYS.map((i) => (
            <rect
              key={i}
              className="cabinet__relay"
              style={{ animationDelay: `${(i * 37) % 900}ms` }}
              x={4 + (i % 12) * 9.6}
              y={i < 12 ? 6 : 22}
              width="6"
              height="12"
              rx="1"
            />
          ))}
        </svg>
        <span className="cabinet__label">{ui.automaticSwitch}</span>
        <span className="cabinet__note">{ui.automaticSwitchNote}</span>
        <svg className="cabinet__jack" viewBox="0 0 40 40" aria-hidden="true">
          <circle className="jack__ring" cx="20" cy="20" r="11" />
          <circle className="jack__hole" cx="20" cy="20" r="5" />
          {busy && (
            <g className="jack__plug">
              <circle cx="20" cy="20" r="8" />
            </g>
          )}
        </svg>
      </button>
    </section>
  );
}
