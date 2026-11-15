import { CONFIG } from '../../game/config';
import { parseFragmentId } from '../../game/story';
import type { Call, Listening } from '../../game/types';
import { useContent } from '../ContentContext';

interface RequestSlipProps {
  call: Call;
  /** The requested line is now behind an automatic switch cabinet. */
  calleeIsAutomatic: boolean;
  /** Why the last attempt failed, already worded. */
  problem: string | null;
  onCancel: () => void;
}

/** The note the operator jots down while a caller waits: who they want. */
export function RequestSlip({ call, calleeIsAutomatic, problem, onCancel }: RequestSlipProps) {
  const { ui, subscribers } = useContent();
  return (
    <div className="slip" role="dialog" aria-live="polite">
      <p className="slip__request">{ui.callerAsks(subscribers[call.from], subscribers[call.to])}</p>
      {problem && <p className="slip__problem">{problem}</p>}
      <div className="slip__actions">
        <span>{calleeIsAutomatic ? ui.hintPickSwitch : ui.hintPickLine}</span>
        <button type="button" aria-keyshortcuts="Escape" onClick={onCancel}>
          {ui.cancel}
        </button>
      </div>
    </div>
  );
}

interface ListeningSlipProps {
  listening: Listening;
  call: Call;
  clock: number;
  problem: string | null;
  onStop: () => void;
}

/** What the operator hears on the line, revealed as the conversation goes on. */
export function ListeningSlip({ listening, call, clock, problem, onStop }: ListeningSlipProps) {
  const { ui, subscribers, stories } = useContent();
  const { plot, index } = parseFragmentId(listening.fragment);
  const lines = stories[plot].fragments[index] ?? [];
  const progress = (clock - listening.startedAt) / CONFIG.story.listenMs;
  const shown = Math.min(lines.length, Math.floor(progress * lines.length) + 1);
  const caller = subscribers[call.from];
  const callee = subscribers[call.to];

  return (
    <div className="slip slip--listening" role="dialog" aria-label={ui.listeningTo(caller, callee)}>
      <ol className="slip__transcript" aria-live="polite">
        {lines.slice(0, shown).map((line, i) => (
          <li key={i}>
            <span>{i % 2 === 0 ? caller : callee}</span>
            {line}
          </li>
        ))}
      </ol>
      {problem && <p className="slip__problem">{problem}</p>}
      <div className="slip__actions">
        <span>{ui.listeningTo(caller, callee)}</span>
        <button type="button" aria-keyshortcuts="L Escape" onClick={onStop}>
          {ui.stopListening}
        </button>
      </div>
    </div>
  );
}
