export type Status = 'success' | 'failure' | 'running';

export interface Node {
  tick(): Status;
}

export class Task implements Node {
  private readonly fn: () => Status;
  constructor(fn: () => Status) { this.fn = fn; }
  tick(): Status { return this.fn(); }
}

export class Sequence implements Node {
  constructor(private children: Node[]) {}
  tick(): Status {
    for (const c of this.children) {
      const s = c.tick();
      if (s !== 'success') return s;
    }
    return 'success';
  }
}

export class Selector implements Node {
  constructor(private children: Node[]) {}
  tick(): Status {
    for (const c of this.children) {
      const s = c.tick();
      if (s !== 'failure') return s;
    }
    return 'failure';
  }
}