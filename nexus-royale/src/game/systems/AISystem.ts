import { System } from '@/engine/core/ecs/System';
import { ComponentType } from '@/engine/core/ecs/ComponentType';
import { Entity } from '@/engine/core/ecs/Entity';
import { AIComponent, AIState, AIPresets } from '@/game/ai/AIComponent';
import { Transform } from '@/game/components/Transform';
import { Player } from '@/game/components/Player';
import { BehaviorTree, BehaviorContext, NodeStatus } from '@/game/ai/BehaviorTree';
import { Pathfinding } from '@/game/ai/Pathfinding';
import { PhysicsWorld } from '@/engine/physics/PhysicsWorld';
import { Vector3 } from '@/engine/core/math/Vector3';
import { v4 as uuidv4 } from 'uuid';

/**
 * System for managing AI behavior and decision making
 */
export class AISystem extends System {
  private physicsWorld: PhysicsWorld;
  private pathfinding: Pathfinding;
  private aiQuery: any;
  private playerQuery: any;
  private behaviorTrees: Map<Entity, BehaviorTree> = new Map();
  private aiEntities: Map<Entity, { ai: AIComponent; transform: Transform; player?: Player }> = new Map();

  constructor(physicsWorld: PhysicsWorld) {
    super();
    this.priority = 70; // Medium priority for AI
    this.physicsWorld = physicsWorld;
    this.pathfinding = new Pathfinding(physicsWorld);
  }

  getRequiredComponents(): ComponentType[] {
    return [AIComponent.getType(), Transform.getType()];
  }

  onAdded(): void {
    if (this.world) {
      this.aiQuery = this.world.createQuery(AIComponent.getType(), Transform.getType());
      this.playerQuery = this.world.createQuery(Player.getType(), Transform.getType());
    }
  }

  update(deltaTime: number): void {
    // Update AI perception
    this.updatePerception(deltaTime);

    // Update AI decision making
    this.updateAI(deltaTime);

    // Update pathfinding grid if needed
    this.updatePathfinding();
  }

  /**
   * Update AI perception (vision and hearing)
   */
  private updatePerception(deltaTime: number): void {
    const aiEntities = this.aiQuery.getEntities();
    const playerEntities = this.playerQuery.getEntities();

    for (const aiEntity of aiEntities) {
      const ai = this.world!.getComponent<AIComponent>(aiEntity, AIComponent.getType());
      const aiTransform = this.world!.getComponent<Transform>(aiEntity, Transform.getType());
      
      if (!ai || !aiTransform) continue;

      // Update AI component
      ai.update(deltaTime);

      // Check vision for each player
      for (const playerEntity of playerEntities) {
        const player = this.world!.getComponent<Player>(playerEntity, Player.getType());
        const playerTransform = this.world!.getComponent<Transform>(playerEntity, Transform.getType());
        
        if (!player || !playerTransform) continue;

        // Skip if this is the same entity
        if (aiEntity === playerEntity) continue;

        // Check if AI can see the player
        if (ai.canSeeTarget(playerTransform.position, aiTransform.position, aiTransform.getForward())) {
          ai.seeTarget(player.id, playerTransform.position);
        }
      }

      // Check for sounds (simplified - would integrate with audio system)
      this.checkForSounds(ai, aiTransform);
    }
  }

  /**
   * Check for sounds in the environment
   */
  private checkForSounds(ai: AIComponent, aiTransform: Transform): void {
    // This would integrate with the audio system
    // For now, we'll simulate some sounds from player movements
    const playerEntities = this.playerQuery.getEntities();
    
    for (const playerEntity of playerEntities) {
      const player = this.world!.getComponent<Player>(playerEntity, Player.getType());
      const playerTransform = this.world!.getComponent<Transform>(playerEntity, Transform.getType());
      
      if (!player || !playerTransform) continue;

      // Simulate footstep sounds
      const distance = aiTransform.position.distanceTo(playerTransform.position);
      const volume = Math.max(0, 1 - distance / 50); // Volume decreases with distance
      
      if (ai.canHearSound(playerTransform.position, aiTransform.position, volume)) {
        ai.hearSound(`footstep_${player.id}`, playerTransform.position, volume);
      }
    }
  }

