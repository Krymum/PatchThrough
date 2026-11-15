import { describe, expect, it } from 'vitest';
import { connectCall, spawnCall } from './calls';
import { CONFIG } from './config';
import { districtOf } from './directory';
import { advance } from './engine';
import {
  FRAGMENT_COUNT,
  PLOTS,
  PLOT_IDS,
  dueFragment,
  isFragmentId,
  listenableCalls,
  parseFragmentId,
  plotHoldingUpgrade,
  startListening,
  stopListening,
} from './story';
import { connectedCall, ringingCall, stateWith, toldStory } from './testHelpers';

describe('plots', () => {
  it('keep each conversation inside its district, except long distance', () => {
    for (const id of PLOT_IDS) {
      const plot = PLOTS[id];
      for (const { from, to } of plot.fragments) {
        expect(from).not.toBe(to);
        expect(districtOf(from)).toBe(plot.district);
        if (plot.district !== 'trunk') expect(districtOf(to)).toBe(plot.district);
      }
    }
  });

  it('count between four and five plots, a few dozen fragments in all', () => {
    expect(PLOT_IDS.length).toBeGreaterThanOrEqual(4);
    expect(PLOT_IDS.length).toBeLessThanOrEqual(5);
    expect(FRAGMENT_COUNT).toBeGreaterThan(20);
  });

  it('name fragments that round-trip and validate', () => {
    expect(parseFragmentId('longDistance-3')).toEqual({ plot: 'longDistance', index: 2 });
    expect(isFragmentId('looms-1')).toBe(true);
    expect(isFragmentId('looms-0')).toBe(false);
    expect(isFragmentId('looms-99')).toBe(false);
    expect(isFragmentId('nope-1')).toBe(false);
    expect(isFragmentId(3)).toBe(false);
  });
});

describe('story calls', () => {
  it('place the next fragment of a live plot', () => {
    const state = stateWith();
    expect(dueFragment(state, new Set())).toEqual({
      id: 'grocery-1',
      from: 'grocer',
      to: 'doctor',
    });
    const { state: next, events } = spawnCall(state);
    expect(next.calls[0]).toMatchObject({ from: 'grocer', to: 'doctor', fragment: 'grocery-1' });
    expect(events).toHaveLength(1);
  });

  it('wait between two story calls, and longer between fragments of one plot', () => {
    const placed = spawnCall(stateWith()).state;
    const cleared = { ...placed, calls: [] };
    expect(dueFragment({ ...cleared, clock: CONFIG.story.callGapMs - 1 }, new Set())).toBeNull();
    const later = { ...cleared, clock: CONFIG.story.callGapMs };
    expect(dueFragment(later, new Set())).toBeNull();
    const muchLater = { ...cleared, clock: CONFIG.story.plotGapMs };
    expect(dueFragment(muchLater, new Set())?.id).toBe('grocery-1');
  });

  it('give priority to the district automated first', () => {
    const state = stateWith({ upgrades: { extendMill: 1 } });
    expect(dueFragment(state, new Set())?.id).toBe('looms-1');
  });

  it('wait for both subscribers to be free', () => {
    expect(dueFragment(stateWith(), new Set(['doctor']))).toBeNull();
  });

  it('do not ring twice for the same fragment', () => {
    const state = stateWith({ calls: [ringingCall(1, { fragment: 'grocery-1' })] });
    expect(dueFragment(state, new Set())).toBeNull();
  });

  it('skip districts that are not on the board', () => {
    const state = stateWith({ upgrades: { dial: 1 }, story: toldStory() });
    expect(
      dueFragment(
        { ...state, story: { ...state.story, offered: { ...state.story.offered, grocery: 0 } } },
        new Set(),
      ),
    ).toBeNull();
  });

  it('count as told once connected, by anyone, and stay on the line long enough', () => {
    const state = stateWith({ calls: [ringingCall(1, { fragment: 'grocery-1' })] });
    const { state: next } = connectCall(state, 1, 'doctor');
    expect(next.story.offered.grocery).toBe(1);
    const call = next.calls[0];
    expect((call?.endsAt ?? 0) - next.clock).toBeGreaterThanOrEqual(CONFIG.story.minCallMs);
  });

  it('hold back the switch of a district until its plot is told', () => {
    expect(plotHoldingUpgrade(stateWith(), 'switchMill')).toBe('looms');
    expect(plotHoldingUpgrade(stateWith({ story: toldStory() }), 'switchMill')).toBeNull();
    expect(plotHoldingUpgrade(stateWith(), 'cord')).toBeNull();
  });
});

describe('listening', () => {
  const story = connectedCall(1, { fragment: 'grocery-1' });

  it('only works on connected calls with something unheard', () => {
    const plain = stateWith({ calls: [connectedCall(1)] });
    expect(startListening(plain, 1).outcome).toBe('nothing-to-hear');
    const ringingStory = stateWith({ calls: [ringingCall(1, { fragment: 'grocery-1' })] });
    expect(startListening(ringingStory, 1).outcome).toBe('nothing-to-hear');
    const heard = stateWith({
      calls: [story],
      story: { ...stateWith().story, heard: ['grocery-1'] },
    });
    expect(listenableCalls(heard)).toEqual([]);
  });

  it('keeps the operator from connecting other calls', () => {
    const state = stateWith({ calls: [story, ringingCall(2, { from: 'bakery', to: 'garage' })] });
    const listening = startListening(state, 1);
    expect(listening.outcome).toBe('listening');
    expect(startListening(listening.state, 1).outcome).toBe('already-listening');
    expect(connectCall(listening.state, 2, 'garage').outcome).toBe('listening');
    const stopped = stopListening(listening.state).state;
    expect(connectCall(stopped, 2, 'garage').outcome).toBe('connected');
  });

  it('marks the fragment heard after listening to the end', () => {
    const state = stateWith({ calls: [story] });
    const listening = startListening(state, 1).state;
    const { state: after, events } = advance(listening, CONFIG.story.listenMs);
    expect(after.listening).toBeNull();
    expect(after.story.heard).toEqual(['grocery-1']);
    expect(events).toContainEqual({ type: 'fragment-heard', fragment: 'grocery-1' });
  });

  it('does not count a conversation the operator hung up on', () => {
    const state = stateWith({ calls: [story] });
    const listening = startListening(state, 1).state;
    const halfway = advance(listening, CONFIG.story.listenMs / 2).state;
    const stopped = stopListening(halfway).state;
    expect(advance(stopped, CONFIG.story.listenMs).state.story.heard).toEqual([]);
  });

  it('ends without credit when the line goes dead', () => {
    const shortCall = connectedCall(1, { fragment: 'grocery-1', endsAt: 1_000 });
    const listening = startListening(stateWith({ calls: [shortCall] }), 1).state;
    const { state } = advance(listening, CONFIG.story.listenMs);
    expect(state.listening).toBeNull();
    expect(state.story.heard).toEqual([]);
  });
});
