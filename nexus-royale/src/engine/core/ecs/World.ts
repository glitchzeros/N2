import { ComponentStore, Entity } from './Component';

export class World {
  private nextEntityId: number = 1;
  private readonly alive: Set<Entity> = new Set();
  private readonly componentStores: Map<string, ComponentStore<unknown>> = new Map();

  createEntity(): Entity {
    const id = this.nextEntityId++ as Entity;
    this.alive.add(id);
    return id;
  }

  destroyEntity(entity: Entity): void {
    if (!this.alive.has(entity)) return;
    this.alive.delete(entity);
    for (const store of this.componentStores.values()) {
      // stores may or may not have the entity; delete is safe
      (store as ComponentStore<unknown>).delete(entity);
    }
  }

  isAlive(entity: Entity): boolean { return this.alive.has(entity); }

  registerComponent<T>(name: string, store: ComponentStore<T>): ComponentStore<T> {
    if (this.componentStores.has(name)) {
      throw new Error(`Component '${name}' already registered`);
    }
    this.componentStores.set(name, store as ComponentStore<unknown>);
    return store;
  }

  getStore<T>(name: string): ComponentStore<T> {
    const s = this.componentStores.get(name);
    if (!s) throw new Error(`Component store not found: ${name}`);
    return s as ComponentStore<T>;
  }

  add<T>(entity: Entity, name: string, value: T): void {
    this.getStore<T>(name).set(entity, value);
  }

  remove(entity: Entity, name: string): void {
    this.getStore<unknown>(name).delete(entity);
  }

  get<T>(entity: Entity, name: string): T | undefined {
    return this.getStore<T>(name).get(entity);
  }

  has(entity: Entity, name: string): boolean {
    return this.getStore<unknown>(name).has(entity);
  }

  query(includes: string[], excludes: string[] = []): Entity[] {
    if (includes.length === 0) return Array.from(this.alive);
    // Start from the smallest candidate set for efficiency
    const stores = includes.map((n) => this.getStore<unknown>(n));
    stores.sort((a, b) => {
      // heuristic: smaller key count first
      const aSize = [...a.keys()].length;
      const bSize = [...b.keys()].length;
      return aSize - bSize;
    });
    const first = stores[0];
    const result: Entity[] = [];
    for (const e of first.keys()) {
      if (!this.alive.has(e)) continue;
      let ok = true;
      for (let i = 1; i < stores.length && ok; i++) {
        if (!stores[i].has(e)) ok = false;
      }
      if (!ok) continue;
      for (let i = 0; i < excludes.length && ok; i++) {
        if (this.getStore<unknown>(excludes[i]).has(e)) ok = false;
      }
      if (ok) result.push(e);
    }
    return result;
  }
}