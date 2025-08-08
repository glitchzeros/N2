import { World } from './World';
import { Entity } from './Entity';
import { ComponentType } from './ComponentType';

/**
 * Base class for all systems
 * Systems process entities that have specific component combinations
 */
export abstract class System {
  public world: World | null = null;
  public enabled = true;
  public priority = 0;

  /**
   * Get the component types this system requires
   */
  abstract getRequiredComponents(): ComponentType[];

  /**
   * Get the component types this system excludes
   */
  getExcludedComponents(): ComponentType[] {
    return [];
  }

  /**
   * Called when the system is added to the world
   */
  onAdded(): void {
    // Override in subclasses
  }

  /**
   * Called when the system is removed from the world
   */
  onRemoved(): void {
    // Override in subclasses
  }

  /**
   * Called before the first update
   */
  onStart(): void {
    // Override in subclasses
  }

  /**
   * Called every frame
   */
  abstract update(deltaTime: number): void;

  /**
   * Called when the system is paused
   */
  onPause(): void {
    // Override in subclasses
  }

  /**
   * Called when the system is resumed
   */
  onResume(): void {
    // Override in subclasses
  }

  /**
   * Get entities that match this system's requirements
   */
  getEntities(): Entity[] {
    if (!this.world) return [];

    const required = this.getRequiredComponents();
    const excluded = this.getExcludedComponents();

    if (required.length === 0) {
      return this.world.getEntities();
    }

    // Create query for required components
    const query = this.world.createQuery(...required);
    let entities = query.getEntities();

    // Filter out entities with excluded components
    if (excluded.length > 0) {
      entities = entities.filter(entity => {
        return !excluded.some(componentType => 
          this.world!.hasComponent(entity, componentType)
        );
      });
    }

    return entities;
  }

  /**
   * Check if an entity matches this system's requirements
   */
  matchesEntity(entity: Entity): boolean {
    if (!this.world) return false;

    const required = this.getRequiredComponents();
    const excluded = this.getExcludedComponents();

    // Check required components
    for (const componentType of required) {
      if (!this.world.hasComponent(entity, componentType)) {
        return false;
      }
    }

    // Check excluded components
    for (const componentType of excluded) {
      if (this.world.hasComponent(entity, componentType)) {
        return false;
      }
    }

    return true;
  }
}