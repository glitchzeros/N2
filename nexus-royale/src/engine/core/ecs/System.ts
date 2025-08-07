import { World } from './World';

export interface SystemContext {
  world: World;
}

export interface System {
  readonly name: string;
  readonly priority: number;
  init?(ctx: SystemContext): void;
  update(ctx: SystemContext, fixedDeltaSeconds: number): void;
  dispose?(ctx: SystemContext): void;
}