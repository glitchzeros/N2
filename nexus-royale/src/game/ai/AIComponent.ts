import { Component } from '@/engine/core/ecs/Component';
import { Vector3 } from '@/engine/core/math/Vector3';

export enum AIState {
  IDLE = 'idle',
  PATROL = 'patrol',
  SEARCH = 'search',
  COMBAT = 'combat',
  RETREAT = 'retreat',
  LOOT = 'loot',
  DEAD = 'dead'
}

export enum AIBehavior {
  PASSIVE = 'passive',
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  SNEAKY = 'sneaky',
  SUPPORT = 'support'
}

export interface AIPerception {
  visionRange: number;
  visionAngle: number;
  hearingRange: number;
  memoryDuration: number;
}

export interface AIStats {
  reactionTime: number;
  accuracy: number;
  decisionFrequency: number;
  personality: AIBehavior;
  perception: AIPerception;
}

/**
 * AI component for controlling bot behavior
 */
export class AIComponent extends Component {
  // Core AI properties
  public state: AIState;
  public behavior: AIBehavior;
  public stats: AIStats;
  
  // Perception and memory
  public visionRange: number;
  public visionAngle: number;
  public hearingRange: number;
  public memoryDuration: number;
  public lastSeenTargets: Map<string, { position: Vector3; time: number }>;
  public lastHeardSounds: Map<string, { position: Vector3; time: number; volume: number }>;
  
  // Decision making
  public reactionTime: number;
  public accuracy: number;
  public decisionFrequency: number;
  public lastDecisionTime: number;
  public currentTarget: string | null;
  public targetPosition: Vector3 | null;
  public lastKnownTargetPosition: Vector3 | null;
  
  // Movement and navigation
  public patrolPoints: Vector3[];
  public currentPatrolIndex: number;
  public moveSpeed: number;
  public sprintSpeed: number;
  public rotationSpeed: number;
  
  // Combat
  public weaponRange: number;
  public preferredDistance: number;
  public coverSeeking: boolean;
  public flanking: boolean;
  public lastAttackTime: number;
  public attackCooldown: number;
  
  // Health and survival
  public healthThreshold: number;
  public shieldThreshold: number;
  public retreatHealth: number;
  public healingPriority: boolean;
  
  // Learning and adaptation
  public experience: number;
  public kills: number;
  public deaths: number;
  public accuracyHistory: number[];
  public reactionTimeHistory: number[];

  constructor(stats: AIStats) {
    super();
    this.state = AIState.IDLE;
    this.behavior = stats.personality;
    this.stats = stats;
    
    // Initialize perception
    this.visionRange = stats.perception.visionRange;
    this.visionAngle = stats.perception.visionAngle;
    this.hearingRange = stats.perception.hearingRange;
    this.memoryDuration = stats.perception.memoryDuration;
    this.lastSeenTargets = new Map();
    this.lastHeardSounds = new Map();
    
    // Initialize decision making
    this.reactionTime = stats.reactionTime;
    this.accuracy = stats.accuracy;
    this.decisionFrequency = stats.decisionFrequency;
    this.lastDecisionTime = 0;
    this.currentTarget = null;
    this.targetPosition = null;
    this.lastKnownTargetPosition = null;
    
    // Initialize movement
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;
    this.moveSpeed = 5;
    this.sprintSpeed = 8;
    this.rotationSpeed = 180; // degrees per second
    
    // Initialize combat
    this.weaponRange = 50;
    this.preferredDistance = 20;
    this.coverSeeking = true;
    this.flanking = false;
    this.lastAttackTime = 0;
    this.attackCooldown = 0.5;
    
    // Initialize survival
    this.healthThreshold = 0.3;
    this.shieldThreshold = 0.2;
    this.retreatHealth = 0.2;
    this.healingPriority = false;
    
    // Initialize learning
    this.experience = 0;
    this.kills = 0;
    this.deaths = 0;
    this.accuracyHistory = [];
    this.reactionTimeHistory = [];
  }

  /**
   * Update AI state and memory
   */
  update(deltaTime: number): void {
    // Clean up old memories
    this.cleanupMemories(deltaTime);
    
    // Update decision timing
    this.lastDecisionTime += deltaTime;
  }

