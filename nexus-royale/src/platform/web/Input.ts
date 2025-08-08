export type InputSnapshot = {
  moveX: number;
  moveY: number;
  lookDeltaX: number;
  lookDeltaY: number;
  fire: boolean;
};

export type InputMapping = {
  left: string[];
  right: string[];
  forward: string[];
  backward: string[];
  fire: string[]; // additional keys besides mouse
};

export const defaultMapping: InputMapping = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  fire: ['Space']
};

export function computeAxesFromKeys(keys: Set<string>, mapping: InputMapping): { x: number; y: number; fire: boolean } {
  const x = (mapping.right.some(k => keys.has(k)) ? 1 : 0) + (mapping.left.some(k => keys.has(k)) ? -1 : 0);
  const y = (mapping.forward.some(k => keys.has(k)) ? 1 : 0) + (mapping.backward.some(k => keys.has(k)) ? -1 : 0);
  const fire = mapping.fire.some(k => keys.has(k));
  return { x, y, fire };
}

export class Input {
  private keys = new Set<string>();
  private lookX = 0;
  private lookY = 0;
  private fireDown = false;
  private deadZone = 0.001;
  private mapping: InputMapping = defaultMapping;

  setMapping(mapping: InputMapping): void { this.mapping = mapping; }
  getMapping(): InputMapping { return this.mapping; }

  attach(element: HTMLElement | Window = window): void {
    element.addEventListener('keydown', this.onKeyDown);
    element.addEventListener('keyup', this.onKeyUp);
    element.addEventListener('mousedown', this.onMouseDown);
    element.addEventListener('mouseup', this.onMouseUp);
    element.addEventListener('mousemove', this.onMouseMove as EventListener);
  }

  detach(element: HTMLElement | Window = window): void {
    element.removeEventListener('keydown', this.onKeyDown);
    element.removeEventListener('keyup', this.onKeyUp);
    element.removeEventListener('mousedown', this.onMouseDown);
    element.removeEventListener('mouseup', this.onMouseUp);
    element.removeEventListener('mousemove', this.onMouseMove as EventListener);
  }

  snapshot(): InputSnapshot {
    const axes = computeAxesFromKeys(this.keys, this.mapping);
    const moveX = axes.x;
    const moveY = axes.y;

    const dx = Math.abs(this.lookX) < this.deadZone ? 0 : this.lookX;
    const dy = Math.abs(this.lookY) < this.deadZone ? 0 : this.lookY;

    const snap: InputSnapshot = {
      moveX,
      moveY,
      lookDeltaX: dx,
      lookDeltaY: dy,
      fire: this.fireDown || axes.fire,
    };

    this.lookX = 0; this.lookY = 0;
    return snap;
  }

  private onKeyDown = (e: KeyboardEvent): void => { this.keys.add(e.code); };
  private onKeyUp = (e: KeyboardEvent): void => { this.keys.delete(e.code); };
  private onMouseDown = (_e: MouseEvent): void => { this.fireDown = true; };
  private onMouseUp = (_e: MouseEvent): void => { this.fireDown = false; };
  private onMouseMove = (e: MouseEvent): void => {
    const dx = (e.movementX ?? 0) / 500;
    const dy = (e.movementY ?? 0) / 500;
    this.lookX += dx; this.lookY += dy;
  };
}

export const input = new Input();