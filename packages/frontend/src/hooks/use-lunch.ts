import { useCallback, useEffect, useRef, useState } from 'react';
import type { LunchPlaceRecord } from '@rayfin-app/shared';
import { teamDay } from '@/lib/lunch';
import { deletePlace, deleteVote, readLunch, savePlace, saveVote, type LunchSnapshot, type PlaceInput } from '@/lib/lunch-service';

interface LunchState {
  data: LunchSnapshot | null;
  day: string;
  loading: boolean;
  pending: boolean;
  error: string | null;
  notice: string;
}

export function useLunch() {
  const [state, setState] = useState<LunchState>({
    data: null, day: teamDay(), loading: true, pending: false, error: null, notice: '',
  });
  const data = useRef<LunchSnapshot | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    const request = ++generation.current;
    const day = teamDay();
    try {
      const next = await readLunch(day);
      if (request !== generation.current) return;
      data.current = next;
      setState((previous) => ({
        ...previous, data: next, day, loading: false, error: null,
      }));
    } catch (error) {
      if (request !== generation.current) return;
      console.error('Lunch Picker could not load team data.', error);
      setState((previous) => ({
        ...previous, day, loading: false,
        error: 'We could not load the lunch board. Check your connection and sign-in, then try again. If this is a new app, its database must be set up first.',
      }));
    }
  }, []);

  const invalidate = useCallback(() => { generation.current++; }, []);

  useEffect(() => {
    // Refresh sets state only after its async read settles, not during the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    return invalidate;
  }, [refresh, invalidate]);

  useEffect(() => {
    if (state.error) return;
    const interval = window.setInterval(() => { void refresh(); }, 30_000);
    const focus = () => { void refresh(); };
    window.addEventListener('focus', focus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', focus);
    };
  }, [refresh, state.error]);

  const mutate = useCallback(async (
    optimistic: (previous: LunchSnapshot) => LunchSnapshot,
    operation: (previous: LunchSnapshot) => Promise<LunchSnapshot>,
    notice: string,
  ): Promise<boolean> => {
    if (busy.current || !data.current) return false;
    busy.current = true;
    const request = ++generation.current;
    const previous = data.current;
    setState((current) => ({ ...current, data: optimistic(previous), pending: true, error: null, notice: '' }));
    try {
      const saved = await operation(previous);
      if (request !== generation.current) return false;
      data.current = saved;
      setState((current) => ({ ...current, data: saved, pending: false, notice }));
      return true;
    } catch (error) {
      if (request !== generation.current) return false;
      console.error('Lunch Picker could not save a change.', error);
      setState((current) => ({
        ...current, data: previous, pending: false,
        error: 'That change was not saved. Your previous choice is safe. Refresh and try again. A place with saved votes cannot be deleted.',
      }));
      return false;
    } finally {
      busy.current = false;
    }
  }, []);

  const suggest = (input: PlaceInput, editing?: LunchPlaceRecord) => {
    const temporaryId = `pending-${crypto.randomUUID()}`;
    return mutate(
      (previous) => ({
        ...previous,
        places: editing
          ? previous.places.map((place) => place.id === editing.id ? { ...place, ...input } : place)
          : [...previous.places, { ...input, id: temporaryId, owner_id: previous.userId }],
      }),
      async (previous) => {
        const saved = await savePlace(input, editing?.id);
        return {
          ...previous,
          places: editing
            ? previous.places.map((place) => place.id === editing.id ? saved : place)
            : [...previous.places, saved],
        };
      },
      editing ? 'Suggestion updated. Looking tasty!' : 'New spot on the menu. Nice find!',
    );
  };

  const vote = (placeId: string) => {
    const day = teamDay();
    return mutate(
      (previous) => ({
        ...previous,
        ballots: [
          ...previous.ballots.filter((ballot) => ballot.owner_id !== previous.userId),
          { id: previous.myBallot?.id ?? 'pending-vote', owner_id: previous.userId, day, place_id: placeId },
        ],
      }),
      async (previous) => {
        const saved = await saveVote(day, placeId, previous.myBallot);
        return {
          ...previous, myBallot: saved,
          ballots: [...previous.ballots.filter((ballot) => ballot.owner_id !== previous.userId), saved],
        };
      },
      'Vote saved! Good taste, by the way.',
    );
  };

  const withdraw = () => mutate(
    (previous) => ({ ...previous, ballots: previous.ballots.filter((ballot) => ballot.owner_id !== previous.userId) }),
    async (previous) => {
      if (!previous.myBallot) throw new Error('No vote to withdraw.');
      await deleteVote(previous.myBallot.id);
      return { ...previous, myBallot: null, ballots: previous.ballots.filter((ballot) => ballot.owner_id !== previous.userId) };
    },
    'Vote removed. Take another look at the menu.',
  );

  const remove = (id: string) => mutate(
    (previous) => ({ ...previous, places: previous.places.filter((place) => place.id !== id) }),
    async (previous) => {
      await deletePlace(id);
      return { ...previous, places: previous.places.filter((place) => place.id !== id) };
    },
    'Suggestion removed.',
  );

  return { ...state, refresh, suggest, vote, withdraw, remove };
}
