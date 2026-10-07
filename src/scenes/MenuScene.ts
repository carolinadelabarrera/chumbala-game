import Phaser from 'phaser';
import { isMobilePortrait } from '../ui/viewport';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(): void {
    this.add.circle(990, 140, 60, 0xffdf9b);
    this.add.text(640, 255, 'CHÚMBALA!', {
      fontFamily: 'system-ui', fontSize: '88px', color: '#fff5d9', fontStyle: 'bold',
    }).setOrigin(0.5);
    const play = this.add.rectangle(640, 450, 300, 130, 0x685594)
      .setStrokeStyle(4, 0xffcf70).setInteractive({ useHandCursor: true });
    this.add.text(640, 450, '▶  PLAY', {
      fontFamily: 'system-ui', fontSize: '46px', color: '#fff5d9',
    }).setOrigin(0.5);
    const start = () => { if (!isMobilePortrait()) this.scene.start('Level01Scene'); };
    play.on('pointerup', start);
    this.input.keyboard!.once('keydown-ENTER', start);
    this.input.keyboard!.once('keydown-SPACE', start);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard!.removeAllListeners());
  }
}
