/**
 * Entity represents a game object in the ECS system
 * Entities are just IDs - all data is stored in components
 */
export class Entity {
  constructor(public readonly id: number) {}

  /**
   * Create a new entity with the given ID
   */
  static create(id: number): Entity {
    return new Entity(id);
  }

  /**
   * Check if two entities are equal
   */
  equals(other: Entity): boolean {
    return this.id === other.id;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `Entity(${this.id})`;
  }
}