import { useState } from 'react';
import { FRAGMENT_COUNT, PLOTS, PLOT_IDS, parseFragmentId } from '../../game/story';
import type { GameState } from '../../game/types';
import { useContent } from '../ContentContext';

interface CreditsProps {
  state: GameState;
  onNewShift: () => void;
}

const MS_PER_MINUTE = 60_000;

/** The end of the game: the last word, what became of everyone, and the credits. */
export function Credits({ state, onNewShift }: CreditsProps) {
  const { ui, stories } = useContent();
  const [confirming, setConfirming] = useState(false);
  const heardByPlot = (plot: (typeof PLOT_IDS)[number]) =>
    state.story.heard.filter((id) => parseFragmentId(id).plot === plot).length;
  const minutes = Math.round(state.stats.playMs / MS_PER_MINUTE);
  const played = ui.duration(Math.floor(minutes / 60), minutes % 60);

  return (
    <section className="credits" aria-labelledby="credits-title">
      <h2 id="credits-title">{ui.endedTitle}</h2>
      <p className="credits__lead">{ui.endedText}</p>

      <h3>{ui.whatBecameTitle}</h3>
      <ul className="credits__epilogues">
        {PLOT_IDS.map((plot) => (
          <li key={plot}>
            <h4>{stories[plot].title}</h4>
            <p>{stories[plot].epilogue}</p>
            <p className="credits__heard">
              {ui.heardOf(heardByPlot(plot), PLOTS[plot].fragments.length)}
            </p>
          </li>
        ))}
      </ul>

      <h3>{ui.statsTitle}</h3>
      <ul className="credits__stats">
        <li>{ui.statPlayed(played)}</li>
        <li>{ui.statConnected(state.stats.connected)}</li>
        <li>{ui.statMissed(state.stats.missed)}</li>
        <li>{ui.statHeard(state.story.heard.length, FRAGMENT_COUNT)}</li>
      </ul>

      <div className="credits__roll">
        <p className="credits__name">{ui.creditsTitle}</p>
        {ui.creditsLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <button
        type="button"
        className={confirming ? 'button' : 'button button--quiet'}
        onClick={() => {
          if (confirming) onNewShift();
          else setConfirming(true);
        }}
      >
        {confirming ? ui.newShiftConfirm : ui.newShift}
      </button>
    </section>
  );
}
