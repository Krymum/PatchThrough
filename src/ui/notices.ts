import type { Content } from '../content/types';
import type { SubscriberId } from '../game/directory';
import type { Locale } from '../game/save/schema';
import type { GameEvent } from '../game/types';
import { formatMoney } from './format';

/**
 * A short message for the operator's status line. Notices store data, not
 * text, so they render correctly if the language changes while one is shown.
 */
export type Notice =
  | { kind: 'incoming'; from: SubscriberId }
  | { kind: 'lost'; from: SubscriberId }
  | { kind: 'connected'; from: SubscriberId; to: SubscriberId; payoutCents: number }
  | { kind: 'wrong-line'; to: SubscriberId }
  | { kind: 'no-free-cord' }
  | { kind: 'busy-listening' };

/** The notice worth showing for a batch of engine events, if any. */
export function noticeFromEvents(events: readonly GameEvent[]): Notice | null {
  let notice: Notice | null = null;
  for (const event of events) {
    if (event.type === 'call-incoming') notice = { kind: 'incoming', from: event.from };
    if (event.type === 'call-lost') notice = { kind: 'lost', from: event.from };
    // Apprentices' work shows on the board; only the operator's own calls get a line.
    if (event.type === 'call-connected' && event.handler === 'player') {
      notice = {
        kind: 'connected',
        from: event.from,
        to: event.to,
        payoutCents: event.payoutCents,
      };
    }
  }
  return notice;
}

export function noticeText(notice: Notice, { ui, subscribers }: Content, locale: Locale): string {
  switch (notice.kind) {
    case 'incoming':
      return ui.incoming(subscribers[notice.from]);
    case 'lost':
      return ui.callLost(subscribers[notice.from]);
    case 'connected':
      return ui.connected(
        subscribers[notice.from],
        subscribers[notice.to],
        formatMoney(notice.payoutCents, locale),
      );
    case 'wrong-line':
      return ui.wrongLine(subscribers[notice.to]);
    case 'no-free-cord':
      return ui.noFreeCord;
    case 'busy-listening':
      return ui.busyListening;
  }
}
