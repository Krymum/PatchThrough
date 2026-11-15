import type { LocalDistrictId } from '../../game/directory';
import { useContent } from '../ContentContext';

interface SwitchCabinetProps {
  district: LocalDistrictId;
  awaitingTarget: boolean;
  onPress: (district: LocalDistrictId) => void;
}

const RELAYS = Array.from({ length: 20 }, (_, i) => i);

/** Where a hand-switched district used to be, a grey cabinet of relays now stands. */
export function SwitchCabinet({ district, awaitingTarget, onPress }: SwitchCabinetProps) {
  const { ui, districts } = useContent();
  const name = districts[district];

  return (
    <button
      type="button"
      className={`switch${awaitingTarget ? ' switch--target' : ''}`}
      aria-label={`${name}, ${ui.automaticSwitch}`}
      onClick={() => {
        onPress(district);
      }}
    >
      <span className="switch__relays" aria-hidden="true">
        {RELAYS.map((i) => (
          <i key={i} style={{ animationDelay: `${(i * 137) % 900}ms` }} />
        ))}
      </span>
      <span className="switch__text">
        <strong>{ui.automaticSwitch}</strong> {ui.automaticSwitchNote}
      </span>
      <span className="jack__hole switch__trunk" data-hole={`district-${district}`} />
    </button>
  );
}
