import { Entity } from './Entity';
import { Component } from './Component';
import { System } from './System';
import { ComponentType } from './ComponentType';
import { Query } from './Query';

/**
 * High-performance Entity-Component-System World
 * Manages entities, components, and systems with data-oriented design
 */
export class World {
  private entities: Map<number, Entity> = new Map();
  private components: Map<ComponentType, Map<number, Component>> = new Map();
  private systems: System[] = [];
  private queries: Map<string, Query> = new Map();
  private nextEntityId = 1;
  private entityPool: number[] = [];
  private componentPools: Map<ComponentType, Component[]> = new Map();
  private isUpdating = false;
  private pendingOperations: (() => void)[] = [];

  /**
   * Create a new entity
   */
  createEntity(): Entity {
    const id = this.entityPool.pop() ?? this.nextEntityId++;
    const entity = new Entity(id);
    this.entities.set(id, entity);
    return entity;
  }

  /**
   * Destroy an entity and recycle its ID
   */
  destroyEntity(entity: Entity): void {
    if (this.isUpdating) {
      this.pendingOperations.push(() => this.destroyEntity(entity));
      return;
    }

    const id = entity.id;
    
    // Remove all components
    for (const [componentType, componentMap] of this.components) {
      const component = componentMap.get(id);
      if (component) {
        this.removeComponent(entity, componentType);
      }
    }

    // Remove entity and recycle ID
    this.entities.delete(id);
    this.entityPool.push(id);
  }

  /**
   * Add a component to an entity
   */
  addComponent<T extends Component>(entity: Entity, componentType: ComponentType, component: T): void {
    if (this.isUpdating) {
      this.pendingOperations.push(() => this.addComponent(entity, componentType, component));
      return;
    }

    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }

    const componentMap = this.components.get(componentType)!;
    componentMap.set(entity.id, component);
    
    // Invalidate queries that include this component type
    this.invalidateQueries(componentType);
  }

  /**
   * Remove a component from an entity
   */
  removeComponent(entity: Entity, componentType: ComponentType): void {
    if (this.isUpdating) {
      this.pendingOperations.push(() => this.removeComponent(entity, componentType));
      return;
    }

    const componentMap = this.components.get(componentType);
    if (componentMap) {
      const component = componentMap.get(entity.id);
      if (component) {
        // Return component to pool
        if (!this.componentPools.has(componentType)) {
          this.componentPools.set(componentType, []);
        }
        this.componentPools.get(componentType)!.push(component);
        
        componentMap.delete(entity.id);
        this.invalidateQueries(componentType);
      }
    }
  }

  /**
   * Get a component from an entity
   */
  getComponent<T extends Component>(entity: Entity, componentType: ComponentType): T | null {
    const componentMap = this.components.get(componentType);
    if (componentMap) {
      return (componentMap.get(entity.id) as T) ?? null;
    }
    return null;
  }

  /**
   * Check if entity has a component
   */
  hasComponent(entity: Entity, componentType: ComponentType): boolean {
    const componentMap = this.components.get(componentType);
    return componentMap ? componentMap.has(entity.id) : false;
  }

  /**
   * Add a system to the world
   */
  addSystem(system: System): void {
    this.systems.push(system);
    system.world = this;
  }

  /**
   * Remove a system from the world
   */
  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
      system.world = null;
    }
  }

  /**
   * Create a query for entities with specific components
   */
  createQuery(...componentTypes: ComponentType[]): Query {
    const key = componentTypes.sort().join(',');
    
    if (this.queries.has(key)) {
      return this.queries.get(key)!;
    }

    const query = new Query(this, componentTypes);
    this.queries.set(key, query);
    return query;
  }

  /**
   * Update all systems
   */
  update(deltaTime: number): void {
    this.isUpdating = true;

    // Update all systems
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(deltaTime);
      }
    }

    this.isUpdating = false;

    // Process pending operations
    while (this.pendingOperations.length > 0) {
      const operation = this.pendingOperations.shift()!;
      operation();
    }
  }

  /**
   * Get all entities
   */
  getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return this.entities.size;
  }

  /**
   * Clear all entities and systems
   */
  clear(): void {
    this.entities.clear();
    this.components.clear();
    this.systems.length = 0;
    this.queries.clear();
    this.pendingOperations.length = 0;
    this.nextEntityId = 1;
    this.entityPool.length = 0;
    this.componentPools.clear();
  }

  /**
   * Invalidate queries that include a specific component type
   */
  private invalidateQueries(componentType: ComponentType): void {
    for (const query of this.queries.values()) {
      if (query.componentTypes.includes(componentType)) {
        query.invalidate();
      }
    }
  }

  /**
   * Get component map for a specific type
   */
  getComponentMap(componentType: ComponentType): Map<number, Component> | undefined {
    return this.components.get(componentType);
  }

  /**
   * Get a component from pool or create new
   */
  getComponentFromPool<T extends Component>(componentType: ComponentType, createFn: () => T): T {
    if (!this.componentPools.has(componentType)) {
      this.componentPools.set(componentType, []);
    }

    const pool = this.componentPools.get(componentType)!;
    return (pool.pop() as T) ?? createFn();
  }
}