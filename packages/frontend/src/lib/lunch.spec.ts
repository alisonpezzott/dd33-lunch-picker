import { describe, expect, it } from 'vitest';
import { collectPages, dailyResults, teamDay } from './lunch';

describe('team lunch day', () => {
  it('resets exactly at Sao Paulo midnight, independent of browser timezone', () => {
    expect(teamDay(new Date('2026-11-26T02:59:59Z'))).toBe('2026-11-25');
    expect(teamDay(new Date('2026-11-26T03:00:00Z'))).toBe('2026-11-26');
    expect(teamDay(new Date('2026-12-31T23:59:00Z'))).toBe('2026-12-31');
  });
});

describe('daily results', () => {
  const places = ['A', 'B'].map((name) => ({ id: name, name, cuisine: 'Other', note: '', budget: '$', owner_id: 'owner' }));
  const vote = (owner_id: string, place_id: string, day = '2026-11-25') => ({ id: owner_id, owner_id, place_id, day });

  it('does not invent a winner without votes', () => {
    expect(dailyResults(places, [], '2026-11-25').leaders).toEqual([]);
  });

  it('counts only today, recognizes ties, and excludes missing places and duplicate voters', () => {
    const result = dailyResults(places, [
      vote('one', 'A'), vote('two', 'B'), vote('one', 'B'),
      vote('old', 'A', '2026-11-24'), vote('invalid', 'missing'),
    ], '2026-11-25');
    expect(result.total).toBe(2);
    expect(result.leaders.map((place) => place.name)).toEqual(['A', 'B']);
    expect(dailyResults(places, [vote('one', 'B')], '2026-11-25').leaders[0].name).toBe('B');
  });
});

describe('complete lunch lists', () => {
  it('follows all cursors so team votes are not silently truncated', async () => {
    const cursors: (string | undefined)[] = [];
    expect(await collectPages(async (cursor) => {
      cursors.push(cursor);
      return cursor ? { items: [2], hasNextPage: false } : { items: [1], hasNextPage: true, endCursor: 'next' };
    })).toEqual([1, 2]);
    expect(cursors).toEqual([undefined, 'next']);
  });

  it('surfaces a broken cursor instead of hanging or returning partial totals', async () => {
    await expect(collectPages(async () => ({ items: [1], hasNextPage: true, endCursor: 'same' })))
      .rejects.toThrow('could not finish loading');
  });
});
