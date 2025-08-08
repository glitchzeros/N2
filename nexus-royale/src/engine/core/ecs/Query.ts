import { World } from './World';
import { Entity } from './Entity';
import { ComponentType } from './ComponentType';

/**
 * Query efficiently finds entities with specific component combinations
 * Results are cached and invalidated when components change
 */
export class Query {
  private entities: Entity[] = [];
  private isValid = false;

  constructor(
    private world: World,
    public readonly componentTypes: ComponentType[]
  ) {}

  /**
   * Get entities that match this query
   */
  getEntities(): Entity[] {
    if (!this.isValid) {
      this.update();
    }
    return this.entities;
  }

  /**
   * Get the first entity that matches this query
   */
  getFirst(): Entity | null {
    const entities = this.getEntities();
    return entities.length > 0 ? entities[0] : null;
  }

  /**
   * Get entity count
   */
  getCount(): number {
    return this.getEntities().length;
  }

  /**
   * Check if query has any entities
   */
  hasEntities(): boolean {
    return this.getCount() > 0;
  }

  /**
   * Invalidate the cached results
   */
  invalidate(): void {
    this.isValid = false;
  }

  /**
   * Update the cached results
   */
  private update(): void {
    if (this.componentTypes.length === 0) {
      this.entities = this.world.getEntities();
      this.isValid = true;
      return;
    }

    // Start with entities that have the first component type
    const firstComponentMap = this.world.getComponentMap(this.componentTypes[0]);
    if (!firstComponentMap) {
      this.entities = [];
      this.isValid = true;
      return;
    }

    const candidateEntities = Array.from(firstComponentMap.keys()).map(id => 
      Entity.create(id)
    );

    // Filter by remaining component types
    this.entities = candidateEntities.filter(entity => {
      for (let i = 1; i < this.componentTypes.length; i++) {
        if (!this.world.hasComponent(entity, this.componentTypes[i])) {
          return false;
        }
      }
      return true;
    });

    this.isValid = true;
  }

  /**
   * Create a new query that requires additional components
   */
  with(...additionalTypes: ComponentType[]): Query {
    return this.world.createQuery(...this.componentTypes, ...additionalTypes);
  }

  /**
   * Create a new query that excludes entities with certain components
   */
  without(...excludedTypes: ComponentType[]): Query {
    // This is a simplified implementation
    // In a full implementation, you'd want to track excluded types
    const entities = this.getEntities().filter(entity => {
      return !excludedTypes.some(componentType => 
        this.world.hasComponent(entity, componentType)
      );
    });

    // Create a temporary query-like object
    const tempQuery = {
      getEntities: () => entities,
      getFirst: () => entities[0] || null,
      getCount: () => entities.length,
      hasEntities: () => entities.length > 0
    };

    return tempQuery as Query;
  }
}