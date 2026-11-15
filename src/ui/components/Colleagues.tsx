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
    <ul className="colleagues" aria-label={ui.colleaguesTitle}>
      {apprentices.slice(0, hired).map((name, index) => {
        const present = index < working;
        return (
          <li key={name} className={present ? 'colleague' : 'colleague colleague--gone'}>
            <svg viewBox="0 0 20 24" aria-hidden="true">
              {present ? (
                <>
                  <circle cx="10" cy="7" r="5" />
                  <path d="M2 24 Q2 13 10 13 Q18 13 18 24 Z" />
                </>
              ) : (
                <path d="M4 10h12M5 10v12M15 10v12M6 3h8v7H6z" />
              )}
            </svg>
            {present ? ui.colleagueWorking(name) : ui.colleagueGone(name)}
          </li>
        );
      })}
    </ul>
  );
}
