import { TUNING } from '../config/tuning';
import { LEVEL01 } from '../level/level01Layout';
import type { Player } from '../entities/Player';
import type { TouchControls } from '../ui/TouchControls';

export class TutorialSystem {
  private moved = false;
  private jumped = false;
  private elapsed = 0;

  constructor(private readonly controls: TouchControls) {}

  update(delta: number, player: Player): void {
    this.elapsed += delta;
    if (Math.abs(player.x - LEVEL01.spawn.x) > TUNING.tutorial.movedDistance) this.moved = true;
    const obstacle = LEVEL01.obstacle;
    if (player.grounded && player.x - TUNING.player.width / 2 > obstacle.x + obstacle.width) {
      this.jumped = true;
    }
    this.controls.hint('right', !this.moved && this.elapsed >= TUNING.tutorial.moveDelayMs);
    this.controls.hint('jump', !this.jumped && player.x >= obstacle.x - TUNING.tutorial.approachDistance);
  }
}
