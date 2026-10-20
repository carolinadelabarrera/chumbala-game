import Phaser from 'phaser';
import { ChoicePanel } from '../ui/ChoicePanel';

export class EndScene extends Phaser.Scene {
  constructor() { super('EndScene'); }

  create(data: { rested?: boolean; cured?: boolean } = {}): void {
    this.cameras.main.setBackgroundColor('#30283e');
    this.add.ellipse(640, 445, 620, 240, 0xffcf70, 0.12);
    this.add.text(640, 200, data.rested ? 'REST WELL' : 'GREAT JOB!', {
      fontFamily: 'system-ui', fontSize: '72px', color: '#ffdf9b', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.rectangle(640, 494, 650, 8, 0xc5b6e7);
    this.add.image(540, 442, 'player').setScale(1.5);
    this.add.image(650, 442, 'xolo', 0).setScale(1.5);
    if (data.cured) this.add.image(760, 430, 'townsperson').setScale(1.5);
    for (let index = 0; index < 9; index++) {
      this.add.rectangle(320 + index * 80, 85, 50, 40, index % 2 ? 0xffcf70 : 0xd38694);
    }
    const panel = new ChoicePanel(data.rested ? 'Rest complete' : 'Run complete', [
      { id: 'again', label: 'Play again', icon: 'again', select: () => this.scene.start('Level01Scene', { resume: false }) },
      { id: 'menu', label: 'Menu', icon: 'menu', select: () => this.scene.start('MenuScene') },
    ]);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => panel.destroy());
  }
}
