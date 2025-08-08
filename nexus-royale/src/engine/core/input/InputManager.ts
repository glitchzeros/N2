import { Vector2 } from '@/engine/core/math/Vector2';

export interface InputState {
  keyboard: Map<string, boolean>;
  mouse: {
    position: Vector2;
    delta: Vector2;
    buttons: Map<number, boolean>;
    wheel: number;
  };
  gamepad: {
    connected: boolean;
    axes: number[];
    buttons: Map<number, boolean>;
  };
}

export interface InputBindings {
  moveForward: string;
  moveBackward: string;
  moveLeft: string;
  moveRight: string;
  jump: string;
  crouch: string;
  sprint: string;
  fire: string;
  reload: string;
  interact: string;
  inventory: string;
  map: string;
}

/**
 * High-performance input manager for game controls
 */
export class InputManager {
  private state: InputState;
  private bindings: InputBindings;
  private isEnabled = true;
  private isPointerLocked = false;
  private sensitivity = 0.002; // Mouse sensitivity
  private deadZone = 0.1; // Gamepad dead zone

  constructor() {
    this.state = {
      keyboard: new Map(),
      mouse: {
        position: new Vector2(),
        delta: new Vector2(),
        buttons: new Map(),
        wheel: 0
      },
      gamepad: {
        connected: false,
        axes: [0, 0, 0, 0],
        buttons: new Map()
      }
    };

    this.bindings = {
      moveForward: 'KeyW',
      moveBackward: 'KeyS',
      moveLeft: 'KeyA',
      moveRight: 'KeyD',
      jump: 'Space',
      crouch: 'ShiftLeft',
      sprint: 'ControlLeft',
      fire: 'Mouse0',
      reload: 'KeyR',
      interact: 'KeyE',
      inventory: 'KeyI',
      map: 'KeyM'
    };

    this.setupEventListeners();
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Mouse events
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('wheel', this.handleWheel.bind(this));

    // Pointer lock events
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
    document.addEventListener('pointerlockerror', this.handlePointerLockError.bind(this));

    // Gamepad events
    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));

    // Focus events
    window.addEventListener('blur', this.handleBlur.bind(this));
    window.addEventListener('focus', this.handleFocus.bind(this));
  }

  /**
   * Handle key down events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;
    
    this.state.keyboard.set(event.code, true);
    
    // Prevent default for game keys
    if (this.isGameKey(event.code)) {
      event.preventDefault();
    }
  }

  /**
   * Handle key up events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled) return;
    
    this.state.keyboard.set(event.code, false);
  }

  /**
   * Handle mouse down events
   */
  private handleMouseDown(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    this.state.mouse.buttons.set(event.button, true);
    
    // Request pointer lock on left click
    if (event.button === 0 && !this.isPointerLocked) {
      document.body.requestPointerLock();
    }
  }

  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    this.state.mouse.buttons.set(event.button, false);
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isEnabled || !this.isPointerLocked) return;
    
    this.state.mouse.delta.x += event.movementX * this.sensitivity;
    this.state.mouse.delta.y += event.movementY * this.sensitivity;
  }

  /**
   * Handle mouse wheel events
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.isEnabled) return;
    
    this.state.mouse.wheel += event.deltaY;
  }

  /**
   * Handle pointer lock change
   */
  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement !== null;
  }

  /**
   * Handle pointer lock error
   */
  private handlePointerLockError(): void {
    console.warn('Failed to acquire pointer lock');
    this.isPointerLocked = false;
  }

  /**
   * Handle gamepad connected
   */
  private handleGamepadConnected(event: GamepadEvent): void {
    console.log(`Gamepad connected: ${event.gamepad.id}`);
    this.state.gamepad.connected = true;
  }

  /**
   * Handle gamepad disconnected
   */
  private handleGamepadDisconnected(event: GamepadEvent): void {
    console.log(`Gamepad disconnected: ${event.gamepad.id}`);
    this.state.gamepad.connected = false;
  }

  /**
   * Handle window blur
   */
  private handleBlur(): void {
    this.clearAllInputs();
  }

  /**
   * Handle window focus
   */
  private handleFocus(): void {
    // Reset input state on focus
  }

  /**
   * Update gamepad state
   */
  update(): void {
    if (!this.state.gamepad.connected) return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Use first gamepad

    if (gamepad) {
      // Update axes
      for (let i = 0; i < gamepad.axes.length; i++) {
        const value = gamepad.axes[i];
        this.state.gamepad.axes[i] = Math.abs(value) > this.deadZone ? value : 0;
      }

      // Update buttons
      for (let i = 0; i < gamepad.buttons.length; i++) {
        const button = gamepad.buttons[i];
        this.state.gamepad.buttons.set(i, button.pressed);
      }
    }
  }

  /**
   * Get movement input vector
   */
  getMovementInput(): Vector2 {
    const input = new Vector2();

    // Keyboard input
    if (this.isKeyPressed(this.bindings.moveForward)) input.y += 1;
    if (this.isKeyPressed(this.bindings.moveBackward)) input.y -= 1;
    if (this.isKeyPressed(this.bindings.moveLeft)) input.x -= 1;
    if (this.isKeyPressed(this.bindings.moveRight)) input.x += 1;

    // Gamepad input
    if (this.state.gamepad.connected) {
      input.x += this.state.gamepad.axes[0]; // Left stick X
      input.y -= this.state.gamepad.axes[1]; // Left stick Y
    }

    // Normalize if magnitude > 1
    if (input.length() > 1) {
      input.normalize();
    }

    return input;
  }

  /**
   * Get look input vector (mouse/gamepad)
   */
  getLookInput(): Vector2 {
    const input = new Vector2();

    // Mouse input
    input.add(this.state.mouse.delta);

    // Gamepad input
    if (this.state.gamepad.connected) {
      input.x += this.state.gamepad.axes[2] * 2; // Right stick X
      input.y += this.state.gamepad.axes[3] * 2; // Right stick Y
    }

    // Clear mouse delta after reading
    this.state.mouse.delta.set(0, 0);

    return input;
  }

  /**
   * Check if a key is pressed
   */
  isKeyPressed(keyCode: string): boolean {
    return this.state.keyboard.get(keyCode) || false;
  }

  /**
   * Check if a mouse button is pressed
   */
  isMousePressed(button: number): boolean {
    return this.state.mouse.buttons.get(button) || false;
  }

  /**
   * Check if a gamepad button is pressed
   */
  isGamepadPressed(button: number): boolean {
    return this.state.gamepad.buttons.get(button) || false;
  }

  /**
   * Get mouse wheel delta
   */
  getMouseWheel(): number {
    const wheel = this.state.mouse.wheel;
    this.state.mouse.wheel = 0;
    return wheel;
  }

  /**
   * Check if fire button is pressed
   */
  isFirePressed(): boolean {
    return this.isMousePressed(0) || this.isGamepadPressed(0);
  }

  /**
   * Check if jump button is pressed
   */
  isJumpPressed(): boolean {
    return this.isKeyPressed(this.bindings.jump) || this.isGamepadPressed(1);
  }

  /**
   * Check if sprint button is pressed
   */
  isSprintPressed(): boolean {
    return this.isKeyPressed(this.bindings.sprint) || this.isGamepadPressed(2);
  }

  /**
   * Check if crouch button is pressed
   */
  isCrouchPressed(): boolean {
    return this.isKeyPressed(this.bindings.crouch) || this.isGamepadPressed(3);
  }

  /**
   * Check if reload button is pressed
   */
  isReloadPressed(): boolean {
    return this.isKeyPressed(this.bindings.reload) || this.isGamepadPressed(4);
  }

  /**
   * Check if interact button is pressed
   */
  isInteractPressed(): boolean {
    return this.isKeyPressed(this.bindings.interact) || this.isGamepadPressed(5);
  }

  /**
   * Set mouse sensitivity
   */
  setSensitivity(sensitivity: number): void {
    this.sensitivity = sensitivity;
  }

  /**
   * Get mouse sensitivity
   */
  getSensitivity(): number {
    return this.sensitivity;
  }

  /**
   * Enable/disable input
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearAllInputs();
    }
  }

  /**
   * Clear all input states
   */
  private clearAllInputs(): void {
    this.state.keyboard.clear();
    this.state.mouse.buttons.clear();
    this.state.mouse.delta.set(0, 0);
    this.state.mouse.wheel = 0;
    this.state.gamepad.buttons.clear();
    this.state.gamepad.axes.fill(0);
  }

  /**
   * Check if key is a game key
   */
  private isGameKey(keyCode: string): boolean {
    const gameKeys = [
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'Space', 'ShiftLeft', 'ControlLeft',
      'KeyR', 'KeyE', 'KeyI', 'KeyM',
      'Escape', 'Tab'
    ];
    return gameKeys.includes(keyCode);
  }

  /**
   * Get input state snapshot
   */
  getSnapshot(): InputState {
    return {
      keyboard: new Map(this.state.keyboard),
      mouse: {
        position: this.state.mouse.position.clone(),
        delta: this.state.mouse.delta.clone(),
        buttons: new Map(this.state.mouse.buttons),
        wheel: this.state.mouse.wheel
      },
      gamepad: {
        connected: this.state.gamepad.connected,
        axes: [...this.state.gamepad.axes],
        buttons: new Map(this.state.gamepad.buttons)
      }
    };
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    window.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    window.removeEventListener('wheel', this.handleWheel.bind(this));
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
    window.removeEventListener('blur', this.handleBlur.bind(this));
    window.removeEventListener('focus', this.handleFocus.bind(this));
  }
}