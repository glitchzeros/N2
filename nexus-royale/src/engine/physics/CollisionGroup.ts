/**
 * Collision groups for filtering collisions between different types of objects
 */
export class CollisionGroup {
  public readonly id: number;
  public readonly name: string;
  public readonly mask: number;

  constructor(id: number, name: string, mask: number) {
    this.id = id;
    this.name = name;
    this.mask = mask;
  }

  /**
   * Check if this group can collide with another group
   */
  canCollideWith(other: CollisionGroup): boolean {
    return (this.mask & other.id) !== 0;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `CollisionGroup(${this.name}, id: ${this.id}, mask: ${this.mask})`;
  }

  // Predefined collision groups
  static readonly DEFAULT = new CollisionGroup(1, 'DEFAULT', 0xFFFFFFFF);
  static readonly PLAYER = new CollisionGroup(2, 'PLAYER', 0xFFFFFFFF);
  static readonly PROJECTILE = new CollisionGroup(4, 'PROJECTILE', 0xFFFFFFFF);
  static readonly TERRAIN = new CollisionGroup(8, 'TERRAIN', 0xFFFFFFFF);
  static readonly ITEM = new CollisionGroup(16, 'ITEM', 0xFFFFFFFF);
  static readonly TRIGGER = new CollisionGroup(32, 'TRIGGER', 0xFFFFFFFF);
  static readonly SENSOR = new CollisionGroup(64, 'SENSOR', 0xFFFFFFFF);

  // Special collision groups
  static readonly STATIC = new CollisionGroup(128, 'STATIC', 0xFFFFFFFF);
  static readonly DYNAMIC = new CollisionGroup(256, 'DYNAMIC', 0xFFFFFFFF);
  static readonly KINEMATIC = new CollisionGroup(512, 'KINEMATIC', 0xFFFFFFFF);

  // Custom collision group factory
  static create(id: number, name: string, mask: number): CollisionGroup {
    return new CollisionGroup(id, name, mask);
  }

  // Utility methods for common collision setups
  static createPlayerGroup(): CollisionGroup {
    return new CollisionGroup(
      2,
      'PLAYER',
      CollisionGroup.TERRAIN.id | CollisionGroup.ITEM.id | CollisionGroup.TRIGGER.id | CollisionGroup.SENSOR.id
    );
  }

  static createProjectileGroup(): CollisionGroup {
    return new CollisionGroup(
      4,
      'PROJECTILE',
      CollisionGroup.PLAYER.id | CollisionGroup.TERRAIN.id | CollisionGroup.STATIC.id
    );
  }

  static createTerrainGroup(): CollisionGroup {
    return new CollisionGroup(
      8,
      'TERRAIN',
      CollisionGroup.PLAYER.id | CollisionGroup.PROJECTILE.id | CollisionGroup.DYNAMIC.id
    );
  }

  static createItemGroup(): CollisionGroup {
    return new CollisionGroup(
      16,
      'ITEM',
      CollisionGroup.PLAYER.id | CollisionGroup.TERRAIN.id
    );
  }

  static createTriggerGroup(): CollisionGroup {
    return new CollisionGroup(
      32,
      'TRIGGER',
      CollisionGroup.PLAYER.id | CollisionGroup.DYNAMIC.id
    );
  }

  static createSensorGroup(): CollisionGroup {
    return new CollisionGroup(
      64,
      'SENSOR',
      CollisionGroup.PLAYER.id | CollisionGroup.DYNAMIC.id
    );
  }
}