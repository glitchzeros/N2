import { Component } from '@/engine/core/ecs/Component';
import { Vector2 } from '@/engine/core/math/Vector2';

/**
 * Input component for storing input state
 */
export class Input extends Component {
  public movement: Vector2;
  public look: Vector2;
  public fire: boolean;
  public jump: boolean;
  public sprint: boolean;
  public crouch: boolean;
  public reload: boolean;
  public interact: boolean;
  public inventory: boolean;
  public map: boolean;
  public isLocalPlayer: boolean;

  constructor(isLocalPlayer: boolean = false) {
    super();
    this.movement = new Vector2();
    this.look = new Vector2();
    this.fire = false;
    this.jump = false;
    this.sprint = false;
    this.crouch = false;
    this.reload = false;
    this.interact = false;
    this.inventory = false;
    this.map = false;
    this.isLocalPlayer = isLocalPlayer;
  }

  /**
   * Reset all input states
   */
  reset(): void {
    this.movement.set(0, 0);
    this.look.set(0, 0);
    this.fire = false;
    this.jump = false;
    this.sprint = false;
    this.crouch = false;
    this.reload = false;
    this.interact = false;
    this.inventory = false;
    this.map = false;
  }

  /**
   * Clone this input component
   */
  clone(): Input {
    const input = new Input(this.isLocalPlayer);
    input.movement.copy(this.movement);
    input.look.copy(this.look);
    input.fire = this.fire;
    input.jump = this.jump;
    input.sprint = this.sprint;
    input.crouch = this.crouch;
    input.reload = this.reload;
    input.interact = this.interact;
    input.inventory = this.inventory;
    input.map = this.map;
    return input;
  }
}