export interface KeyValueStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

class LocalStorageKV implements KeyValueStorage {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  set<T>(key: string, value: T): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  remove(key: string): void {
    try { localStorage.removeItem(key); } catch {}
  }
}

class MemoryKV implements KeyValueStorage {
  private map = new Map<string, unknown>();
  get<T>(key: string, fallback: T): T { return (this.map.has(key) ? (this.map.get(key) as T) : fallback); }
  set<T>(key: string, value: T): void { this.map.set(key, value); }
  remove(key: string): void { this.map.delete(key); }
}

export function createStorage(): KeyValueStorage {
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    try { localStorage.setItem('__test', '1'); localStorage.removeItem('__test'); return new LocalStorageKV(); } catch {}
  }
  return new MemoryKV();
}