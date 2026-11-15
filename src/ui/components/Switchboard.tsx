import { CONFIG } from '../../game/config';
import { SUBSCRIBER_IDS, type SubscriberId } from '../../game/directory';
import type { Call } from '../../game/types';
import { useContent } from '../ContentContext';
import { Jack, type LineState } from './Jack';

interface SwitchboardProps {
  calls: readonly Call[];
  clock: number;
  selectedCall: Call | null;
  onJackPress: (id: SubscriberId) => void;
}

/**
 * What the operator can see on each jack. A callee whose phone is not ringing
 * yet looks idle: the board only shows who is calling and who is talking.
 */
function lineStates(calls: readonly Call[]): Map<SubscriberId, Call> {
  const lines = new Map<SubscriberId, Call>();
  for (const call of calls) {
    lines.set(call.from, call);
    if (call.status === 'connected') lines.set(call.to, call);
  }
  return lines;
}

export function Switchboard({ calls, clock, selectedCall, onJackPress }: SwitchboardProps) {
  const { ui } = useContent();
  const lines = lineStates(calls);

  return (
    <section className="board" aria-label={ui.boardLabel}>
      <ul className="board__grid">
        {SUBSCRIBER_IDS.map((id) => {
          const call = lines.get(id);
          const line: LineState = call?.status ?? 'idle';
          const patience =
            call?.status === 'ringing'
              ? Math.max(0, (call.expiresAt - clock) / CONFIG.calls.patienceMs)
              : 0;
          return (
            <Jack
              key={id}
              id={id}
              line={line}
              patience={patience}
              selected={selectedCall?.from === id}
              awaitingTarget={selectedCall !== null && selectedCall.from !== id}
              onPress={onJackPress}
            />
          );
        })}
      </ul>
    </section>
  );
}
