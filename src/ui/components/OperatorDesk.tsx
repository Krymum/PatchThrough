import type { Call } from '../../game/types';
import { useContent } from '../ContentContext';
import { noticeText, type Notice } from '../notices';

interface OperatorDeskProps {
  selectedCall: Call | null;
  /** The requested line is now behind an automatic switch cabinet. */
  calleeIsAutomatic: boolean;
  /** Lamps currently lit, some possibly scrolled out of view on small screens. */
  ringingCount: number;
  notice: Notice | null;
  onAnswerNext: () => void;
  onCancel: () => void;
}

/** The ticket in front of the operator: who is on the line and what they want. */
export function OperatorDesk({
  selectedCall,
  calleeIsAutomatic,
  ringingCount,
  notice,
  onAnswerNext,
  onCancel,
}: OperatorDeskProps) {
  const content = useContent();
  const { ui, subscribers } = content;

  return (
    <aside className="desk">
      <div className="desk__ticket">
        {selectedCall ? (
          <>
            <p className="desk__request">
              {ui.callerAsks(subscribers[selectedCall.from], subscribers[selectedCall.to])}
            </p>
            <p className="desk__hint">{calleeIsAutomatic ? ui.hintPickSwitch : ui.hintPickLine}</p>
            <button type="button" className="button button--quiet" onClick={onCancel}>
              {ui.cancel}
            </button>
          </>
        ) : (
          <>
            <p className="desk__hint">{ui.hintIdle}</p>
            {ringingCount > 0 && (
              <button type="button" className="button" onClick={onAnswerNext}>
                {ui.answerNext(ringingCount)}
              </button>
            )}
          </>
        )}
      </div>
      <p className="desk__notice" role="status" aria-live="polite">
        {notice ? noticeText(notice, content, content.locale) : ''}
      </p>
    </aside>
  );
}
