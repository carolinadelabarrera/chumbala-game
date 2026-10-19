import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { Player } from '../entities/Player';
import { Candy } from '../entities/Candy';
import { Zombie } from '../entities/Zombie';
import { Xolo } from '../entities/Xolo';
import { XoloGuide } from '../systems/XoloGuide';
import { SafePointSystem } from '../systems/SafePointSystem';
import { DamageController } from '../systems/DamageController';
import { GiveController } from '../systems/GiveController';
import { HealthSystem } from '../systems/HealthSystem';
import { CandySystem } from '../systems/CandySystem';
import { HUD } from '../ui/HUD';
import { LEVEL01 } from '../level/level01Layout';
import { InputSystem } from '../systems/InputSystem';
import { TutorialSystem } from '../systems/TutorialSystem';
import { TouchControls } from '../ui/TouchControls';
import { isMobilePortrait } from '../ui/viewport';

export class Level01Scene extends Phaser.Scene {
  player!: Player;
  health!: HealthSystem;
  candySystem!: CandySystem;
  zombie!: Zombie;
  xolo!: Xolo;
  xoloGuide!: XoloGuide;
  damage!: DamageController;
  give!: GiveController;
  safePoints!: SafePointSystem;
  private gameplayTime = 0;
  private actions!: InputSystem;
  private controls!: TouchControls;
  private tutorial!: TutorialSystem;
  private moon!: Phaser.GameObjects.Arc;
  private portrait = false;

  constructor() { super('Level01Scene'); }

  create(): void {
    this.gameplayTime = 0;
    this.physics.world.setBounds(0, 0, LEVEL01.width, LEVEL01.height);
    this.moon = this.add.circle(1080, 110, 50, 0xffdf9b).setScrollFactor(0.3);
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
    const shelf = LEVEL01.secret.shelf;
    const nook = this.add.rectangle(shelf.x, shelf.y, shelf.width, shelf.height, 0x8979a6).setOrigin(0);
    this.physics.add.existing(nook, true);
    const nookBody = nook.body as Phaser.Physics.Arcade.StaticBody;
    nookBody.updateFromGameObject();
    // Only the top is solid: walking underneath and jumping through both work.
    nookBody.checkCollision.down = false;
    nookBody.checkCollision.left = false;
    nookBody.checkCollision.right = false;
    this.physics.add.collider(this.player, nook);
    this.health = new HealthSystem(this.events);
    this.candySystem = new CandySystem(this.health, this.events);
    const hud = new HUD(this.events, this.health, this.candySystem);
    const candies = this.physics.add.staticGroup();
    for (const placement of LEVEL01.candies) {
      candies.add(new Candy(this, placement.id, placement.x, placement.y));
    }
    this.physics.add.overlap(this.player, candies, (_player, candy) => {
      if (candy instanceof Candy) candy.collect(this.candySystem);
    });
    this.actions = new InputSystem(this);
    this.controls = new TouchControls(this.actions);
    this.zombie = new Zombie(this, LEVEL01.zombie.x, LEVEL01.zombie.y, LEVEL01.zombie);
    this.physics.add.collider(this.zombie, ground);
    this.safePoints = new SafePointSystem(LEVEL01.safePoints);
    this.damage = new DamageController(this, this.player, this.zombie, this.health, this.safePoints,
      // Drain queued jump presses while preserving a held movement finger.
      () => { this.actions.snapshot(); this.resetXolo(); });
    this.give = new GiveController(this, this.player, this.zombie, this.damage);
    this.xolo = new Xolo(this);
    this.xolo.behavior.reset(this.xoloFrame(), false);
    this.xoloGuide = new XoloGuide(this.events, this.xolo.behavior);
    this.xolo.present();
    // Blueprint reward beat: one normal candy, using the existing health-only rule.
    const revealCureCandy = () => {
      candies.add(new Candy(this, 'first-cure-reward', this.zombie.x + 80, LEVEL01.floorY - TUNING.player.height / 2));
    };
    this.events.once('zombie:cured', revealCureCandy);
    const revealSecret = () => {
      for (const placement of LEVEL01.secret.candies) {
        candies.add(new Candy(this, placement.id, placement.x, placement.y));
      }
    };
    this.events.on('xolo:secretRevealed', revealSecret);
    this.tutorial = new TutorialSystem(this.controls, this.events, this.give.rules);
    this.applyOrientation();
    this.cameras.main.setBounds(0, 0, LEVEL01.width, LEVEL01.height);
    this.cameras.main.startFollow(this.player, true, TUNING.camera.lerp, TUNING.camera.lerp);
    this.cameras.main.setDeadzone(TUNING.camera.deadzoneWidth, TUNING.camera.deadzoneHeight);
    this.applyCameraPresentation();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      hud.destroy();
      this.tutorial.destroy();
      this.events.off('zombie:cured', revealCureCandy);
      this.events.off('xolo:secretRevealed', revealSecret);
      this.xoloGuide.destroy();
      this.controls.destroy();
      this.actions.destroy();
    });
  }

  update(_now: number, delta: number): void {
    this.applyOrientation();
    if (this.portrait) return;
    this.applyCameraPresentation();
    this.gameplayTime += delta;
    const actions = this.actions.snapshot();
    if (!this.damage.rules.respawning) {
      this.player.updateMovement(this.gameplayTime, actions);
      this.tutorial.update(delta, this.player);
      this.safePoints.update(this.player.x, this.player.grounded);
      this.zombie.updateBehavior(this.gameplayTime, this.player.x);
    }
    this.give.update(this.gameplayTime, actions.givePressed);
    this.damage.update(this.gameplayTime, delta);
    if (!this.damage.rules.respawning) this.xoloGuide.update(delta, this.xoloFrame());
    this.xolo.present();
  }

  private xoloFrame() {
    return { playerX: this.player.x, playerY: this.player.y,
      playerFacing: (this.player.flipX ? -1 : 1) as -1 | 1,
      zombieX: this.zombie.x, worldWidth: LEVEL01.width };
  }

  private resetXolo(): void {
    this.xoloGuide.reset(this.xoloFrame());
    this.xolo.present();
  }

  private applyCameraPresentation(): void {
    const touchDevice = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
    const phoneLandscape = touchDevice && window.innerWidth > window.innerHeight
      && window.innerHeight <= TUNING.camera.phoneMaxShortSide;
    const camera = this.cameras.main;
    const zoom = phoneLandscape ? TUNING.camera.phoneLandscapeZoom : 1;
    if (camera.zoom !== zoom) camera.setZoom(zoom);
    camera.setLerp(TUNING.camera.lerp, phoneLandscape ? 0 : TUNING.camera.lerp);
    // Keep the mobile view bottom-aligned with the world. Zoom then raises the
    // floor above the controls without changing world geometry or jump physics.
    if (phoneLandscape) {
      camera.setScroll(camera.scrollX, LEVEL01.height - camera.height / 2 - camera.height / (2 * zoom));
    }
    // Preserve the decorative moon's screen height despite the zoomed crop.
    this.moon.y = phoneLandscape
      ? camera.height / 2 + (110 - camera.height / 2) / zoom + camera.scrollY * this.moon.scrollFactorY
      : 110;
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
