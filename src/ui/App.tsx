import { useCallback, useEffect, useState } from 'react';
import { CONTENT } from '../content';
import { freeCords } from '../game/calls';
import type { SubscriberId } from '../game/directory';
import type { GameEvent } from '../game/types';
import { cordCount } from '../game/upgrades';
import { ContentContext } from './ContentContext';
import { Ledger } from './components/Ledger';
import { OperatorDesk } from './components/OperatorDesk';
import { Shop } from './components/Shop';
import { Switchboard } from './components/Switchboard';
import { useGame } from './hooks/useGame';
import { noticeFromEvents, type Notice } from './notices';

export function App() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const onEvents = useCallback((events: readonly GameEvent[]) => {
    const next = noticeFromEvents(events);
    if (next) setNotice(next);
  }, []);

  const game = useGame(onEvents);
  const { state, settings, bootStatus } = game;
  const content = { ...CONTENT[settings.locale], locale: settings.locale };

  // A selected caller who hangs up or gets connected is no longer selectable.
  const selectedCall =
    state.calls.find((call) => call.id === selectedId && call.status === 'ringing') ?? null;

  useEffect(() => {
    document.documentElement.lang = settings.locale;
    document.title = CONTENT[settings.locale].ui.title;
  }, [settings.locale]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const onJackPress = (id: SubscriberId) => {
    if (!selectedCall) {
      const caller = state.calls.find((call) => call.status === 'ringing' && call.from === id);
      if (caller) setSelectedId(caller.id);
      return;
    }
    if (id === selectedCall.from) {
      setSelectedId(null);
      return;
    }
    const outcome = game.connect(selectedCall.id, id);
    if (outcome === 'wrong-line') setNotice({ kind: 'wrong-line', to: selectedCall.to });
    if (outcome === 'no-free-cord') setNotice({ kind: 'no-free-cord' });
    if (outcome === 'connected') setSelectedId(null);
  };

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
          freeCords={freeCords(state)}
          totalCords={cordCount(state)}
          onLocaleChange={(locale) => {
            game.updateSettings({ locale });
          }}
        />
        {bootMessage && (
          <p className="banner" role="alert">
            {bootMessage}
          </p>
        )}
        <main className="app__main">
          <Switchboard
            calls={state.calls}
            clock={state.clock}
            selectedCall={selectedCall}
            onJackPress={onJackPress}
          />
          <Shop state={state} onBuy={game.buy} />
        </main>
        <OperatorDesk
          selectedCall={selectedCall}
          notice={notice}
          onCancel={() => {
            setSelectedId(null);
          }}
        />
      </div>
    </ContentContext>
  );
}
