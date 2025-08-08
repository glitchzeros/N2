import { System } from '@/engine/core/ecs/System';
import { ComponentType } from '@/engine/core/ecs/ComponentType';
import { Entity } from '@/engine/core/ecs/Entity';
import { Input } from '@/game/components/Input';
import { InputManager } from '@/engine/core/input/InputManager';

/**
 * System for processing input and updating input components
 */
export class InputSystem extends System {
  private inputQuery: any;
  private inputManager: InputManager;

  constructor(inputManager: InputManager) {
    super();
    this.priority = 200; // Very high priority - input should be processed first
    this.inputManager = inputManager;
  }

  getRequiredComponents(): ComponentType[] {
    return [Input.getType()];
  }

  onAdded(): void {
    if (this.world) {
      this.inputQuery = this.world.createQuery(Input.getType());
    }
  }

  update(deltaTime: number): void {
    // Update input manager (for gamepad polling)
    this.inputManager.update();

    const entities = this.inputQuery.getEntities();
    
    for (const entity of entities) {
      const input = this.world!.getComponent<Input>(entity, Input.getType());
      
      if (input && input.isLocalPlayer) {
        this.updateLocalPlayerInput(input);
      }
    }
  }

  /**
   * Update input for local player
   */
  private updateLocalPlayerInput(input: Input): void {
    // Reset input state
    input.reset();

    // Get movement input
    const movement = this.inputManager.getMovementInput();
    input.movement.copy(movement);

    // Get look input
    const look = this.inputManager.getLookInput();
    input.look.copy(look);

    // Get button states
    input.fire = this.inputManager.isFirePressed();
    input.jump = this.inputManager.isJumpPressed();
    input.sprint = this.inputManager.isSprintPressed();
    input.crouch = this.inputManager.isCrouchPressed();
    input.reload = this.inputManager.isReloadPressed();
    input.interact = this.inputManager.isInteractPressed();

    // Get other inputs
    input.inventory = this.inputManager.isKeyPressed('KeyI');
    input.map = this.inputManager.isKeyPressed('KeyM');
  }

  /**
   * Get input manager
   */
  getInputManager(): InputManager {
    return this.inputManager;
  }

  /**
   * Set mouse sensitivity
   */
  setMouseSensitivity(sensitivity: number): void {
    this.inputManager.setSensitivity(sensitivity);
  }

  /**
   * Get mouse sensitivity
   */
  getMouseSensitivity(): number {
    return this.inputManager.getSensitivity();
  }

  /**
   * Enable/disable input
   */
  setInputEnabled(enabled: boolean): void {
    this.inputManager.setEnabled(enabled);
  }

  /**
   * Get input snapshot for networking
   */
  getInputSnapshot(): any {
    return this.inputManager.getSnapshot();
  }

  /**
   * Apply input snapshot (for remote players)
   */
  applyInputSnapshot(entity: Entity, snapshot: any): void {
    const input = this.world!.getComponent<Input>(entity, Input.getType());
    if (!input) return;

    // Apply movement
    if (snapshot.movement) {
      input.movement.set(snapshot.movement.x, snapshot.movement.y);
    }

    // Apply look
    if (snapshot.look) {
      input.look.set(snapshot.look.x, snapshot.look.y);
    }

    // Apply buttons
    if (snapshot.buttons) {
      input.fire = snapshot.buttons.fire || false;
      input.jump = snapshot.buttons.jump || false;
      input.sprint = snapshot.buttons.sprint || false;
      input.crouch = snapshot.buttons.crouch || false;
      input.reload = snapshot.buttons.reload || false;
      input.interact = snapshot.buttons.interact || false;
    }
  }

  /**
   * Get local player input
   */
  getLocalPlayerInput(): Input | null {
    const entities = this.inputQuery.getEntities();
    
    for (const entity of entities) {
      const input = this.world!.getComponent<Input>(entity, Input.getType());
      if (input && input.isLocalPlayer) {
        return input;
      }
    }
    
    return null;
  }

  /**
   * Check if any input is active
   */
  hasInput(): boolean {
    const localInput = this.getLocalPlayerInput();
    if (!localInput) return false;

    return (
      localInput.movement.length() > 0 ||
      localInput.look.length() > 0 ||
      localInput.fire ||
      localInput.jump ||
      localInput.sprint ||
      localInput.crouch ||
      localInput.reload ||
      localInput.interact ||
      localInput.inventory ||
      localInput.map
    );
  }

  /**
   * Get input debug info
   */
  getDebugInfo(): any {
    const localInput = this.getLocalPlayerInput();
    if (!localInput) return null;

    return {
      movement: {
        x: localInput.movement.x,
        y: localInput.movement.y,
        length: localInput.movement.length()
      },
      look: {
        x: localInput.look.x,
        y: localInput.look.y,
        length: localInput.look.length()
      },
      buttons: {
        fire: localInput.fire,
        jump: localInput.jump,
        sprint: localInput.sprint,
        crouch: localInput.crouch,
        reload: localInput.reload,
        interact: localInput.interact,
        inventory: localInput.inventory,
        map: localInput.map
      },
      sensitivity: this.inputManager.getSensitivity(),
      gamepadConnected: this.inputManager.getSnapshot().gamepad.connected
    };
  }
}