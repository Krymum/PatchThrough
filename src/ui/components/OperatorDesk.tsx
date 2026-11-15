import { CONFIG } from '../../game/config';
import { parseFragmentId } from '../../game/story';
import type { Call, Listening } from '../../game/types';
import { useContent } from '../ContentContext';
import { noticeText, type Notice } from '../notices';

/** The conversation being listened to, with its call, and the current clock. */
export interface ListeningView {
  listening: Listening;
  call: Call;
  clock: number;
}

interface OperatorDeskProps {
  selectedCall: Call | null;
  /** The requested line is now behind an automatic switch cabinet. */
  calleeIsAutomatic: boolean;
  /** Lamps currently lit, some possibly scrolled out of view on small screens. */
  ringingCount: number;
  listening: ListeningView | null;
  /** The most recent conversation worth hearing, if any. */
  listenable: Call | null;
  notice: Notice | null;
  onAnswerNext: () => void;
  onListen: (callId: number) => void;
  onStopListening: () => void;
  onCancel: () => void;
}

/** The overheard conversation, revealed line by line as the listening goes on. */
function Transcript({ listening, call, clock }: ListeningView) {
  const { ui, subscribers, stories } = useContent();
  const { plot, index } = parseFragmentId(listening.fragment);
  const lines = stories[plot].fragments[index] ?? [];
  const progress = (clock - listening.startedAt) / CONFIG.story.listenMs;
  const shown = Math.min(lines.length, Math.floor(progress * lines.length) + 1);
  const caller = subscribers[call.from];
  const callee = subscribers[call.to];

  return (
    <div className="transcript">
      <p className="transcript__title">{ui.listeningTo(caller, callee)}</p>
      <ol className="transcript__lines" aria-live="polite">
        {lines.slice(0, shown).map((line, i) => (
          <li key={i}>
            <span className="transcript__speaker">{i % 2 === 0 ? caller : callee}</span> {line}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The ticket in front of the operator: who is on the line and what they want. */
export function OperatorDesk({
  selectedCall,
  calleeIsAutomatic,
  ringingCount,
  listening,
  listenable,
  notice,
  onAnswerNext,
  onListen,
  onStopListening,
  onCancel,
}: OperatorDeskProps) {
  const content = useContent();
  const { ui, subscribers } = content;

  let ticket;
  if (listening) {
    ticket = (
      <>
        <Transcript {...listening} />
        <button type="button" className="button button--quiet" onClick={onStopListening}>
          {ui.stopListening}
        </button>
      </>
    );
  } else if (selectedCall) {
    ticket = (
      <>
        <p className="desk__request">
          {ui.callerAsks(subscribers[selectedCall.from], subscribers[selectedCall.to])}
        </p>
        <p className="desk__hint">{calleeIsAutomatic ? ui.hintPickSwitch : ui.hintPickLine}</p>
        <button type="button" className="button button--quiet" onClick={onCancel}>
          {ui.cancel}
        </button>
      </>
    );
  } else {
    ticket = (
      <>
        <p className="desk__hint">{listenable ? ui.storyOnLine : ui.hintIdle}</p>
        {ringingCount > 0 && (
          <button type="button" className="button" onClick={onAnswerNext}>
            {ui.answerNext(ringingCount)}
          </button>
        )}
        {listenable && (
          <button
            type="button"
            className="button button--listen"
            onClick={() => {
              onListen(listenable.id);
            }}
          >
            {ui.listenIn(subscribers[listenable.from], subscribers[listenable.to])}
          </button>
        )}
      </>
    );
  }

  return (
    <aside className={`desk${listening ? ' desk--listening' : ''}`}>
      <div className="desk__ticket">{ticket}</div>
      <p className="desk__notice" role="status" aria-live="polite">
        {notice ? noticeText(notice, content, content.locale) : ''}
      </p>
    </aside>
  );
}
