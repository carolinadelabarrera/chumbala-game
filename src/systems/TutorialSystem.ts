import { TUNING } from '../config/tuning';
import { LEVEL01 } from '../level/level01Layout';
import type { Player } from '../entities/Player';
import type { TouchControls } from '../ui/TouchControls';
import type Phaser from 'phaser';
import type { GiveSystem } from './GiveSystem';

export class TutorialSystem {
  private moved = false;
  private jumped = false;
  private elapsed = 0;
  private firstDamage = false;
  private gave = false;
  private readonly hurt = () => { this.firstDamage = true; };
  private readonly giveStarted = () => { this.gave = true; };

  constructor(private readonly controls: TouchControls, private readonly events: Phaser.Events.EventEmitter,
    private readonly give: GiveSystem) {
    events.on('player:hurt', this.hurt);
    events.on('give:started', this.giveStarted);
  }

  update(delta: number, player: Player): void {
    this.elapsed += delta;
    if (Math.abs(player.x - LEVEL01.spawn.x) > TUNING.tutorial.movedDistance) this.moved = true;
    const obstacle = LEVEL01.obstacle;
    if (player.grounded && player.x - TUNING.player.width / 2 > obstacle.x + obstacle.width) {
      this.jumped = true;
    }
    this.controls.hint('right', !this.moved && this.elapsed >= TUNING.tutorial.moveDelayMs);
    this.controls.hint('jump', !this.jumped && player.x >= obstacle.x - TUNING.tutorial.approachDistance);
    if (this.firstDamage && player.x >= LEVEL01.giveTeaching.start && player.x <= LEVEL01.giveTeaching.end) this.give.enable();
    this.controls.setGiveAvailable(this.give.enabled);
    this.controls.hint('give', this.give.enabled && !this.gave);
  }

  destroy(): void {
    this.events.off('player:hurt', this.hurt);
    this.events.off('give:started', this.giveStarted);
  }
}
