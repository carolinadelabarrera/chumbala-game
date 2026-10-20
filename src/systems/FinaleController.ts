import Phaser from 'phaser';
import { LEVEL01 } from '../level/level01Layout';
import { Ofrenda } from '../entities/Ofrenda';
import type { Player } from '../entities/Player';
import type { Zombie } from '../entities/Zombie';
import type { CheckpointSystem } from './CheckpointSystem';
import type { InputSystem } from './InputSystem';
import type { TouchControls } from '../ui/TouchControls';
import { ChoicePanel } from '../ui/ChoicePanel';
import { isMobilePortrait } from '../ui/viewport';
import { RestSystem } from './RestSystem';

export class FinaleController {
  readonly flow: RestSystem;
  readonly ofrenda: Ofrenda;
  private panel?: ChoicePanel;
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly zombie: Zombie;
  private readonly actions: InputSystem;
  private readonly controls: TouchControls;
  private readonly overlap: Phaser.Physics.Arcade.Collider;

  private readonly rest = () => {
    this.ofrenda.activate();
    this.lockInput();
    this.panel = new ChoicePanel('Rest', [
      { id: 'continue', label: 'Keep going', icon: 'continue', select: () => this.flow.continue() },
      { id: 'stop', label: 'Stop here', icon: 'stop', select: () => this.flow.stop() },
    ], true);
  };
  private readonly continued = () => {
    this.panel?.destroy();
    this.panel = undefined;
    this.actions.reset();
    this.player.clearJumpTiming();
    this.controls.setSuspended(false);
    if (!isMobilePortrait()) this.scene.physics.world.resume();
  };
  private readonly stopped = () => this.finish(true);
  private readonly completed = () => this.finish(false);
  private readonly ending = () => {
    this.lockInput();
    if (this.zombie.behavior.isCured()) {
      (this.zombie.body as Phaser.Physics.Arcade.Body).reset(this.player.x + 110, this.zombie.y);
    }
    this.scene.add.text(this.player.x, 320, 'GREAT JOB!', {
      fontFamily: 'system-ui', fontSize: '48px', color: '#ffdf9b', fontStyle: 'bold',
    }).setOrigin(0.5);
    for (let index = 0; index < 9; index++) {
      this.scene.add.rectangle(this.player.x - 240 + index * 60, 245, 36, 32,
        index % 2 ? 0xffcf70 : 0xd38694);
    }
  };

  constructor(scene: Phaser.Scene, player: Player, zombie: Zombie, actions: InputSystem,
    controls: TouchControls, checkpoints: CheckpointSystem, canActivate: () => boolean) {
    this.scene = scene;
    this.player = player;
    this.zombie = zombie;
    this.actions = actions;
    this.controls = controls;
    this.flow = new RestSystem(checkpoints, LEVEL01.ofrenda.checkpoint, scene.events);
    this.ofrenda = new Ofrenda(scene);
    this.overlap = scene.physics.add.overlap(player, this.ofrenda.trigger, () => {
      if (player.grounded && canActivate()) this.flow.activate();
    });
    scene.events.on('rest:started', this.rest);
    scene.events.on('rest:continued', this.continued);
    scene.events.on('rest:stopped', this.stopped);
    scene.events.on('ending:started', this.ending);
    scene.events.on('level:completed', this.completed);
  }

  get blocksGameplay(): boolean { return this.flow.blocksGameplay; }

  restoreCheckpoint(): void {
    this.flow.restoreContinued();
    this.ofrenda.activate();
  }

  checkProgress(): void {
    if (this.player.grounded && this.player.x >= LEVEL01.ending.start) this.flow.beginEnding();
  }

  update(delta: number): void {
    if (this.flow.phase === 'ENDING' && this.zombie.behavior.isCured()) {
      this.zombie.setAngle(Math.sin(this.flow.endingElapsed / 200) * 3);
    }
    this.flow.update(delta);
  }

  destroy(): void {
    this.panel?.destroy();
    this.overlap.destroy();
    const events = this.scene.events;
    events.off('rest:started', this.rest);
    events.off('rest:continued', this.continued);
    events.off('rest:stopped', this.stopped);
    events.off('ending:started', this.ending);
    events.off('level:completed', this.completed);
  }

  private lockInput(): void {
    this.controls.setSuspended(true);
    this.actions.reset();
    this.player.clearJumpTiming();
    this.player.setVelocity(0, 0).setAlpha(1);
    this.zombie.setVelocity(0, 0);
    this.scene.physics.world.pause();
  }

  private finish(rested: boolean): void {
    this.scene.scene.start('EndScene', { rested, cured: this.zombie.behavior.isCured() });
  }
}
