import { World } from '@/engine/core/ecs/World';
import { Player } from '@/game/components/Player';
import { Transform } from '@/game/components/Transform';
import { Weapon } from '@/game/components/Weapon';
import { PlayerSystem } from '@/game/systems/PlayerSystem';
import { WeaponSystem } from '@/game/systems/WeaponSystem';
import { Vector3 } from '@/engine/core/math/Vector3';

/**
 * Simple test to verify ECS system is working
 */
export function testECS(): void {
  console.log('🧪 Testing ECS System...');

  // Create world
  const world = new World();
  
  // Add systems
  const playerSystem = new PlayerSystem();
  const weaponSystem = new WeaponSystem();
  world.addSystem(playerSystem);
  world.addSystem(weaponSystem);

  // Create a player entity
  const playerEntity = world.createEntity();
  const player = new Player('test-player', 'TestPlayer', false);
  const transform = new Transform(new Vector3(0, 0, 0));
  
  world.addComponent(playerEntity, Player.getType(), player);
  world.addComponent(playerEntity, Transform.getType(), transform);

  // Create a weapon entity
  const weaponEntity = weaponSystem.createWeaponFromPreset('pistol');
  if (weaponEntity) {
    const weapon = weaponSystem.getWeapon(weaponEntity);
    if (weapon) {
      weapon.isEquipped = true;
    }
  }

  // Update world
  world.update(0.016); // 16ms delta time

  // Check results
  const playerCount = playerSystem.getPlayerCount();
  const alivePlayers = playerSystem.getAlivePlayerCount();
  const entityCount = world.getEntityCount();

  console.log(`✅ ECS Test Results:`);
  console.log(`   - Total entities: ${entityCount}`);
  console.log(`   - Player count: ${playerCount}`);
  console.log(`   - Alive players: ${alivePlayers}`);
  console.log(`   - Player health: ${player.health}/${player.maxHealth}`);
  console.log(`   - Player position: ${transform.position.toString()}`);

  if (playerCount > 0 && entityCount > 0) {
    console.log('🎉 ECS System is working correctly!');
  } else {
    console.log('❌ ECS System test failed!');
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // In browser environment
  (window as any).testECS = testECS;
} else {
  // In Node.js environment
  testECS();
}