import { useCallback, useEffect, useRef, useState } from 'react';
import { cuesFor } from '../audio/cues';
import { Synth } from '../audio/synth';
import { CONTENT } from '../content';
import { freeCords } from '../game/calls';
import {
  districtOf,
  subscribersIn,
  type LocalDistrictId,
  type SubscriberId,
} from '../game/directory';
import { hasEnded, isAutomated, passiveIncomeRate } from '../game/progression';
import { listenableCalls } from '../game/story';
import type { GameEvent } from '../game/types';
import { cordCount } from '../game/upgrades';
import { ContentContext } from './ContentContext';
import { AwayNotice } from './components/AwayNotice';
import { Colleagues } from './components/Colleagues';
import { Credits } from './components/Credits';
import { Ledger } from './components/Ledger';
import { OperatorDesk, type ListeningView } from './components/OperatorDesk';
import { Shop } from './components/Shop';
import { Switchboard } from './components/Switchboard';
import { useGame } from './hooks/useGame';
import { noticeFromEvents, type Notice } from './notices';

const MS_PER_MINUTE = 60_000;

export function App() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [synth] = useState(() => new Synth());

  const onEvents = useCallback(
    (events: readonly GameEvent[]) => {
      synth.play(cuesFor(events));
      const next = noticeFromEvents(events);
      if (next) setNotice(next);
    },
    [synth],
  );

  const game = useGame(onEvents);
  const { state, settings, bootStatus } = game;
  const content = { ...CONTENT[settings.locale], locale: settings.locale };
  const ended = hasEnded(state);

  // A selected caller who hangs up or gets connected is no longer selectable.
  const selectedCall =
    state.calls.find((call) => call.id === selectedId && call.status === 'ringing') ?? null;

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

  const tryConnect = (target: SubscriberId) => {
    if (!selectedCall) return;
    const outcome = game.connect(selectedCall.id, target);
    if (outcome === 'wrong-line') setNotice({ kind: 'wrong-line', to: selectedCall.to });
    if (outcome === 'no-free-cord') setNotice({ kind: 'no-free-cord' });
    if (outcome === 'listening') setNotice({ kind: 'busy-listening' });
    if (outcome === 'connected') setSelectedId(null);
  };

  const listenable = listenableCalls(state);

  const onJackPress = (id: SubscriberId) => {
    if (state.listening) {
      setNotice({ kind: 'busy-listening' });
      return;
    }
    if (!selectedCall) {
      const caller = state.calls.find((call) => call.status === 'ringing' && call.from === id);
      if (caller) {
        setSelectedId(caller.id);
        return;
      }
      // Pressing a jack that carries a conversation worth hearing listens in.
      const story = listenable.find((call) => call.from === id || call.to === id);
      if (story) game.listen(story.id);
      return;
    }
    if (id === selectedCall.from) {
      setSelectedId(null);
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

  const ringing = state.calls.filter((call) => call.status === 'ringing');

  // On small screens the oldest lamp may be scrolled away: select it and bring it into view.
  const onAnswerNext = () => {
    const oldest = ringing[0];
    if (state.listening) return;
    if (!oldest) return;
    setSelectedId(oldest.id);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .querySelector(`[data-subscriber="${oldest.from}"]`)
      ?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const listeningCall = state.listening
    ? state.calls.find((call) => call.id === state.listening?.callId)
    : undefined;
  const listening: ListeningView | null =
    state.listening && listeningCall
      ? { listening: state.listening, call: listeningCall, clock: state.clock }
      : null;

  useEffect(() => {
    shortcuts.current = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.ctrlKey || event.metaKey || event.altKey || target?.tagName === 'SELECT') return;
      const key = event.key.toLowerCase();
      if (key === 'escape') {
        if (state.listening) game.stopListen();
        setSelectedId(null);
      } else if (key === 'a' && !ended) {
        onAnswerNext();
      } else if (key === 'l' && !ended) {
        if (state.listening) game.stopListen();
        else {
          const latest = listenable.at(-1);
          if (latest) game.listen(latest.id);
        }
      }
    };
  });

  const callee = selectedCall ? districtOf(selectedCall.to) : null;
  const calleeIsAutomatic = callee !== null && callee !== 'trunk' && isAutomated(state, callee);

  const bootMessage =
    bootStatus === 'unavailable'
      ? content.ui.storageUnavailable
      : bootStatus === 'corrupt'
        ? content.ui.saveRecovered
        : null;

  return (
    <ContentContext value={content}>
      <div className="app">
        <Ledger
          moneyCents={state.moneyCents}
          passivePerMinute={passiveIncomeRate(state) * MS_PER_MINUTE}
          freeCords={freeCords(state)}
          totalCords={cordCount(state)}
          muted={settings.muted}
          onToggleSound={() => {
            game.updateSettings({ muted: !settings.muted });
          }}
          onLocaleChange={(locale) => {
            game.updateSettings({ locale });
          }}
        />
        {bootMessage && (
          <p className="banner" role="alert">
            {bootMessage}
          </p>
        )}
        {game.away && <AwayNotice report={game.away} onDismiss={game.dismissAway} />}
        <main className="app__main">
          {ended ? (
            <Credits
              state={state}
              onNewShift={() => {
                setSelectedId(null);
                setNotice(null);
                game.newShift();
              }}
            />
          ) : (
            <div className="app__board">
              <Switchboard
                state={state}
                selectedCall={selectedCall}
                onJackPress={onJackPress}
                onCabinetPress={onCabinetPress}
              />
              <Colleagues state={state} />
            </div>
          )}
          <Shop state={state} onBuy={game.buy} />
        </main>
        {!ended && (
          <OperatorDesk
            selectedCall={selectedCall}
            calleeIsAutomatic={calleeIsAutomatic}
            ringingCount={ringing.length}
            listening={listening}
            listenable={listenable.at(-1) ?? null}
            notice={notice}
            onAnswerNext={onAnswerNext}
            onListen={game.listen}
            onStopListening={game.stopListen}
            onCancel={() => {
              setSelectedId(null);
            }}
          />
        )}
      </div>
    </ContentContext>
  );
}