  /**
   * Clean up old perception memories
   */
  private cleanupMemories(deltaTime: number): void {
    const currentTime = Date.now() / 1000;
    
    // Clean up seen targets
    for (const [id, data] of this.lastSeenTargets.entries()) {
      if (currentTime - data.time > this.memoryDuration) {
        this.lastSeenTargets.delete(id);
      }
    }
    
    // Clean up heard sounds
    for (const [id, data] of this.lastHeardSounds.entries()) {
      if (currentTime - data.time > this.memoryDuration) {
        this.lastHeardSounds.delete(id);
      }
    }
  }

  /**
   * Record seeing a target
   */
  seeTarget(targetId: string, position: Vector3): void {
    this.lastSeenTargets.set(targetId, {
      position: position.clone(),
      time: Date.now() / 1000
    });
    
    this.currentTarget = targetId;
    this.targetPosition = position.clone();
    this.lastKnownTargetPosition = position.clone();
  }

  /**
   * Record hearing a sound
   */
  hearSound(soundId: string, position: Vector3, volume: number): void {
    this.lastHeardSounds.set(soundId, {
      position: position.clone(),
      time: Date.now() / 1000,
      volume
    });
  }

  /**
   * Check if can see a target
   */
  canSeeTarget(targetPosition: Vector3, ownPosition: Vector3, ownForward: Vector3): boolean {
    const distance = targetPosition.distanceTo(ownPosition);
    if (distance > this.visionRange) return false;
    
    const direction = targetPosition.clone().sub(ownPosition).normalize();
    const angle = Math.acos(direction.dot(ownForward)) * (180 / Math.PI);
    
    return angle <= this.visionAngle / 2;
  }

  /**
   * Check if can hear a sound
   */
  canHearSound(soundPosition: Vector3, ownPosition: Vector3, volume: number): boolean {
    const distance = soundPosition.distanceTo(ownPosition);
    const effectiveRange = this.hearingRange * volume;
    return distance <= effectiveRange;
  }

  /**
   * Get closest visible target
   */
  getClosestVisibleTarget(ownPosition: Vector3, ownForward: Vector3): { id: string; position: Vector3 } | null {
    let closest: { id: string; position: Vector3; distance: number } | null = null;
    
    for (const [id, data] of this.lastSeenTargets.entries()) {
      if (this.canSeeTarget(data.position, ownPosition, ownForward)) {
        const distance = data.position.distanceTo(ownPosition);
        if (!closest || distance < closest.distance) {
          closest = { id, position: data.position, distance };
        }
      }
    }
    
    return closest ? { id: closest.id, position: closest.position } : null;
  }

  /**
   * Get closest heard sound
   */
  getClosestHeardSound(ownPosition: Vector3): { id: string; position: Vector3; volume: number } | null {
    let closest: { id: string; position: Vector3; volume: number; distance: number } | null = null;
    
    for (const [id, data] of this.lastHeardSounds.entries()) {
      const distance = data.position.distanceTo(ownPosition);
      if (!closest || distance < closest.distance) {
        closest = { id, position: data.position, volume: data.volume, distance };
      }
    }
    
    return closest ? { id: closest.id, position: closest.position, volume: closest.volume } : null;
  }

