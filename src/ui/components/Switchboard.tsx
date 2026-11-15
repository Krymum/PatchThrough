import {
  LOCAL_DISTRICTS,
  districtOf,
  subscribersIn,
  type DistrictId,
  type LocalDistrictId,
  type SubscriberId,
} from '../../game/directory';
import { isAutomated, isOpen, manualDistricts, patienceMs } from '../../game/progression';
import type { Call, GameState } from '../../game/types';
import { useContent } from '../ContentContext';
import { Cabinet } from './Cabinet';
import { Jack, type LineState } from './Jack';

interface SwitchboardProps {
  state: GameState;
  selectedCall: Call | null;
  onJackPress: (id: SubscriberId) => void;
  onCabinetPress: (district: LocalDistrictId) => void;
}

/**
 * What the operator can see on each jack. A callee whose phone is not ringing
 * yet looks idle: the board only shows who is calling and who is talking.
 */
function visibleLines(calls: readonly Call[]): Map<SubscriberId, Call> {
  const lines = new Map<SubscriberId, Call>();
  for (const call of calls) {
    lines.set(call.from, call);
    if (call.status === 'connected') lines.set(call.to, call);
  }
  return lines;
}

export function Switchboard({
  state,
  selectedCall,
  onJackPress,
  onCabinetPress,
}: SwitchboardProps) {
  const { ui, districts } = useContent();
  const lines = visibleLines(state.calls);
  const patience = patienceMs(state);
  const panels: DistrictId[] = [
    ...LOCAL_DISTRICTS.filter((d) => isOpen(state, d)),
    ...manualDistricts(state).filter((d) => d === 'trunk'),
  ];

  const renderJack = (id: SubscriberId) => {
    const call = lines.get(id);
    const line: LineState =
      call === undefined
        ? 'idle'
        : call.status === 'ringing'
          ? 'ringing'
          : (call.handler ?? 'idle');
    return (
      <Jack
        key={id}
        id={id}
        line={line}
        patience={
          call?.status === 'ringing' ? Math.max(0, (call.expiresAt - state.clock) / patience) : 0
        }
        selected={selectedCall?.from === id}
        awaitingTarget={selectedCall !== null && selectedCall.from !== id}
        onPress={onJackPress}
      />
    );
  };

  return (
    <section className="board" aria-label={ui.boardLabel}>
      {panels.map((district) => {
        if (district !== 'trunk' && isAutomated(state, district)) {
          const busy = state.calls.some(
            (call) => call.status === 'connected' && districtOf(call.to) === district,
          );
          return (
            <Cabinet
              key={district}
              district={district}
              busy={busy}
              awaitingTarget={selectedCall !== null}
              onPress={onCabinetPress}
            />
          );
        }
        return (
          <section
            key={district}
            className={`board__panel board__panel--${district}`}
            aria-label={districts[district]}
          >
            <h2 className="board__heading">{districts[district]}</h2>
            <ul className="board__grid">{subscribersIn(district).map(renderJack)}</ul>
          </section>
        );
      })}
    </section>
  );
}
