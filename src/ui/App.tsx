import { useCallback, useEffect, useState } from 'react';
import { CONTENT } from '../content';
import { freeCords } from '../game/calls';
import {
  districtOf,
  subscribersIn,
  type LocalDistrictId,
  type SubscriberId,
} from '../game/directory';
import { hasEnded, isAutomated, passiveIncomeRate } from '../game/progression';
import type { GameEvent } from '../game/types';
import { cordCount } from '../game/upgrades';
import { ContentContext } from './ContentContext';
import { AwayNotice } from './components/AwayNotice';
import { Colleagues } from './components/Colleagues';
import { Ledger } from './components/Ledger';
import { OperatorDesk } from './components/OperatorDesk';
import { Shop } from './components/Shop';
import { Switchboard } from './components/Switchboard';
import { useGame } from './hooks/useGame';
import { noticeFromEvents, type Notice } from './notices';

const MS_PER_MINUTE = 60_000;

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
  const ended = hasEnded(state);

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

  const tryConnect = (target: SubscriberId) => {
    if (!selectedCall) return;
    const outcome = game.connect(selectedCall.id, target);
    if (outcome === 'wrong-line') setNotice({ kind: 'wrong-line', to: selectedCall.to });
    if (outcome === 'no-free-cord') setNotice({ kind: 'no-free-cord' });
    if (outcome === 'connected') setSelectedId(null);
  };

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
    if (!oldest) return;
    setSelectedId(oldest.id);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .querySelector(`[data-subscriber="${oldest.from}"]`)
      ?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

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
            <section className="ended" aria-labelledby="ended-title">
              <h2 id="ended-title">{content.ui.endedTitle}</h2>
              <p>{content.ui.endedText}</p>
            </section>
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
            notice={notice}
            onAnswerNext={onAnswerNext}
            onCancel={() => {
              setSelectedId(null);
            }}
          />
        )}
      </div>
    </ContentContext>
  );
}
