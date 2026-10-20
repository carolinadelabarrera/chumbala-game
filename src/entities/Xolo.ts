import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { LEVEL01 } from '../level/level01Layout';
import { XoloBehavior } from '../systems/XoloBehavior';
import { ensurePanTextures } from '../ui/PanVisual';

// A display object, not an Arcade body: Xolo cannot collide, push or take damage.
export class Xolo extends Phaser.GameObjects.Sprite {
  readonly behavior = new XoloBehavior();
  private readonly pan: Phaser.GameObjects.Image;
  private readonly bark: Phaser.GameObjects.Graphics;
  private previousX?: number;
  private walkedDistance = 0;

  constructor(scene: Phaser.Scene) {
    if (!scene.textures.exists('xolo')) {
      const art = scene.make.graphics({ x: 0, y: 0 });
      // Frame zero is the standing pose; the remaining frames form a walk cycle.
      for (let frame = 0; frame <= TUNING.xolo.walkFrames; frame++) {
        const phase = frame === 0 ? 0 : (frame - 1) / TUNING.xolo.walkFrames * Math.PI * 2;
        const swing = frame === 0 ? 0 : Math.sin(phase) * 7;
        art.save().translateCanvas(frame * TUNING.xolo.width, 0);
        // Far legs counter the near legs. Feet lift on their forward swing.
        for (const far of [true, false]) {
          art.lineStyle(7, far ? 0x8979a6 : 0xc3adf2);
          for (const [hip, direction] of [[22, 1], [49, -1]]) {
            const step = swing * direction * (far ? -1 : 1);
            art.lineBetween(hip, 46, hip + step, 61 - Math.max(0, step) * 0.55);
          }
        }
        art.fillStyle(0xc3adf2).fillRoundedRect(14, 30, 44, 22, 9);
        art.fillStyle(0x71608e).fillRoundedRect(18, 33, 36, 17, 7);
        art.fillStyle(0xc3adf2);
        art.fillTriangle(48, 26, 48, 2, 59, 24).fillTriangle(60, 23, 67, 0, 70, 29);
        art.fillRoundedRect(44, 20, 28, 25, 9).fillRoundedRect(61, 31, 15, 12, 5);
        art.lineStyle(6, 0xc3adf2).lineBetween(16, 38, 3, 24);
        art.fillStyle(0xffdf9b).fillCircle(62, 29, 5);
        art.fillStyle(0x30284e).fillCircle(64, 29, 2).fillCircle(73, 34, 3);
        art.lineStyle(4, 0xffcf70).lineBetween(48, 43, 60, 43);
        art.restore();
      }
      // One calm sitting pose after the existing standing/walk frames.
      art.save().translateCanvas((TUNING.xolo.walkFrames + 1) * TUNING.xolo.width, 0);
      art.fillStyle(0xc3adf2).fillEllipse(27, 49, 28, 26).fillRoundedRect(43, 35, 15, 27, 6)
        .fillRoundedRect(44, 28, 28, 25, 9).fillRoundedRect(61, 39, 15, 12, 5);
      art.fillTriangle(48, 34, 48, 10, 59, 32).fillTriangle(60, 31, 67, 8, 70, 37);
      art.lineStyle(7, 0xc3adf2).lineBetween(21, 58, 36, 60).lineBetween(16, 52, 3, 47);
      art.lineStyle(3, 0x30284e).lineBetween(58, 37, 66, 37);
      art.fillStyle(0x30284e).fillCircle(73, 42, 3);
      art.lineStyle(4, 0xffcf70).lineBetween(48, 51, 60, 51);
      art.restore();
      art.generateTexture('xolo', TUNING.xolo.width * (TUNING.xolo.walkFrames + 2), TUNING.xolo.height);
      const texture = scene.textures.get('xolo');
      for (let frame = 0; frame <= TUNING.xolo.walkFrames + 1; frame++) {
        texture.add(frame, 0, frame * TUNING.xolo.width, 0, TUNING.xolo.width, TUNING.xolo.height);
      }
      art.destroy();
    }
    super(scene, 0, 0, 'xolo', 0);
    scene.add.existing(this);
    this.setDepth(2);
    ensurePanTextures(scene);
    this.pan = scene.add.image(0, 0, 'pan-de-muerto').setDepth(7).setVisible(false);
    this.bark = scene.add.graphics().setDepth(7);
    this.once(Phaser.GameObjects.Events.DESTROY, () => { this.pan.destroy(); this.bark.destroy(); });
  }

  present(): void {
    const behavior = this.behavior;
    const travel = this.previousX === undefined ? 0 : behavior.x - this.previousX;
    this.previousX = behavior.x;
    // Recovery is a relocation, not a very fast stride. Reactions keep their own pose.
    const walking = !behavior.recovered && Math.abs(travel) > 0.01
      && (behavior.state === 'FOLLOW' || behavior.state === 'HINT'
        || (behavior.state === 'SIT_CHECKPOINT' && !behavior.sitting));
    if (walking) this.walkedDistance += Math.abs(travel);
    else this.walkedDistance = 0;
    const phase = this.walkedDistance / TUNING.xolo.walkStride * Math.PI * 2;
    this.setFrame(walking ? 1 + Math.floor(this.walkedDistance / TUNING.xolo.walkStride
      * TUNING.xolo.walkFrames) % TUNING.xolo.walkFrames : 0);
    if (behavior.sitting) this.setFrame(TUNING.xolo.walkFrames + 1);
    const bob = walking ? Math.abs(Math.sin(phase)) * TUNING.xolo.walkBob : 0;
    const facing = walking ? Math.sign(travel) : behavior.facing;
    const obstacle = LEVEL01.obstacle;
    // A short visual arc over the only mandatory obstacle replaces pathfinding.
    const distance = Math.max(obstacle.x - behavior.x, behavior.x - obstacle.x - obstacle.width, 0);
    const rise = obstacle.height * Math.max(0, 1 - distance / TUNING.xolo.obstacleRamp);
    this.setPosition(behavior.x, LEVEL01.floorY - TUNING.xolo.height / 2 - rise - behavior.hop - bob);
    this.setFlipX(facing < 0);
    this.setAngle(behavior.state === 'CELEBRATE' ? Math.sin(behavior.elapsed / 100) * 8 : 0);
    this.pan.setPosition(this.x, this.y - 54).setVisible(behavior.showPan).setScale(behavior.hintEmphasis);
    this.bark.clear();
    if (behavior.showBark) {
      const direction = behavior.facing;
      this.bark.lineStyle(3, 0xffdf9b, 0.8);
      for (const offset of [-1, 0, 1]) {
        this.bark.lineBetween(this.x + direction * 44, this.y - 7 + offset * 9,
          this.x + direction * (44 + 12 * behavior.hintEmphasis), this.y - 7 + offset * 17);
      }
    }
  }
}
