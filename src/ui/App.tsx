import { useCallback, useEffect, useRef, useState } from 'react';
import { cuesFor } from '../audio/cues';
import { Synth } from '../audio/synth';
import { CONTENT } from '../content';
import {
  districtOf,
  subscribersIn,
  type LocalDistrictId,
  type SubscriberId,
} from '../game/directory';
import { hasEnded, isAutomated, passiveIncomeRate } from '../game/progression';
import { listenableCalls } from '../game/story';
import type { GameEvent } from '../game/types';
import { ContentContext } from './ContentContext';
import { AwayNotice } from './components/AwayNotice';
import { Colleagues } from './components/Colleagues';
import { Credits } from './components/Credits';
import { Header } from './components/Header';
import { Shop } from './components/Shop';
import { ListeningSlip, RequestSlip } from './components/Slips';
import { Switchboard } from './components/Switchboard';
import { useGame } from './hooks/useGame';
import { noticeFromEvents, noticeText, type Notice } from './notices';

const MS_PER_MINUTE = 60_000;

export function App() {
  /** The latest thing that happened on the board, typed on the shelf. */
  const [log, setLog] = useState<Notice | null>(null);
  /** Why the operator's last move did not work, written on the slip in hand. */
  const [problem, setProblem] = useState<Notice | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [synth] = useState(() => new Synth());

  const onEvents = useCallback(
    (events: readonly GameEvent[]) => {
      synth.play(cuesFor(events));
      const next = noticeFromEvents(events);
      if (next) setLog(next);
    },
    [synth],
  );

  const game = useGame(onEvents);
  const { state, settings, bootStatus } = game;
  const content = { ...CONTENT[settings.locale], locale: settings.locale };
  const ended = hasEnded(state);
  const listenable = listenableCalls(state);
  const ringing = state.calls.filter((call) => call.status === 'ringing');

  // A selected caller who hangs up or gets connected is no longer selectable.
  const selectedCall =
    state.calls.find((call) => call.id === selectedId && call.status === 'ringing') ?? null;

  const select = (callId: number | null) => {
    setSelectedId(callId);
    setProblem(null);
  };

  useEffect(() => {
    document.documentElement.lang = settings.locale;
    document.title = CONTENT[settings.locale].ui.title;
  }, [settings.locale]);

  useEffect(() => {
    synth.setMuted(settings.muted);
  }, [synth, settings.muted]);

  // Browsers only allow sound after a user gesture.
  useEffect(() => {
    const unlock = () => {
      synth.unlock();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [synth]);

  const tryConnect = (target: SubscriberId) => {
    if (!selectedCall) return;
    const outcome = game.connect(selectedCall.id, target);
    if (outcome === 'wrong-line') setProblem({ kind: 'wrong-line', to: selectedCall.to });
    if (outcome === 'no-free-cord') setProblem({ kind: 'no-free-cord' });
    if (outcome === 'listening') setProblem({ kind: 'busy-listening' });
    if (outcome === 'connected') select(null);
  };

  const onJackPress = (id: SubscriberId) => {
    if (state.listening) {
      setProblem({ kind: 'busy-listening' });
      return;
    }
    if (!selectedCall) {
      const caller = ringing.find((call) => call.from === id);
      if (caller) {
        select(caller.id);
        return;
      }
      // Pressing a jack that carries a conversation worth hearing listens in.
      const story = listenable.find((call) => call.from === id || call.to === id);
      if (story) game.listen(story.id);
      return;
    }
    if (id === selectedCall.from) {
      select(null);
      return;
    }
    tryConnect(id);
  };

  // A cabinet stands for every line of its district: it completes the call
  // when the callee lives there, and is a wrong jack otherwise.
  const onCabinetPress = (district: LocalDistrictId) => {
    if (!selectedCall) return;
    const target =
      districtOf(selectedCall.to) === district ? selectedCall.to : subscribersIn(district)[0];
    if (target) tryConnect(target);
  };

  // On small screens the oldest lamp may be scrolled away: select it and bring it into view.
  const onAnswerNext = () => {
    const oldest = ringing[0];
    if (state.listening || !oldest) return;
    select(oldest.id);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .querySelector(`[data-subscriber="${oldest.from}"]`)
      ?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const onListen = (callId: number) => {
    select(null);
    game.listen(callId);
  };

  const onStopListening = () => {
    setProblem(null);
    game.stopListen();
  };

  // Keyboard shortcuts read the latest handlers through a ref.
  const shortcuts = useRef<(event: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      shortcuts.current(event);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  useEffect(() => {
    shortcuts.current = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.ctrlKey || event.metaKey || event.altKey || target?.tagName === 'SELECT') return;
      const key = event.key.toLowerCase();
      if (key === 'escape') {
        if (state.listening) onStopListening();
        select(null);
      } else if (key === 'a' && !ended) {
        onAnswerNext();
      } else if (key === 'l' && !ended) {
        const latest = listenable.at(-1);
        if (state.listening) onStopListening();
        else if (latest) onListen(latest.id);
      }
    };
  });

  const problemText = problem ? noticeText(problem, content, content.locale) : null;
  const listeningCall = state.listening
    ? state.calls.find((call) => call.id === state.listening?.callId)
    : undefined;

  let slip = null;
  if (state.listening && listeningCall) {
    slip = {
      anchor: listeningCall.from,
      content: (
        <ListeningSlip
          listening={state.listening}
          call={listeningCall}
          clock={state.clock}
          problem={problemText}
          onStop={onStopListening}
        />
      ),
    };
  } else if (selectedCall) {
    const callee = districtOf(selectedCall.to);
    slip = {
      anchor: selectedCall.from,
      content: (
        <RequestSlip
          call={selectedCall}
          calleeIsAutomatic={callee !== 'trunk' && isAutomated(state, callee)}
          problem={problemText}
          onCancel={() => {
            select(null);
          }}
        />
      ),
    };
  }

  const bootMessage =
    bootStatus === 'unavailable'
      ? content.ui.storageUnavailable
      : bootStatus === 'corrupt'
        ? content.ui.saveRecovered
        : null;

  return (
    <ContentContext value={content}>
      <div className="room">
        <Header
          moneyCents={state.moneyCents}
          passivePerMinute={passiveIncomeRate(state) * MS_PER_MINUTE}
          muted={settings.muted}
          onToggleSound={() => {
            game.updateSettings({ muted: !settings.muted });
          }}
          onLocaleChange={(locale) => {
            game.updateSettings({ locale });
          }}
        />
        {bootMessage && (
          <p className="note" role="alert">
            {bootMessage}
          </p>
        )}
        {game.away && <AwayNotice report={game.away} onDismiss={game.dismissAway} />}
        <main className="room__main">
          {ended ? (
            <Credits
              state={state}
              onNewShift={() => {
                select(null);
                setLog(null);
                game.newShift();
              }}
            />
          ) : (
            <div className="room__board">
              <Switchboard
                state={state}
                selectedCall={selectedCall}
                slip={slip}
                listenable={listenable.at(-1) ?? null}
                log={log ? noticeText(log, content, content.locale) : ''}
                onJackPress={onJackPress}
                onCabinetPress={onCabinetPress}
                onAnswerNext={onAnswerNext}
                onListen={onListen}
              />
              <Colleagues state={state} />
            </div>
          )}
          <Shop state={state} onBuy={game.buy} />
        </main>
      </div>
    </ContentContext>
  );
}
