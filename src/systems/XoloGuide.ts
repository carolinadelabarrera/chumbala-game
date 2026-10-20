import { LEVEL01 } from '../level/level01Layout.ts';
import { XoloBehavior, type XoloFrame, type XoloHint } from './XoloBehavior.ts';

interface GuideEvents {
  on(event: string, listener: () => void): unknown;
  off(event: string, listener: () => void): unknown;
  emit(event: string, detail?: string): unknown;
}
export interface GuideFrame extends XoloFrame { playerY: number; zombieX: number }

// Scene events coordinate the guide; HUD, damage and GIVE rules remain independent.
export class XoloGuide {
  readonly behavior: XoloBehavior;
  secretRevealed = false;
  secretResolved = false;
  private giveNeeded = false;
  private cured = false;
  private checkpointReached = false;
  private activeHint?: XoloHint;
  private readonly events: GuideEvents;
  private readonly enabled = () => { this.giveNeeded = true; };
  private readonly gave = () => { this.giveNeeded = false; this.behavior.cancelHint(); };
  private readonly hurt = () => { this.behavior.reactHurt(); };
  private readonly cure = () => { this.cured = true; this.behavior.celebrate(); };
  private readonly rest = () => {
    this.checkpointReached = true;
    this.giveNeeded = false;
    this.secretResolved = true;
    this.behavior.restAt(LEVEL01.ofrenda.xoloX);
    this.syncHintEvents();
  };
  private readonly continued = () => this.behavior.resumeFollowing();
  private readonly ending = () => this.behavior.celebrate();

  constructor(events: GuideEvents, behavior: XoloBehavior) {
    this.events = events;
    this.behavior = behavior;
    events.on('tutorial:giveReady', this.enabled);
    events.on('give:started', this.gave);
    events.on('player:hurt', this.hurt);
    events.on('zombie:cured', this.cure);
    events.on('rest:started', this.rest);
    events.on('rest:continued', this.continued);
    events.on('ending:started', this.ending);
  }

  update(delta: number, frame: GuideFrame): void {
    if (!this.checkpointReached && this.behavior.state === 'SIT_CHECKPOINT'
      && frame.playerX < LEVEL01.ofrenda.guideStart) this.behavior.resumeFollowing();
    this.behavior.update(delta, frame);
    const secret = LEVEL01.secret;
    const investigated = frame.playerX >= secret.shelf.x && frame.playerX <= secret.shelf.x + secret.shelf.width
      && frame.playerY < secret.shelf.y;
    if (this.secretRevealed && (investigated || frame.playerX > secret.ignoreEnd)) {
      this.secretResolved = true;
      if (this.behavior.hint === 'secret') this.behavior.cancelHint();
    }
    if (this.giveNeeded && frame.playerX >= LEVEL01.zombie.encounterLeft && frame.playerX <= LEVEL01.giveTeaching.end) {
      this.behavior.requestHint('give', frame, frame.zombieX);
    } else if (this.cured && !this.secretResolved && frame.playerX >= secret.noticeStart && frame.playerX <= secret.ignoreEnd) {
      if (this.behavior.requestHint('secret', frame, secret.shelf.x)) {
        if (!this.secretRevealed) {
          this.secretRevealed = true;
          this.events.emit('xolo:secretRevealed');
        }
      }
    } else if (this.cured && !this.checkpointReached && frame.playerX >= LEVEL01.ofrenda.guideStart
      && frame.playerX < LEVEL01.ending.start) {
      if (this.behavior.hint === 'secret') this.behavior.cancelHint();
      this.behavior.requestHint('ofrenda', frame, LEVEL01.ofrenda.xoloX);
    }
    this.syncHintEvents();
  }

  reset(frame: XoloFrame): void {
    this.behavior.reset(frame);
    this.syncHintEvents();
  }

  restoreCheckpoint(frame: XoloFrame): void {
    this.cured = this.checkpointReached = this.secretResolved = this.secretRevealed = true;
    this.giveNeeded = false;
    this.reset(frame);
  }

  destroy(): void {
    this.events.off('tutorial:giveReady', this.enabled);
    this.events.off('give:started', this.gave);
    this.events.off('player:hurt', this.hurt);
    this.events.off('zombie:cured', this.cure);
    this.events.off('rest:started', this.rest);
    this.events.off('rest:continued', this.continued);
    this.events.off('ending:started', this.ending);
  }

  private syncHintEvents(): void {
    if (this.activeHint === this.behavior.hint) return;
    if (this.activeHint) this.events.emit('xolo:hintCompleted', this.activeHint);
    this.activeHint = this.behavior.hint;
    if (this.activeHint) this.events.emit('xolo:hintStarted', this.activeHint);
  }
}
