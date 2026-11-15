import type { CSSProperties, ReactNode } from 'react';
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
import { cordCount } from '../../game/upgrades';
import { useContent } from '../ContentContext';
import { Cords } from './Cords';
import { Jack, type LineState } from './Jack';
import { Shelf } from './Shelf';
import { SwitchCabinet } from './SwitchCabinet';

interface SwitchboardProps {
  state: GameState;
  selectedCall: Call | null;
  /** The jack a slip points at, and the slip itself. */
  slip: { anchor: SubscriberId; content: ReactNode } | null;
  listenable: Call | null;
  log: string;
  onJackPress: (id: SubscriberId) => void;
  onCabinetPress: (district: LocalDistrictId) => void;
  onAnswerNext: () => void;
  onListen: (callId: number) => void;
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

/** The whole cabinet: one row of jacks per district, the shelf, and the cords between. */
export function Switchboard({
  state,
  selectedCall,
  slip,
  listenable,
  log,
  onJackPress,
  onCabinetPress,
  onAnswerNext,
  onListen,
}: SwitchboardProps) {
  const { ui, districts } = useContent();
  const lines = visibleLines(state.calls);
  const patience = patienceMs(state);
  const heard = new Set(state.story.heard);
  const panels: DistrictId[] = [
    ...LOCAL_DISTRICTS.filter((d) => isOpen(state, d)),
    ...manualDistricts(state).filter((d) => d === 'trunk'),
  ];
  const connected = state.calls.filter((call) => call.status === 'connected');
  const usedCords = new Set(connected.flatMap((call) => (call.cord === null ? [] : [call.cord])));

  // A call into an automatic district lands in that district's cabinet.
  const holeOf = (call: Call, end: 'from' | 'to') => {
    const id = call[end];
    const district = districtOf(id);
    return district !== 'trunk' && isAutomated(state, district) ? `district-${district}` : id;
  };

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
        story={call?.status === 'connected' && call.fragment !== null && !heard.has(call.fragment)}
        onPress={onJackPress}
      />
    );
  };

  // The slip slides in right under the caller's row, its arrow on the caller's
  // jack, so it never hides a jack the operator may need next.
  const renderSlip = (district: DistrictId) => {
    if (!slip || districtOf(slip.anchor) !== district) return null;
    const slot = subscribersIn(district).indexOf(slip.anchor);
    const style = { '--slot-wide': slot % 8, '--slot-narrow': slot % 4 } as CSSProperties;
    return (
      <div className="district__slip" style={style}>
        {slip.content}
      </div>
    );
  };

  return (
    <section className="board" aria-label={ui.boardLabel}>
      <div className="board__field">
        {panels.map((district) => (
          <section key={district} className="district" aria-label={districts[district]}>
            <h2 className="district__name">{districts[district]}</h2>
            {district !== 'trunk' && isAutomated(state, district) ? (
              <SwitchCabinet
                district={district}
                // Only long-distance calls can reach an automatic district.
                awaitingTarget={selectedCall !== null && districtOf(selectedCall.from) === 'trunk'}
                onPress={onCabinetPress}
              />
            ) : (
              <ul className="district__row">{subscribersIn(district).map(renderJack)}</ul>
            )}
            {renderSlip(district)}
          </section>
        ))}
      </div>
      <Shelf
        totalCords={cordCount(state)}
        usedCords={usedCords}
        ringingCount={state.calls.filter((call) => call.status === 'ringing').length}
        listenable={state.listening ? null : listenable}
        log={log}
        onAnswerNext={onAnswerNext}
        onListen={onListen}
      />
      <Cords calls={connected} holeOf={holeOf} />
    </section>
  );
}
