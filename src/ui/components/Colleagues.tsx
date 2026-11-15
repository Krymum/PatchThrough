import { activeApprentices } from '../../game/progression';
import type { GameState } from '../../game/types';
import { useContent } from '../ContentContext';

interface ColleaguesProps {
  state: GameState;
}

/**
 * The neighbouring positions: one seat per apprentice ever hired. The most
 * recently hired are the first to be let go when a switch arrives.
 */
export function Colleagues({ state }: ColleaguesProps) {
  const { ui, apprentices } = useContent();
  const hired = state.upgrades.apprentice;
  if (hired === 0) return null;
  const working = activeApprentices(state);

  return (
    <section className="colleagues" aria-labelledby="colleagues-title">
      <h2 id="colleagues-title">{ui.colleaguesTitle}</h2>
      <ul className="colleagues__seats">
        {apprentices.slice(0, hired).map((name, index) => {
          const present = index < working;
          return (
            <li key={name} className={`seat${present ? '' : ' seat--empty'}`}>
              <svg viewBox="0 0 40 48" aria-hidden="true">
                {present ? (
                  <g className="seat__operator">
                    <circle cx="20" cy="14" r="8" />
                    <path d="M8 44 Q8 26 20 26 Q32 26 32 44 Z" />
                    <path className="seat__headset" d="M11 14 Q11 4 20 4 Q29 4 29 14" />
                  </g>
                ) : (
                  <g className="seat__chair">
                    <rect x="10" y="20" width="20" height="4" rx="1" />
                    <rect x="12" y="6" width="16" height="14" rx="2" />
                    <rect x="12" y="24" width="2" height="18" />
                    <rect x="26" y="24" width="2" height="18" />
                  </g>
                )}
              </svg>
              <span>{present ? ui.colleagueWorking(name) : ui.colleagueGone(name)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