  /**
   * Update AI decision making and behavior
   */
  private updateAI(deltaTime: number): void {
    const entities = this.aiQuery.getEntities();

    for (const entity of entities) {
      const ai = this.world!.getComponent<AIComponent>(entity, AIComponent.getType());
      const transform = this.world!.getComponent<Transform>(entity, Transform.getType());
      const player = this.world!.getComponent<Player>(entity, Player.getType());
      
      if (!ai || !transform) continue;

      // Check if AI is ready for decision
      if (!ai.isReadyForDecision()) continue;

      // Get or create behavior tree
      let behaviorTree = this.behaviorTrees.get(entity);
      if (!behaviorTree) {
        behaviorTree = this.createBehaviorTree(ai);
        this.behaviorTrees.set(entity, behaviorTree);
      }

      // Create behavior context
      const context: BehaviorContext = {
        ai,
        transform,
        player,
        pathfinding: this.pathfinding,
        deltaTime
      };

      // Execute behavior tree
      const status = behaviorTree.tick(context);

      // Handle behavior tree status
      if (status === NodeStatus.FAILURE) {
        // Fallback to idle behavior
        ai.changeState(AIState.IDLE);
      }
    }
  }

  /**
   * Create appropriate behavior tree based on AI personality
   */
  private createBehaviorTree(ai: AIComponent): BehaviorTree {
    switch (ai.behavior) {
      case 'aggressive':
        return BehaviorTree.createAggressiveTree();
      case 'defensive':
        return BehaviorTree.createDefensiveTree();
      case 'passive':
      case 'sneaky':
      case 'support':
      default:
        return BehaviorTree.createStandardTree();
    }
  }

  private updateCounter = 0;

  /**
   * Update pathfinding grid when world changes
   */
  private updatePathfinding(): void {
    // This would be called when the world geometry changes
    // For now, we'll update periodically
    this.updateCounter++;
    
    if (this.updateCounter > 1000) { // Update every 1000 frames
      this.pathfinding.updateGrid();
      this.updateCounter = 0;
    }
  }

  /**
   * Create an AI entity
   */
  createAI(
    position: Vector3,
    aiStats: any = null,
    playerData: any = null
  ): Entity {
    const entity = this.world!.createEntity();

    // Add transform
    const transform = new Transform(position);
    this.world!.addComponent(entity, Transform.getType(), transform);

    // Add AI component
    const stats = aiStats || AIPresets.veteran();
    const ai = new AIComponent(stats);
    this.world!.addComponent(entity, AIComponent.getType(), ai);

    // Add player component if provided
    if (playerData) {
      const player = new Player(playerData.name || `AI_${entity.id}`, playerData.isLocalPlayer || false);
      this.world!.addComponent(entity, Player.getType(), player);
    }

    // Create physics body for AI
    this.createAIPhysicsBody(entity, transform, ai);

    // Store reference
    this.aiEntities.set(entity, { ai, transform, player: playerData });

    console.log(`Created AI entity ${entity.id} at ${position.toString()}`);
    return entity;
  }

  /**
   * Create physics body for AI entity
   */
  private createAIPhysicsBody(entity: Entity, transform: Transform, ai: AIComponent): void {
    // This would integrate with the physics system
    // For now, we'll just log that we need a physics body
    console.log(`AI ${entity.id} needs physics body at ${transform.position.toString()}`);
  }

