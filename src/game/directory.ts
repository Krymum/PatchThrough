/**
 * The town's telephone directory: which subscribers exist and which
 * district they belong to. Display names live in the content files,
 * keyed by subscriber id.
 */

export const DISTRICTS = ['main'] as const;
export type DistrictId = (typeof DISTRICTS)[number];

export const SUBSCRIBERS = [
  { id: 'grocer', district: 'main' },
  { id: 'doctor', district: 'main' },
  { id: 'bakery', district: 'main' },
  { id: 'garage', district: 'main' },
  { id: 'school', district: 'main' },
  { id: 'hotel', district: 'main' },
  { id: 'pharmacy', district: 'main' },
  { id: 'newspaper', district: 'main' },
] as const satisfies readonly { id: string; district: DistrictId }[];

export type SubscriberId = (typeof SUBSCRIBERS)[number]['id'];

export const SUBSCRIBER_IDS: readonly SubscriberId[] = SUBSCRIBERS.map((s) => s.id);
