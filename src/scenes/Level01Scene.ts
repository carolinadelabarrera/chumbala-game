import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { Player } from '../entities/Player';
import { LEVEL01 } from '../level/level01Layout';
import { InputSystem } from '../systems/InputSystem';
import { TutorialSystem } from '../systems/TutorialSystem';
import { TouchControls } from '../ui/TouchControls';
import { isMobilePortrait } from '../ui/viewport';

export class Level01Scene extends Phaser.Scene {
  player!: Player;
  private actions!: InputSystem;
  private controls!: TouchControls;
  private tutorial!: TutorialSystem;
  private portrait = false;

  constructor() { super('Level01Scene'); }

  create(): void {
    this.physics.world.setBounds(0, 0, LEVEL01.width, LEVEL01.height);
    this.add.circle(1080, 110, 50, 0xffdf9b).setScrollFactor(0.3);
    const ground = this.physics.add.staticGroup();
    const solid = (x: number, y: number, width: number, height: number, color: number) => {
      const rectangle = this.add.rectangle(x, y, width, height, color).setOrigin(0);
      ground.add(rectangle);
      (rectangle.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    };
    solid(0, LEVEL01.floorY, LEVEL01.width, LEVEL01.height - LEVEL01.floorY, 0x4e4568);
    const obstacle = LEVEL01.obstacle;
    solid(obstacle.x, LEVEL01.floorY - obstacle.height, obstacle.width, obstacle.height, 0xe7ad66);
    this.add.rectangle(LEVEL01.width / 2, LEVEL01.floorY, LEVEL01.width, 6, 0xc5b6e7);
    this.player = new Player(this, LEVEL01.spawn.x, LEVEL01.spawn.y);
    this.physics.add.collider(this.player, ground);
    this.actions = new InputSystem(this);
    this.controls = new TouchControls(this.actions);
    this.tutorial = new TutorialSystem(this.controls);
    this.applyOrientation();
    this.cameras.main.setBounds(0, 0, LEVEL01.width, LEVEL01.height);
    this.cameras.main.startFollow(this.player, true, TUNING.camera.lerp, TUNING.camera.lerp);
    this.cameras.main.setDeadzone(TUNING.camera.deadzoneWidth, TUNING.camera.deadzoneHeight);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
      this.actions.destroy();
    });
  }

  update(now: number, delta: number): void {
    this.applyOrientation();
    if (this.portrait) return;
    this.player.updateMovement(now, this.actions.snapshot());
    this.tutorial.update(delta, this.player);
  }

  private applyOrientation(): void {
    const portrait = isMobilePortrait();
    if (portrait !== this.portrait) {
      this.portrait = portrait;
      this.controls.setPortrait(portrait);
      this.actions.reset();
      this.player.clearJumpTiming();
      if (portrait) this.physics.world.pause();
      else this.physics.world.resume();
      if (import.meta.env.DEV) {
        window.dispatchEvent(new CustomEvent('chumbala:orientation', {
          detail: portrait ? 'portrait-suspended' : 'landscape-playing',
        }));
      }
    }
  }
}