  /**
   * Create a group of AI bots
   */
  createAIGroup(count: number, center: Vector3, radius: number = 50): Entity[] {
    const entities: Entity[] = [];
    const aiTypes = ['rookie', 'veteran', 'elite', 'sniper', 'support'];

    for (let i = 0; i < count; i++) {
      // Random position within radius
      const angle = (i / count) * Math.PI * 2;
      const distance = Math.random() * radius;
      const position = new Vector3(
        center.x + Math.cos(angle) * distance,
        center.y,
        center.z + Math.sin(angle) * distance
      );

      // Random AI type
      const aiType = aiTypes[Math.floor(Math.random() * aiTypes.length)];
      let stats;
      
      switch (aiType) {
        case 'rookie':
          stats = AIPresets.rookie();
          break;
        case 'veteran':
          stats = AIPresets.veteran();
          break;
        case 'elite':
          stats = AIPresets.elite();
          break;
        case 'sniper':
          stats = AIPresets.sniper();
          break;
        case 'support':
          stats = AIPresets.support();
          break;
        default:
          stats = AIPresets.veteran();
      }

      const playerData = {
        name: `${aiType}_${i + 1}`,
        isLocalPlayer: false
      };

      const entity = this.createAI(position, stats, playerData);
      entities.push(entity);
    }

    return entities;
  }

  /**
   * Remove AI entity
   */
  removeAI(entity: Entity): void {
    this.behaviorTrees.delete(entity);
    this.aiEntities.delete(entity);
    this.world!.destroyEntity(entity);
  }

  /**
   * Get AI statistics
   */
  getAIStats(): any {
    const entities = this.aiQuery.getEntities();
    const stats = {
      totalAI: entities.length,
      states: {} as Record<string, number>,
      behaviors: {} as Record<string, number>,
      averageExperience: 0,
      totalKills: 0,
      totalDeaths: 0
    };

    let totalExperience = 0;

    for (const entity of entities) {
      const ai = this.world!.getComponent<AIComponent>(entity, AIComponent.getType());
      if (!ai) continue;

      // Count states
      stats.states[ai.state] = (stats.states[ai.state] || 0) + 1;
      stats.behaviors[ai.behavior] = (stats.behaviors[ai.behavior] || 0) + 1;

      // Accumulate experience
      totalExperience += ai.experience;
      stats.totalKills += ai.kills;
      stats.totalDeaths += ai.deaths;
    }

    stats.averageExperience = entities.length > 0 ? totalExperience / entities.length : 0;

    return stats;
  }

  /**
   * Get AI entity by ID
   */
  getAIEntity(aiId: string): Entity | null {
    for (const [entity, data] of this.aiEntities.entries()) {
      if (data.player && data.player.id === aiId) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Get AI component by entity
   */
  getAIComponent(entity: Entity): AIComponent | null {
    return this.world!.getComponent<AIComponent>(entity, AIComponent.getType());
  }

  /**
   * Set AI target
   */
  setAITarget(aiEntity: Entity, targetId: string, targetPosition: Vector3): void {
    const ai = this.getAIComponent(aiEntity);
    if (ai) {
      ai.seeTarget(targetId, targetPosition);
    }
  }

  /**
   * Get pathfinding system
   */
  getPathfinding(): Pathfinding {
    return this.pathfinding;
  }

  /**
   * Update AI difficulty based on player performance
   */
  updateDifficulty(playerKills: number, playerDeaths: number): void {
    const entities = this.aiQuery.getEntities();
    
    for (const entity of entities) {
      const ai = this.getAIComponent(entity);
      if (!ai) continue;

      // Adjust AI stats based on player performance
      const playerKDRatio = playerDeaths > 0 ? playerKills / playerDeaths : playerKills;
      
      if (playerKDRatio > 2) {
        // Player is doing well, make AI harder
        ai.accuracy = Math.min(0.95, ai.accuracy + 0.05);
        ai.reactionTime = Math.max(0.05, ai.reactionTime - 0.02);
      } else if (playerKDRatio < 0.5) {
        // Player is struggling, make AI easier
        ai.accuracy = Math.max(0.1, ai.accuracy - 0.05);
        ai.reactionTime = Math.min(0.4, ai.reactionTime + 0.02);
      }
    }
  }

  /**
   * Get AI debug information
   */
  getDebugInfo(): any {
    const stats = this.getAIStats();
    const pathfindingStats = this.pathfinding.getGridStats();
    
    return {
      ai: stats,
      pathfinding: pathfindingStats,
      behaviorTrees: this.behaviorTrees.size,
      activeEntities: this.aiEntities.size
    };
  }
}