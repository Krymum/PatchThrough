import type { SubscriberId } from '../../game/directory';
import { useContent } from '../ContentContext';

/** A connected line shows who plugged it: the operator, or an apprentice. */
export type LineState = 'idle' | 'ringing' | 'player' | 'apprentice';

interface JackProps {
  id: SubscriberId;
  line: LineState;
  /** Remaining patience of a ringing caller, from 1 (fresh) to 0. */
  patience: number;
  selected: boolean;
  awaitingTarget: boolean;
  /** A conversation worth hearing is going on through this jack. */
  story: boolean;
  onPress: (id: SubscriberId) => void;
}

const GAUGE_RADIUS = 15;
const GAUGE_LENGTH = 2 * Math.PI * GAUGE_RADIUS;

export function Jack({ id, line, patience, selected, awaitingTarget, story, onPress }: JackProps) {
  const { ui, subscribers } = useContent();
  const name = subscribers[id];
  const status = line === 'idle' ? ui.idle : line === 'ringing' ? ui.ringing : ui.onTheLine;
  const connected = line === 'player' || line === 'apprentice';

  return (
    <li className="jack-cell">
      <button
        type="button"
        className={`jack jack--${line}${selected ? ' jack--selected' : ''}${
          awaitingTarget ? ' jack--target' : ''
        }${story ? ' jack--story' : ''}`}
        aria-pressed={selected}
        data-subscriber={id}
        aria-label={`${name}, ${status}${story ? `, ${ui.storyOnLine}` : ''}`}
        onClick={() => {
          onPress(id);
        }}
      >
        <span className="jack__plate">{name}</span>
        <svg className="jack__hardware" viewBox="0 0 40 84" aria-hidden="true">
          <circle className="jack__lamp" cx="20" cy="20" r="10" />
          {line === 'ringing' && (
            <circle
              className="jack__patience"
              cx="20"
              cy="20"
              r={GAUGE_RADIUS}
              strokeDasharray={GAUGE_LENGTH}
              strokeDashoffset={GAUGE_LENGTH * (1 - patience)}
              transform="rotate(-90 20 20)"
            />
          )}
          {story && <path className="jack__murmur" d="M31 12 q4 8 0 16 M35 9 q6 11 0 22" />}
          <circle className="jack__ring" cx="20" cy="60" r="11" />
          <circle className="jack__hole" cx="20" cy="60" r="5" />
          {connected && (
            <g className="jack__plug">
              <circle cx="20" cy="60" r="8" />
              <rect x="17" y="60" width="6" height="24" rx="2" />
            </g>
          )}
        </svg>
      </button>
    </li>
  );
}
