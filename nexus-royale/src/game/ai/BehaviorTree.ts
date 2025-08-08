import { Vector3 } from '@/engine/core/math/Vector3';
import { AIComponent, AIState } from './AIComponent';
import { Transform } from '@/game/components/Transform';
import { Player } from '@/game/components/Player';
import { Pathfinding } from './Pathfinding';

export enum NodeStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RUNNING = 'running'
}

export interface BehaviorContext {
  ai: AIComponent;
  transform: Transform;
  player?: Player;
  pathfinding: Pathfinding;
  deltaTime: number;
}

/**
 * Base class for behavior tree nodes
 */
export abstract class BehaviorNode {
  protected children: BehaviorNode[] = [];
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract tick(context: BehaviorContext): NodeStatus;

  addChild(child: BehaviorNode): void {
    this.children.push(child);
  }

  getName(): string {
    return this.name;
  }
}

/**
 * Composite node that executes all children
 */
export class Sequence extends BehaviorNode {
  constructor(name: string = 'Sequence') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      if (status !== NodeStatus.SUCCESS) {
        return status;
      }
    }
    return NodeStatus.SUCCESS;
  }
}

/**
 * Composite node that executes children until one succeeds
 */
export class Selector extends BehaviorNode {
  constructor(name: string = 'Selector') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      if (status !== NodeStatus.FAILURE) {
        return status;
      }
    }
    return NodeStatus.FAILURE;
  }
}

/**
 * Decorator that inverts the result
 */
export class Inverter extends BehaviorNode {
  constructor(child: BehaviorNode, name: string = 'Inverter') {
    super(name);
    this.addChild(child);
  }

  tick(context: BehaviorContext): NodeStatus {
    if (this.children.length === 0) return NodeStatus.FAILURE;
    
    const status = this.children[0].tick(context);
    return status === NodeStatus.SUCCESS ? NodeStatus.FAILURE : 
           status === NodeStatus.FAILURE ? NodeStatus.SUCCESS : NodeStatus.RUNNING;
  }
}

/**
 * Decorator that repeats the child
 */
export class Repeater extends BehaviorNode {
  private maxRepeats: number;
  private currentRepeats: number;

  constructor(child: BehaviorNode, maxRepeats: number = -1, name: string = 'Repeater') {
    super(name);
    this.maxRepeats = maxRepeats;
    this.currentRepeats = 0;
    this.addChild(child);
  }

  tick(context: BehaviorContext): NodeStatus {
    if (this.children.length === 0) return NodeStatus.FAILURE;
    
    if (this.maxRepeats > 0 && this.currentRepeats >= this.maxRepeats) {
      return NodeStatus.SUCCESS;
    }

    const status = this.children[0].tick(context);
    if (status === NodeStatus.SUCCESS) {
      this.currentRepeats++;
      this.children[0] = this.children[0]; // Reset child
    }
    
    return NodeStatus.RUNNING;
  }
}

/**
 * Action node for idle behavior
 */
export class IdleAction extends BehaviorNode {
  private idleTime: number = 0;
  private maxIdleTime: number = 3;

  constructor(name: string = 'Idle') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    this.idleTime += context.deltaTime;
    
    if (this.idleTime >= this.maxIdleTime) {
      this.idleTime = 0;
      return NodeStatus.SUCCESS;
    }
    
    return NodeStatus.RUNNING;
  }
}

/**
 * Action node for patrolling
 */
export class PatrolAction extends BehaviorNode {
  private currentPath: Vector3[] = [];
  private pathIndex: number = 0;
  private moveSpeed: number = 5;

  constructor(name: string = 'Patrol') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    const ai = context.ai;
    const transform = context.transform;

    // Set state
    ai.changeState(AIState.PATROL);

    // Generate patrol points if none exist
    if (ai.patrolPoints.length === 0) {
      this.generatePatrolPoints(context);
    }

    // Get current patrol point
    const targetPoint = ai.getCurrentPatrolPoint();
    if (!targetPoint) {
      return NodeStatus.FAILURE;
    }

    // Check if we've reached the target
    const distance = transform.position.distanceTo(targetPoint);
    if (distance < 2) {
      // Move to next patrol point
      ai.getNextPatrolPoint();
      return NodeStatus.SUCCESS;
    }

    // Move towards target
    const direction = targetPoint.clone().sub(transform.position).normalize();
    const movement = direction.clone().multiplyScalar(this.moveSpeed * context.deltaTime);
    transform.position.add(movement);
    
    // Rotate towards target
    transform.lookAt(targetPoint);

    return NodeStatus.RUNNING;
  }

  private generatePatrolPoints(context: BehaviorContext): void {
    const ai = context.ai;
    const transform = context.transform;
    const points: Vector3[] = [];

    // Generate 3-5 patrol points around current position
    const numPoints = 3 + Math.floor(Math.random() * 3);
    const radius = 20 + Math.random() * 30;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const point = new Vector3(
        transform.position.x + Math.cos(angle) * radius,
        transform.position.y,
        transform.position.z + Math.sin(angle) * radius
      );

      // Find nearest walkable position
      const walkablePoint = context.pathfinding.findNearestWalkable(point);
      if (walkablePoint) {
        points.push(walkablePoint);
      }
    }

    ai.setPatrolPoints(points);
  }
}

