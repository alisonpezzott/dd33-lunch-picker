import type { LunchBallotRecord, LunchPlaceRecord } from '@rayfin-app/shared';
import { getRayfinClient } from './rayfin-client';
import { collectPages } from './lunch';

export type PlaceInput = Pick<LunchPlaceRecord, 'name' | 'cuisine' | 'budget' | 'note'>;

export interface LunchSnapshot {
  places: LunchPlaceRecord[];
  ballots: LunchBallotRecord[];
  myBallot: LunchBallotRecord | null;
  userId: string;
}

async function signedInClient() {
  const client = await getRayfinClient();
  const session = client.auth.getSession();
  if (!session.isAuthenticated || !session.user) throw new Error('Please sign in again to join the lunch vote.');
  return { client, userId: session.user.id };
}

export async function readLunch(day: string): Promise<LunchSnapshot> {
  const { client, userId } = await signedInClient();
  const ballotFields = ['id', 'owner_id', 'day', 'place_id'] as const;
  const [places, ballots, own] = await Promise.all([
    collectPages(async (cursor) => {
      const query = client.data.LunchPlace.select(['id', 'name', 'cuisine', 'budget', 'note', 'owner_id'])
        .orderBy({ id: 'asc' }).first(100);
      return (cursor ? query.after(cursor) : query).executePaginated();
    }),
    collectPages(async (cursor) => {
      const query = client.data.LunchBallot.select(ballotFields)
        .where({ day: { eq: day } }).orderBy({ id: 'asc' }).first(100);
      return (cursor ? query.after(cursor) : query).executePaginated();
    }),
    client.data.LunchBallot.select(ballotFields).where({ owner_id: { eq: userId } }).first(1).execute(),
  ]);
  return { places, ballots, myBallot: own[0] ?? null, userId };
}

export async function savePlace(input: PlaceInput, id?: string): Promise<LunchPlaceRecord> {
  const { client, userId } = await signedInClient();
  if (id) {
    const saved = await client.data.LunchPlace.update({ id }, input);
    return { ...input, owner_id: userId, ...saved };
  }
  return client.data.LunchPlace.create({ ...input, owner_id: userId });
}

export async function deletePlace(id: string): Promise<void> {
  const { client } = await signedInClient();
  await client.data.LunchPlace.delete({ id });
}

export async function saveVote(day: string, placeId: string, previous: LunchBallotRecord | null): Promise<LunchBallotRecord> {
  const { client, userId } = await signedInClient();
  if (previous) {
    const saved = await client.data.LunchBallot.update({ id: previous.id }, { day, place_id: placeId });
    return { ...previous, ...saved };
  }
  return client.data.LunchBallot.create({ day, place_id: placeId, owner_id: userId });
}

export async function deleteVote(id: string): Promise<void> {
  const { client } = await signedInClient();
  await client.data.LunchBallot.delete({ id });
}
