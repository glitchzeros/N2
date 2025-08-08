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

/**
 * Base class for all components
 * Components store data and should be pure data structures
 */
export abstract class Component {
  /**
   * Get the component type for this component
   */
  static getType(): ComponentType {
    return ComponentType.getType(this);
  }

  /**
   * Clone this component
   */
  clone(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  /**
   * Reset this component to default values
   */
  reset(): void {
    // Override in subclasses to reset to default values
  }
}

/**
 * ComponentType provides type-safe component identification
 */
export class ComponentType {
  private static nextId = 0;
  private static typeMap = new Map<Function, ComponentType>();

  private constructor(public readonly id: number, public readonly name: string) {}

  /**
   * Get or create a ComponentType for a component class
   */
  static getType(componentClass: Function): ComponentType {
    if (!this.typeMap.has(componentClass)) {
      const type = new ComponentType(this.nextId++, componentClass.name);
      this.typeMap.set(componentClass, type);
    }
    return this.typeMap.get(componentClass)!;
  }

  /**
   * Get all registered component types
   */
  static getAllTypes(): ComponentType[] {
    return Array.from(this.typeMap.values());
  }

  /**
   * Clear all registered types (useful for testing)
   */
  static clear(): void {
    this.typeMap.clear();
    this.nextId = 0;
  }
}