  /**
   * Change AI state
   */
  changeState(newState: AIState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.lastDecisionTime = 0; // Reset decision timer
    }
  }

  /**
   * Set patrol points
   */
  setPatrolPoints(points: Vector3[]): void {
    this.patrolPoints = points.map(p => p.clone());
    this.currentPatrolIndex = 0;
  }

  /**
   * Get next patrol point
   */
  getNextPatrolPoint(): Vector3 | null {
    if (this.patrolPoints.length === 0) return null;
    
    const point = this.patrolPoints[this.currentPatrolIndex];
    this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    return point;
  }

  /**
   * Get current patrol point
   */
  getCurrentPatrolPoint(): Vector3 | null {
    if (this.patrolPoints.length === 0) return null;
    return this.patrolPoints[this.currentPatrolIndex];
  }

  /**
   * Check if ready for decision
   */
  isReadyForDecision(): boolean {
    return this.lastDecisionTime >= 1 / this.decisionFrequency;
  }

  /**
   * Check if can attack
   */
  canAttack(): boolean {
    return this.lastDecisionTime - this.lastAttackTime >= this.attackCooldown;
  }

  /**
   * Record attack
   */
  recordAttack(): void {
    this.lastAttackTime = this.lastDecisionTime;
  }

  /**
   * Record kill
   */
  recordKill(): void {
    this.kills++;
    this.experience += 100;
  }

  /**
   * Record death
   */
  recordDeath(): void {
    this.deaths++;
    this.experience += 10;
  }

  /**
   * Update accuracy based on hit/miss
   */
  updateAccuracy(hit: boolean): void {
    this.accuracyHistory.push(hit ? 1 : 0);
    if (this.accuracyHistory.length > 10) {
      this.accuracyHistory.shift();
    }
    
    // Update accuracy based on recent performance
    const recentAccuracy = this.accuracyHistory.reduce((sum, val) => sum + val, 0) / this.accuracyHistory.length;
    this.accuracy = Math.max(0.1, Math.min(0.95, recentAccuracy));
  }

  /**
   * Update reaction time based on experience
   */
  updateReactionTime(): void {
    this.reactionTimeHistory.push(this.reactionTime);
    if (this.reactionTimeHistory.length > 10) {
      this.reactionTimeHistory.shift();
    }
    
    // Improve reaction time with experience
    const improvement = Math.min(0.1, this.experience / 1000);
    this.reactionTime = Math.max(0.05, this.reactionTime - improvement);
  }

  /**
   * Get difficulty level (0-1)
   */
  getDifficultyLevel(): number {
    const baseDifficulty = this.experience / 1000;
    const accuracyBonus = this.accuracy * 0.3;
    const reactionBonus = (1 - this.reactionTime) * 0.2;
    const killBonus = Math.min(0.3, this.kills / 10);
    
    return Math.min(1, baseDifficulty + accuracyBonus + reactionBonus + killBonus);
  }

  /**
   * Clone this AI component
   */
  clone(): AIComponent {
    const ai = new AIComponent(this.stats);
    ai.state = this.state;
    ai.behavior = this.behavior;
    ai.currentTarget = this.currentTarget;
    ai.targetPosition = this.targetPosition?.clone() || null;
    ai.lastKnownTargetPosition = this.lastKnownTargetPosition?.clone() || null;
    ai.patrolPoints = this.patrolPoints.map(p => p.clone());
    ai.currentPatrolIndex = this.currentPatrolIndex;
    ai.experience = this.experience;
    ai.kills = this.kills;
    ai.deaths = this.deaths;
    return ai;
  }

  /**
   * Reset to default values
   */
  reset(): void {
    this.state = AIState.IDLE;
    this.currentTarget = null;
    this.targetPosition = null;
    this.lastKnownTargetPosition = null;
    this.lastDecisionTime = 0;
    this.lastAttackTime = 0;
    this.lastSeenTargets.clear();
    this.lastHeardSounds.clear();
  }
}

/**
 * Factory for creating AI presets
 */
export class AIPresets {
  static rookie(): AIStats {
    return {
      reactionTime: 0.4,
      accuracy: 0.4,
      decisionFrequency: 2,
      personality: AIBehavior.PASSIVE,
      perception: {
        visionRange: 30,
        visionAngle: 90,
        hearingRange: 20,
        memoryDuration: 5
      }
    };
  }

  static veteran(): AIStats {
    return {
      reactionTime: 0.2,
      accuracy: 0.7,
      decisionFrequency: 5,
      personality: AIBehavior.AGGRESSIVE,
      perception: {
        visionRange: 50,
        visionAngle: 120,
        hearingRange: 35,
        memoryDuration: 10
      }
    };
  }

  static elite(): AIStats {
    return {
      reactionTime: 0.1,
      accuracy: 0.85,
      decisionFrequency: 8,
      personality: AIBehavior.DEFENSIVE,
      perception: {
        visionRange: 70,
        visionAngle: 150,
        hearingRange: 50,
        memoryDuration: 15
      }
    };
  }

  static sniper(): AIStats {
    return {
      reactionTime: 0.15,
      accuracy: 0.9,
      decisionFrequency: 3,
      personality: AIBehavior.SNEAKY,
      perception: {
        visionRange: 100,
        visionAngle: 60,
        hearingRange: 40,
        memoryDuration: 20
      }
    };
  }

  static support(): AIStats {
    return {
      reactionTime: 0.25,
      accuracy: 0.6,
      decisionFrequency: 4,
      personality: AIBehavior.SUPPORT,
      perception: {
        visionRange: 40,
        visionAngle: 100,
        hearingRange: 30,
        memoryDuration: 8
      }
    };
  }
}