/**
 * Action node for searching
 */
export class SearchAction extends BehaviorNode {
  private searchTime: number = 0;
  private maxSearchTime: number = 10;
  private searchRadius: number = 30;

  constructor(name: string = 'Search') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    const ai = context.ai;
    const transform = context.transform;

    // Set state
    ai.changeState(AIState.SEARCH);

    // Check if we have a last known position
    if (!ai.lastKnownTargetPosition) {
      return NodeStatus.FAILURE;
    }

    this.searchTime += context.deltaTime;
    if (this.searchTime >= this.maxSearchTime) {
      this.searchTime = 0;
      return NodeStatus.FAILURE;
    }

    // Move towards last known position
    const direction = ai.lastKnownTargetPosition.clone().sub(transform.position).normalize();
    const movement = direction.clone().multiplyScalar(5 * context.deltaTime);
    transform.position.add(movement);
    
    // Rotate towards target
    transform.lookAt(ai.lastKnownTargetPosition);

    // Check if we're close enough
    const distance = transform.position.distanceTo(ai.lastKnownTargetPosition);
    if (distance < 5) {
      this.searchTime = 0;
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }
}

/**
 * Action node for combat
 */
export class CombatAction extends BehaviorNode {
  private attackCooldown: number = 0;

  constructor(name: string = 'Combat') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    const ai = context.ai;
    const transform = context.transform;

    // Set state
    ai.changeState(AIState.COMBAT);

    // Check if we have a target
    if (!ai.currentTarget || !ai.targetPosition) {
      return NodeStatus.FAILURE;
    }

    // Update attack cooldown
    this.attackCooldown += context.deltaTime;

    // Calculate distance to target
    const distance = transform.position.distanceTo(ai.targetPosition);

    // Check if target is in weapon range
    if (distance <= ai.weaponRange) {
      // Face target
      transform.lookAt(ai.targetPosition);

      // Attack if cooldown is ready
      if (this.attackCooldown >= ai.attackCooldown) {
        this.attackCooldown = 0;
        ai.recordAttack();
        
        // Simulate attack (would trigger weapon system)
        console.log(`AI ${ai.currentTarget} attacks target at ${ai.targetPosition.toString()}`);
      }

      return NodeStatus.RUNNING;
    } else {
      // Move towards target
      const direction = ai.targetPosition.clone().sub(transform.position).normalize();
      const movement = direction.clone().multiplyScalar(ai.sprintSpeed * context.deltaTime);
      transform.position.add(movement);
      
      // Rotate towards target
      transform.lookAt(ai.targetPosition);

      return NodeStatus.RUNNING;
    }
  }
}

/**
 * Action node for retreating
 */
export class RetreatAction extends BehaviorNode {
  private retreatTime: number = 0;
  private maxRetreatTime: number = 5;

  constructor(name: string = 'Retreat') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    const ai = context.ai;
    const transform = context.transform;

    // Set state
    ai.changeState(AIState.RETREAT);

    this.retreatTime += context.deltaTime;
    if (this.retreatTime >= this.maxRetreatTime) {
      this.retreatTime = 0;
      return NodeStatus.SUCCESS;
    }

    // Move away from last known target position
    if (ai.lastKnownTargetPosition) {
      const direction = transform.position.clone().sub(ai.lastKnownTargetPosition).normalize();
      const movement = direction.clone().multiplyScalar(ai.sprintSpeed * context.deltaTime);
      transform.position.add(movement);
      
      // Rotate away from target
      transform.lookAt(transform.position.clone().add(direction));
    }

    return NodeStatus.RUNNING;
  }
}

/**
 * Condition node for checking if target is visible
 */
export class HasVisibleTargetCondition extends BehaviorNode {
  constructor(name: string = 'HasVisibleTarget') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    const ai = context.ai;
    const transform = context.transform;

    const target = ai.getClosestVisibleTarget(transform.position, transform.getForward());
    return target ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

/**
 * Condition node for checking if target is in range
 */
export class TargetInRangeCondition extends BehaviorNode {
  private range: number;

  constructor(range: number, name: string = 'TargetInRange') {
    super(name);
    this.range = range;
  }

