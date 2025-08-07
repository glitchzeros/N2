export type Entity = number;

export interface ComponentStore<T> {
  readonly name: string;
  has(entity: Entity): boolean;
  get(entity: Entity): T | undefined;
  set(entity: Entity, value: T): void;
  delete(entity: Entity): void;
  keys(): Iterable<Entity>;
}

export class MapComponentStore<T> implements ComponentStore<T> {
  readonly name: string;
  private readonly store: Map<Entity, T> = new Map();

  constructor(name: string) { this.name = name; }

  has(entity: Entity): boolean { return this.store.has(entity); }
  get(entity: Entity): T | undefined { return this.store.get(entity); }
  set(entity: Entity, value: T): void { this.store.set(entity, value); }
  delete(entity: Entity): void { this.store.delete(entity); }
  *keys(): Iterable<Entity> { yield* this.store.keys(); }
}

export type ComponentDefinition<T> = {
  store: ComponentStore<T>;
};