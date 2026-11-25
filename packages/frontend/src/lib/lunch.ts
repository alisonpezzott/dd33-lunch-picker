import type { LunchBallotRecord, LunchPlaceRecord } from '@rayfin-app/shared';

export const TEAM_TIMEZONE = 'America/Sao_Paulo';

export function teamDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TEAM_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function dailyResults(
  places: readonly LunchPlaceRecord[],
  ballots: readonly LunchBallotRecord[],
  day: string,
) {
  const counts = new Map<string, number>();
  const validPlaces = new Set(places.map((place) => place.id));
  const voters = new Set<string>();
  for (const ballot of ballots) {
    if (ballot.day !== day || !validPlaces.has(ballot.place_id) || voters.has(ballot.owner_id)) continue;
    voters.add(ballot.owner_id);
    counts.set(ballot.place_id, (counts.get(ballot.place_id) ?? 0) + 1);
  }
  const ranked = places.map((place) => ({ ...place, votes: counts.get(place.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const high = ranked[0]?.votes ?? 0;
  return { ranked, total: voters.size, leaders: high ? ranked.filter((place) => place.votes === high) : [] };
}

interface Page<T> {
  items: T[];
  hasNextPage: boolean;
  endCursor?: string | null;
}

export async function collectPages<T>(read: (cursor?: string) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (;;) {
    const page = await read(cursor);
    items.push(...page.items);
    if (!page.hasNextPage) return items;
    if (!page.endCursor || seen.has(page.endCursor)) throw new Error('The lunch list could not finish loading. Please refresh.');
    cursor = page.endCursor;
    seen.add(cursor);
  }
}
