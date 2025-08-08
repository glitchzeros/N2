export class PauseController {
  private paused = false;

  isPaused(): boolean { return this.paused; }
  pause(): void { this.paused = true; }
  resume(): void { this.paused = false; }
  toggle(): void { this.paused = !this.paused; }
}