import type { Call } from '../../game/types';
import { useContent } from '../ContentContext';

interface ShelfProps {
  totalCords: number;
  /** Cord pairs currently plugged into the board. */
  usedCords: ReadonlySet<number>;
  ringingCount: number;
  /** The most recent conversation worth hearing, if the operator is free to listen. */
  listenable: Call | null;
  /** The latest thing that happened on the board, already worded. */
  log: string;
  onAnswerNext: () => void;
  onListen: (callId: number) => void;
}

/**
 * The keyshelf in front of the board: the operator's cord pairs, the two
 * keys they reach for most, and a typed line of what just happened.
 */
export function Shelf({
  totalCords,
  usedCords,
  ringingCount,
  listenable,
  log,
  onAnswerNext,
  onListen,
}: ShelfProps) {
  const { ui, subscribers } = useContent();
  const free = totalCords - usedCords.size;

  return (
    <div className="shelf">
      <ul className="shelf__plugs" aria-label={ui.cords(free, totalCords)}>
        {Array.from({ length: totalCords }, (_, cord) => (
          <li key={cord} className={usedCords.has(cord) ? 'pair pair--used' : 'pair'}>
            <span className="plug" data-plug={`${cord}-0`} />
            <span className="plug" data-plug={`${cord}-1`} />
          </li>
        ))}
      </ul>
      <p className="shelf__log" role="status" aria-live="polite">
        {log}
      </p>
      <div className="shelf__keys">
        <button
          type="button"
          className="key"
          disabled={ringingCount === 0}
          aria-keyshortcuts="A"
          onClick={onAnswerNext}
        >
          {ui.answerNext(ringingCount)}
        </button>
        {listenable && (
          <button
            type="button"
            className="key key--listen"
            aria-keyshortcuts="L"
            onClick={() => {
              onListen(listenable.id);
            }}
          >
            {ui.listenIn(subscribers[listenable.from], subscribers[listenable.to])}
          </button>
        )}
      </div>
    </div>
  );
}
