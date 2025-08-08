export type Player = { id: string; mmr: number };
export type Match = { id: string; players: Player[] };

export class Matchmaker {
  private queue: Player[] = [];
  private matches: Match[] = [];
  private nextId = 1;

  enqueue(player: Player): void { this.queue.push(player); }

  tick(): void {
    if (this.queue.length < 2) return;
    this.queue.sort((a, b) => a.mmr - b.mmr);
    const matched: boolean[] = new Array(this.queue.length).fill(false);
    for (let i = 0; i < this.queue.length - 1; i++) {
      if (matched[i]) continue;
      const a = this.queue[i];
      let j = i + 1;
      while (j < this.queue.length && matched[j]) j++;
      if (j >= this.queue.length) break;
      const b = this.queue[j];
      if (Math.abs(a.mmr - b.mmr) <= 100) {
        this.matches.push({ id: String(this.nextId++), players: [a, b] });
        matched[i] = matched[j] = true;
      }
    }
    this.queue = this.queue.filter((_, idx) => !matched[idx]);
  }

  popMatches(): Match[] { const out = this.matches; this.matches = []; return out; }
}