  tick(context: BehaviorContext): NodeStatus {
    const ai = context.ai;
    const transform = context.transform;

    if (!ai.targetPosition) return NodeStatus.FAILURE;

    const distance = transform.position.distanceTo(ai.targetPosition);
    return distance <= this.range ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

/**
 * Condition node for checking health
 */
export class HealthCheckCondition extends BehaviorNode {
  private threshold: number;
  private checkShield: boolean;

  constructor(threshold: number, checkShield: boolean = false, name: string = 'HealthCheck') {
    super(name);
    this.threshold = threshold;
    this.checkShield = checkShield;
  }

  tick(context: BehaviorContext): NodeStatus {
    const player = context.player;
    if (!player) return NodeStatus.FAILURE;

    const health = this.checkShield ? player.shield / player.maxShield : player.health / player.maxHealth;
    return health <= this.threshold ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

/**
 * Condition node for checking if can attack
 */
export class CanAttackCondition extends BehaviorNode {
  constructor(name: string = 'CanAttack') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    const ai = context.ai;
    return ai.canAttack() ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

/**
 * Main behavior tree for AI
 */
export class BehaviorTree {
  private root: BehaviorNode;

  constructor(root: BehaviorNode) {
    this.root = root;
  }

  tick(context: BehaviorContext): NodeStatus {
    return this.root.tick(context);
  }

  /**
   * Create a standard AI behavior tree
   */
  static createStandardTree(): BehaviorTree {
    // Main selector: Choose between different behaviors
    const mainSelector = new Selector('MainSelector');

    // Retreat if health is low
    const retreatSequence = new Sequence('RetreatSequence');
    retreatSequence.addChild(new HealthCheckCondition(0.3, false, 'LowHealth'));
    retreatSequence.addChild(new RetreatAction());

    // Combat if target is visible and in range
    const combatSequence = new Sequence('CombatSequence');
    combatSequence.addChild(new HasVisibleTargetCondition());
    combatSequence.addChild(new TargetInRangeCondition(50, 'TargetInWeaponRange'));
    combatSequence.addChild(new CanAttackCondition());
    combatSequence.addChild(new CombatAction());

    // Search if we have a last known position
    const searchSequence = new Sequence('SearchSequence');
    searchSequence.addChild(new Inverter(new HasVisibleTargetCondition(), 'NoVisibleTarget'));
    searchSequence.addChild(new SearchAction());

    // Patrol as default behavior
    const patrolSequence = new Sequence('PatrolSequence');
    patrolSequence.addChild(new Inverter(new HasVisibleTargetCondition(), 'NoVisibleTarget'));
    patrolSequence.addChild(new PatrolAction());

    // Add all behaviors to main selector
    mainSelector.addChild(retreatSequence);
    mainSelector.addChild(combatSequence);
    mainSelector.addChild(searchSequence);
    mainSelector.addChild(patrolSequence);

    return new BehaviorTree(mainSelector);
  }

  /**
   * Create an aggressive AI behavior tree
   */
  static createAggressiveTree(): BehaviorTree {
    const mainSelector = new Selector('AggressiveSelector');

    // Retreat only if very low health
    const retreatSequence = new Sequence('RetreatSequence');
    retreatSequence.addChild(new HealthCheckCondition(0.1, false, 'VeryLowHealth'));
    retreatSequence.addChild(new RetreatAction());

    // Aggressive combat
    const combatSequence = new Sequence('CombatSequence');
    combatSequence.addChild(new HasVisibleTargetCondition());
    combatSequence.addChild(new CombatAction());

    // Search aggressively
    const searchSequence = new Sequence('SearchSequence');
    searchSequence.addChild(new Inverter(new HasVisibleTargetCondition(), 'NoVisibleTarget'));
    searchSequence.addChild(new SearchAction());

    // Patrol
    const patrolSequence = new Sequence('PatrolSequence');
    patrolSequence.addChild(new PatrolAction());

    mainSelector.addChild(retreatSequence);
    mainSelector.addChild(combatSequence);
    mainSelector.addChild(searchSequence);
    mainSelector.addChild(patrolSequence);

    return new BehaviorTree(mainSelector);
  }

  /**
   * Create a defensive AI behavior tree
   */
  static createDefensiveTree(): BehaviorTree {
    const mainSelector = new Selector('DefensiveSelector');

    // Retreat at higher health threshold
    const retreatSequence = new Sequence('RetreatSequence');
    retreatSequence.addChild(new HealthCheckCondition(0.5, false, 'MediumHealth'));
    retreatSequence.addChild(new RetreatAction());

    // Defensive combat (only when target is close)
    const combatSequence = new Sequence('CombatSequence');
    combatSequence.addChild(new HasVisibleTargetCondition());
    combatSequence.addChild(new TargetInRangeCondition(30, 'CloseRange'));
    combatSequence.addChild(new CanAttackCondition());
    combatSequence.addChild(new CombatAction());

    // Cautious search
    const searchSequence = new Sequence('SearchSequence');
    searchSequence.addChild(new Inverter(new HasVisibleTargetCondition(), 'NoVisibleTarget'));
    searchSequence.addChild(new SearchAction());

    // Patrol
    const patrolSequence = new Sequence('PatrolSequence');
    patrolSequence.addChild(new PatrolAction());

    mainSelector.addChild(retreatSequence);
    mainSelector.addChild(combatSequence);
    mainSelector.addChild(searchSequence);
    mainSelector.addChild(patrolSequence);

    return new BehaviorTree(mainSelector);
  }
}