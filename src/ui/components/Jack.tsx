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

const GAUGE_RADIUS = 11;
const GAUGE_LENGTH = 2 * Math.PI * GAUGE_RADIUS;

/** One line on the board: its name strip, its lamp, and its brass jack. */
export function Jack({ id, line, patience, selected, awaitingTarget, story, onPress }: JackProps) {
  const { ui, subscribers } = useContent();
  const name = subscribers[id];
  const status = line === 'idle' ? ui.idle : line === 'ringing' ? ui.ringing : ui.onTheLine;
  const classes = [
    'jack',
    `jack--${line}`,
    selected && 'jack--selected',
    awaitingTarget && 'jack--target',
    story && 'jack--story',
  ].filter(Boolean);

  return (
    <li className="jack-cell">
      <button
        type="button"
        className={classes.join(' ')}
        aria-pressed={selected}
        data-subscriber={id}
        aria-label={`${name}, ${status}${story ? `, ${ui.storyOnLine}` : ''}`}
        onClick={() => {
          onPress(id);
        }}
      >
        <span className="jack__label">{name}</span>
        <svg className="jack__lamp" viewBox="0 0 32 32" aria-hidden="true">
          <circle className="jack__bulb" cx="16" cy="16" r="7" />
          {line === 'ringing' && (
            <circle
              className="jack__patience"
              cx="16"
              cy="16"
              r={GAUGE_RADIUS}
              strokeDasharray={GAUGE_LENGTH}
              strokeDashoffset={GAUGE_LENGTH * (1 - patience)}
              transform="rotate(-90 16 16)"
            />
          )}
          {story && <path className="jack__murmur" d="M26 10 q3 6 0 12 M29.5 7 q5 9 0 18" />}
        </svg>
        <span className="jack__hole" data-hole={id} />
      </button>
    </li>
  );
}
