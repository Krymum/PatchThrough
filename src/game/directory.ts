/**
 * The town's telephone directory: which subscribers exist and which
 * district they belong to. Display names live in the content files,
 * keyed by subscriber and district id.
 */

/** Local districts, in the order the exchange opens them. */
export const LOCAL_DISTRICTS = ['main', 'mill', 'hill', 'river'] as const;
export type LocalDistrictId = (typeof LOCAL_DISTRICTS)[number];

/** The long-distance trunk behaves like a district with a single line. */
export type DistrictId = LocalDistrictId | 'trunk';

export const SUBSCRIBERS = [
  { id: 'grocer', district: 'main' },
  { id: 'doctor', district: 'main' },
  { id: 'bakery', district: 'main' },
  { id: 'garage', district: 'main' },
  { id: 'school', district: 'main' },
  { id: 'hotel', district: 'main' },
  { id: 'pharmacy', district: 'main' },
  { id: 'newspaper', district: 'main' },

  { id: 'mill', district: 'mill' },
  { id: 'foreman', district: 'mill' },
  { id: 'boardingHouse', district: 'mill' },
  { id: 'tavern', district: 'mill' },
  { id: 'fireStation', district: 'mill' },
  { id: 'chapel', district: 'mill' },

  { id: 'mayor', district: 'hill' },
  { id: 'judge', district: 'hill' },
  { id: 'widow', district: 'hill' },
  { id: 'banker', district: 'hill' },
  { id: 'pianoTeacher', district: 'hill' },
  { id: 'colonel', district: 'hill' },

  { id: 'ferry', district: 'river' },
  { id: 'boatyard', district: 'river' },
  { id: 'farm', district: 'river' },
  { id: 'veterinarian', district: 'river' },
  { id: 'dancehall', district: 'river' },
  { id: 'lockKeeper', district: 'river' },

  { id: 'longDistance', district: 'trunk' },
] as const satisfies readonly { id: string; district: DistrictId }[];

export type SubscriberId = (typeof SUBSCRIBERS)[number]['id'];

export const SUBSCRIBER_IDS: readonly SubscriberId[] = SUBSCRIBERS.map((s) => s.id);

const DISTRICT_OF = new Map<SubscriberId, DistrictId>(SUBSCRIBERS.map((s) => [s.id, s.district]));

export function districtOf(id: SubscriberId): DistrictId {
  const district = DISTRICT_OF.get(id);
  if (!district) throw new Error(`Unknown subscriber: ${id}`);
  return district;
}

export function subscribersIn(district: DistrictId): SubscriberId[] {
  return SUBSCRIBERS.filter((s) => s.district === district).map((s) => s.id);
}
