export type InputSnapshot = {
  moveX: number;
  moveY: number;
  lookDeltaX: number;
  lookDeltaY: number;
  fire: boolean;
};

export class Input {
  private keys = new Set<string>();
  private lookX = 0;
  private lookY = 0;
  private fireDown = false;
  private deadZone = 0.001;

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
    const moveX = (this.keys.has('KeyD') ? 1 : 0) + (this.keys.has('KeyA') ? -1 : 0);
    const moveY = (this.keys.has('KeyW') ? 1 : 0) + (this.keys.has('KeyS') ? -1 : 0);

    const dx = Math.abs(this.lookX) < this.deadZone ? 0 : this.lookX;
    const dy = Math.abs(this.lookY) < this.deadZone ? 0 : this.lookY;

    const snap: InputSnapshot = {
      moveX,
      moveY,
      lookDeltaX: dx,
      lookDeltaY: dy,
      fire: this.fireDown,
    };

    // consume look deltas each snapshot
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