import { useCallback, useEffect, useRef, useState } from 'react';
import { detectLocale } from '../../content';
import { connectCall, type ConnectOutcome } from '../../game/calls';
import { CONFIG } from '../../game/config';
import type { SubscriberId } from '../../game/directory';
import { advance, createInitialState } from '../../game/engine';
import { createSeed } from '../../game/rng';
import { fromSave, toSave, type Settings } from '../../game/save/schema';
import {
  browserStorage,
  loadSave,
  writeSave,
  type LoadResult,
  type SaveStorage,
} from '../../game/save/storage';
import type { GameEvent, GameState, StepResult, UpgradeId } from '../../game/types';
import { buyUpgrade } from '../../game/upgrades';

/**
 * A frame longer than this (a stalled tab, a debugger pause) only advances
 * the board by this much: live play is paused while the page is not visible.
 */
const MAX_FRAME_MS = 1_000;
/** Re-render cadence for smooth patience gauges without rendering every frame. */
const RENDER_INTERVAL_MS = 100;

interface Boot {
  storage: SaveStorage | null;
  status: LoadResult['status'];
  state: GameState;
  settings: Settings;
}

function boot(): Boot {
  const storage = browserStorage();
  const result = loadSave(storage);
  const seed = createSeed();
  if (result.status === 'loaded') {
    return {
      storage,
      status: result.status,
      state: fromSave(result.save, seed),
      settings: result.save.settings,
    };
  }
  return {
    storage,
    status: result.status,
    state: createInitialState(seed),
    settings: { muted: false, locale: detectLocale(navigator.languages) },
  };
}

export interface GameController {
  state: GameState;
  settings: Settings;
  bootStatus: LoadResult['status'];
  connect: (callId: number, target: SubscriberId) => ConnectOutcome;
  buy: (upgrade: UpgradeId) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

export function useGame(onEvents: (events: readonly GameEvent[]) => void): GameController {
  const [initial] = useState(boot);
  const [state, setState] = useState(initial.state);
  const [settings, setSettings] = useState(initial.settings);
  const stateRef = useRef(initial.state);
  const settingsRef = useRef(initial.settings);
  const onEventsRef = useRef(onEvents);

  useEffect(() => {
    onEventsRef.current = onEvents;
  }, [onEvents]);

  const persist = useCallback(() => {
    writeSave(initial.storage, toSave(stateRef.current, settingsRef.current, Date.now()));
  }, [initial.storage]);

  const commit = useCallback((result: StepResult) => {
    stateRef.current = result.state;
    if (result.events.length > 0) onEventsRef.current(result.events);
    setState(result.state);
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let lastRender = last;
    const loop = (now: number) => {
      const result = advance(stateRef.current, Math.min(now - last, MAX_FRAME_MS));
      last = now;
      stateRef.current = result.state;
      if (result.events.length > 0) onEventsRef.current(result.events);
      if (result.events.length > 0 || now - lastRender >= RENDER_INTERVAL_MS) {
        lastRender = now;
        setState(result.state);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(persist, CONFIG.save.autosaveMs);
    const onHide = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', persist);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', persist);
    };
  }, [persist]);

  const connect = useCallback(
    (callId: number, target: SubscriberId) => {
      const result = connectCall(stateRef.current, callId, target);
      commit(result);
      return result.outcome;
    },
    [commit],
  );

  const buy = useCallback(
    (upgrade: UpgradeId) => {
      commit(buyUpgrade(stateRef.current, upgrade));
      persist();
    },
    [commit, persist],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      settingsRef.current = { ...settingsRef.current, ...patch };
      setSettings(settingsRef.current);
      persist();
    },
    [persist],
  );

  return { state, settings, bootStatus: initial.status, connect, buy, updateSettings };
}
