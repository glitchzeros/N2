import { Matchmaker } from '@/game/meta/matchmaking/Matchmaker';

describe('Matchmaker', () => {
  test('pairs similar MMR players and leaves others queued', () => {
    const mm = new Matchmaker();
    mm.enqueue({ id: 'a', mmr: 1000 });
    mm.enqueue({ id: 'b', mmr: 1050 });
    mm.enqueue({ id: 'c', mmr: 1300 });
    mm.tick();
    const matches = mm.popMatches();
    expect(matches.length).toBe(1);
    expect(matches[0].players.map(p => p.id).sort()).toEqual(['a','b']);
  });
});