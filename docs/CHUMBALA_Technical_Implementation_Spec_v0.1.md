# CHÚMBALA! — Technical Implementation Spec for Codex/Claude v0.1

**Artifact type:** Engineering / Implementation Specification  
**Audience:** Codex, Claude Code, human developer  
**Source of truth:** CHÚMBALA! GDD v0.3 + Level Design Blueprint / Visual Wireframe v0.1  
**Scope:** Vertical Slice only  
**Status:** Ready for implementation planning

---

# 0. Agent Execution Contract

Before writing code, follow these rules.

## Do

- Implement only the vertical slice described here.
- Keep gameplay browser-first and mobile-first.
- Treat iPhone-sized landscape play as a first-class requirement.
- Use an input abstraction so touch and keyboard drive the same game actions.
- Keep all tuning values centralized.
- Use placeholder art/audio where final assets do not exist.
- Keep runtime fully functional without backend services.
- Keep code modular enough to extend later.
- Preserve child-safety and privacy constraints.
- Prefer readable, boring, maintainable code over clever abstractions.
- Document non-obvious game-feel logic.

## Do not

- Add multiplayer.
- Add chat, accounts, login, analytics or tracking.
- Add ad SDKs.
- Add procedural generation.
- Add inventory, skill trees or crafting.
- Add a bread launcher/projectile combat system.
- Add extra enemy types.
- Add boss fights.
- Add app-store packaging.
- Add a backend.
- Add features not required by the vertical slice without explicit approval.
- Turn Pan de Muerto into ammunition.

If a product/design decision is ambiguous, keep the implementation simple and expose it as a tuning/config value rather than inventing new product behavior.

---

# 1. Technical Goal

Build a **single ~5-minute playable vertical slice** of CHÚMBALA! that runs directly in modern web browsers and is playable with:

- keyboard on desktop,
- touch controls on mobile/tablet.

The slice must validate:

```text
MOVE
→ JUMP
→ CANDY
→ ZOMBIE DAMAGE
→ GIVE PAN DE MUERTO
→ CURE
→ XOLO SECRET
→ OFRENDA CHECKPOINT
→ END
```

No backend is required.

---

# 2. Recommended Stack

Use:

- **Phaser 3**
- **TypeScript**
- **Vite**
- **HTML5 Canvas**
- Phaser Arcade Physics
- Web Audio / Phaser audio wrapper

Recommended development tools:

- ESLint
- Prettier
- Vitest for pure logic tests
- Playwright for basic browser/mobile smoke tests

Use current stable versions compatible with each other at implementation time.

---

# 3. Repository Structure

Recommended structure:

```text
chumbala/
├── public/
│   └── assets/
│       ├── characters/
│       ├── zombies/
│       ├── xolo/
│       ├── environment/
│       ├── ui/
│       └── audio/
│
├── src/
│   ├── main.ts
│   │
│   ├── config/
│   │   ├── gameConfig.ts
│   │   ├── tuning.ts
│   │   └── assetKeys.ts
│   │
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── MenuScene.ts
│   │   ├── Level01Scene.ts
│   │   └── EndScene.ts
│   │
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Zombie.ts
│   │   ├── Xolo.ts
│   │   ├── Candy.ts
│   │   └── Ofrenda.ts
│   │
│   ├── systems/
│   │   ├── InputSystem.ts
│   │   ├── HealthSystem.ts
│   │   ├── CandySystem.ts
│   │   ├── GiveSystem.ts
│   │   ├── CheckpointSystem.ts
│   │   ├── TutorialSystem.ts
│   │   └── SaveSystem.ts
│   │
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── TouchControls.ts
│   │   ├── HeartDisplay.ts
│   │   ├── CandyDisplay.ts
│   │   └── HintPulse.ts
│   │
│   ├── state/
│   │   ├── PlayerState.ts
│   │   ├── ZombieState.ts
│   │   └── XoloState.ts
│   │
│   ├── level/
│   │   ├── level01Layout.ts
│   │   └── level01Triggers.ts
│   │
│   └── utils/
│       ├── math.ts
│       └── safeArea.ts
│
├── tests/
│   ├── health.test.ts
│   ├── candy.test.ts
│   ├── give.test.ts
│   └── smoke.spec.ts
│
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Do not create empty abstraction layers unless they are used by the slice.

---

# 4. Phaser Configuration

Suggested logical resolution:

```ts
const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 720;
```

Suggested scaling:

```ts
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT
}
```

Physics:

```ts
physics: {
  default: "arcade",
  arcade: {
    gravity: { y: 1200 },
    debug: false
  }
}
```

These values are initial defaults, not permanent product decisions.

---

# 5. Central Tuning Configuration

Create a single `tuning.ts`.

Initial values:

```ts
export const TUNING = {
  player: {
    maxHearts: 3,
    moveSpeed: 240,
    jumpVelocity: -520,
    coyoteTimeMs: 150,
    jumpBufferMs: 150,
    hurtInvulnerabilityMs: 1200,
    knockbackX: 180,
    knockbackY: -180
  },

  candy: {
    piecesPerHeart: 5
  },

  zombie: {
    wanderSpeed: 45,
    chaseSpeed: 70,
    detectionRange: 280,
    giveRange: 120,
    postHitPauseMs: 650,
    eatDurationMs: 800,
    cureDurationMs: 900
  },

  xolo: {
    followDistance: 90,
    followSpeed: 210,
    hintPauseMs: 1200
  },

  give: {
    cooldownMs: 450
  }
} as const;
```

Every number above must remain easy to adjust after playtesting.

---

# 6. Scene Flow

Initial flow:

```text
BootScene
   ↓
MenuScene
   ↓
Level01Scene
   ↓
EndScene
   ├── PLAY AGAIN → Level01Scene
   └── MENU → MenuScene
```

Character selection is optional for the first functional build.

If character select is implemented later:

```text
MenuScene
   ↓
CharacterSelectScene
   ↓
Level01Scene
```

---

# 7. Input Architecture

Do not read raw keyboard/touch input directly inside Player movement logic.

Create an abstraction.

## 7.1 Game Actions

```ts
export interface InputSnapshot {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  givePressed: boolean;
}
```

Or use an enum/action map:

```text
MOVE_LEFT
MOVE_RIGHT
JUMP
GIVE
```

## 7.2 Input Sources

`InputSystem` should merge:

- keyboard,
- touch controls.

Future gamepad support is out of scope.

## 7.3 Keyboard

Initial mapping:

```text
ArrowLeft / A  → LEFT
ArrowRight / D → RIGHT
Space          → JUMP
X              → GIVE
```

## 7.4 Touch

Landscape layout:

```text
LEFT SIDE                    RIGHT SIDE

◀    ▶                       JUMP

                              🥖 GIVE
```

Requirements:

- multi-touch must work,
- child must be able to hold RIGHT while tapping JUMP,
- JUMP and GIVE must not overlap,
- pointer-up must reliably release movement,
- controls respect safe areas.

Phaser may require adding extra input pointers for simultaneous touches.

---

# 8. Safe Area / Mobile Layout

Create a safe-area utility that accounts for CSS environment variables where available:

```css
env(safe-area-inset-left)
env(safe-area-inset-right)
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

The HUD and touch controls must remain inside safe areas.

Test at minimum with:

- 16:9 desktop,
- iPhone-like wide landscape viewport,
- narrower Android-like landscape viewport.

The game should show a rotate-to-landscape overlay if portrait is not supported.

Portrait gameplay is out of scope for v0.1.

---

# 9. Player Entity

## 9.1 Core Properties

```ts
type PlayerData = {
  hearts: number;          // 0..3
  candyProgress: number;   // 0..4
  invulnerable: boolean;
  giveEnabled: boolean;
  checkpointId: string;
};
```

The player always visually carries the Pan de Muerto basket.

`giveEnabled` is initially false for tutorial purposes and becomes true during the GIVE teaching segment.

## 9.2 Player States

```text
IDLE
RUN
JUMP
FALL
HURT
GIVE
RESPAWN
```

A full hierarchical FSM is not required if simple state guards are sufficient.

## 9.3 Movement

Expected behavior:

- responsive horizontal movement,
- forgiving acceleration/deceleration,
- no slippery physics.

Simplest acceptable v0.1 implementation:

- direct target velocity,
- optionally small smoothing.

## 9.4 Jump

Implement:

- coyote time,
- jump buffer.

Pseudo-logic:

```ts
if (player.isGrounded()) {
  lastGroundedAt = now;
}

if (input.jumpPressed) {
  jumpBufferedAt = now;
}

const withinCoyote =
  now - lastGroundedAt <= TUNING.player.coyoteTimeMs;

const jumpBuffered =
  now - jumpBufferedAt <= TUNING.player.jumpBufferMs;

if (withinCoyote && jumpBuffered && canJump) {
  player.setVelocityY(TUNING.player.jumpVelocity);
  consumeJumpBuffer();
}
```

Optional variable jump height is not required for v0.1.

---

# 10. Health System

## 10.1 Rules

- max hearts = 3,
- zombie contact removes exactly 1 heart,
- ignore damage while invulnerable,
- start invulnerability after hit,
- health cannot go below 0.

Pseudo-interface:

```ts
interface HealthSystem {
  damage(amount: number): void;
  heal(amount: number): void;
  reset(): void;
  getHearts(): number;
}
```

## 10.2 Hurt Flow

On zombie contact:

1. if invulnerable, ignore,
2. decrement heart,
3. emit `player:hurt`,
4. play ÑAM,
5. knock player back,
6. start invulnerability,
7. Xolo reacts,
8. if hearts == 0, start soft fail flow.

## 10.3 Zero-Health Flow

Before first ofrenda:

- respawn at latest tutorial-safe point.

After ofrenda:

- respawn at active checkpoint.

Transition:

- cempasúchil overlay/fade,
- no “YOU DIED.”

---

# 11. Candy System

## 11.1 Rule

```text
5 candies → restore 1 missing heart
```

Candy has no other gameplay meaning.

## 11.2 Logic

Pseudo-code:

```ts
onCandyCollected() {
  candyProgress += 1;

  if (candyProgress >= piecesPerHeart) {
    if (hearts < maxHearts) {
      hearts += 1;
      candyProgress = 0;
    } else {
      candyProgress = piecesPerHeart - 1;
    }
  }

  updateHUD();
}
```

Alternative handling while full-health is allowed if it remains simple and visible.

For the first playtest, prefer predictable behavior over sophisticated banking.

## 11.3 Acceptance

- candy disappears once collected,
- plays positive sound,
- updates HUD,
- cannot be collected twice,
- correctly heals after threshold.

---

# 12. Zombie Entity

Only one zombie is required.

## 12.1 States

```text
WANDER
NOTICE_PLAYER
CHASE
POST_HIT_PAUSE
RECEIVING_PAN
EATING
CURING
CURED
CELEBRATE
```

## 12.2 Behavior

### WANDER

- slow patrol between two points.

### NOTICE_PLAYER

- optional brief reaction,
- face player.

### CHASE

- move slowly toward player,
- never faster than player.

### Player Contact

- invoke HealthSystem damage,
- then zombie pauses/stumbles briefly.

### RECEIVING_PAN

- stop movement,
- disable damage collider behavior,
- face player/bread.

### EATING

- play happy ÑAM,
- non-threatening.

### CURING

- transformation effect.

### CURED

- permanently remove hazard behavior.

### CELEBRATE

- happy idle/dance.

---

# 13. GIVE / Pan de Muerto System

This is the most important new mechanic.

## 13.1 Product Intent

The interaction must visually read as:

```text
offer → receive → eat → cure
```

Never as:

```text
aim → fire → hit → defeat
```

## 13.2 Interaction Rule

When:

- `giveEnabled == true`,
- player presses GIVE,
- a curable zombie is within `giveRange`,
- GiveSystem is not in cooldown,

then cure sequence starts.

## 13.3 Targeting

For vertical slice:

- one zombie only,
- choose nearest eligible zombie within range,
- optionally require zombie to be generally in front of player.

Do not implement free aiming.

## 13.4 Bread Visual

Recommended sequence:

1. Player enters GIVE animation.
2. Player extends Pan de Muerto from basket.
3. Bread moves/lerps a short distance toward zombie's hands.
4. Zombie catches/receives it.
5. Bread sprite disappears into eating animation.
6. Happy ÑAM.
7. Cure transformation.

The bread should not travel fast.

No impact VFX.

No recoil.

No crosshair.

## 13.5 Pseudo-code

```ts
function tryGive(player: Player, zombies: Zombie[]) {
  if (!player.giveEnabled) return;
  if (giveCooldownActive()) return;
  if (!player.canAct()) return;

  const target = findNearestCurableZombieInRange(
    player,
    zombies,
    TUNING.zombie.giveRange
  );

  if (!target) {
    playSoftNoTargetFeedback();
    return;
  }

  startGiveSequence(player, target);
}
```

## 13.6 Cure Sequence

```ts
async function startGiveSequence(player, zombie) {
  lockGiveTemporarily();

  player.enterGiveState();
  zombie.enterReceivingPanState();

  await animateBreadTransfer(player, zombie);

  zombie.enterEatingState();
  playHappyNyam();

  await wait(TUNING.zombie.eatDurationMs);

  zombie.enterCuringState();
  await playCureVFX();

  zombie.enterCuredState();

  emit("zombie:cured", { zombieId: zombie.id });

  unlockGiveAfterCooldown();
}
```

Implementation may use Phaser timed events/tweens rather than actual async functions.

---

# 14. Xolo Entity

## 14.1 States

```text
FOLLOW
WAIT
HINT
REACT_HURT
SIT_CHECKPOINT
CELEBRATE
```

## 14.2 FOLLOW

- stay behind/near player,
- no complex navmesh required,
- teleport/reposition safely if too far.

## 14.3 HINT

Used twice:

1. first GIVE tutorial,
2. optional secret.

Hint behavior should be subtle:

- move to hint point,
- stop,
- look,
- bark once,
- wait,
- repeat gently if ignored.

Do not spam audio.

## 14.4 Xolo Never

- takes damage,
- blocks player,
- pushes player,
- collides as a hard physics obstacle.

Use non-blocking overlap or disable body collision with player.

---

# 15. Tutorial System

Tutorial must be event/trigger based.

Suggested tutorial IDs:

```ts
enum TutorialId {
  Move = "move",
  Jump = "jump",
  Candy = "candy",
  ZombieDamage = "zombieDamage",
  Give = "give",
  XoloSecret = "xoloSecret",
  Ofrenda = "ofrenda"
}
```

Tutorials should mainly:

- pulse relevant control,
- move Xolo,
- play icon/animation cue,
- optionally play one-word audio.

No blocking modal dialogs.

A tutorial should stop prompting once the player demonstrates the action.

---

# 16. Level01 World Segments

Suggested x ranges:

```ts
export const LEVEL01_SEGMENTS = {
  startPlaza:   { start: 0,    end: 900  },
  firstJump:    { start: 900,  end: 1600 },
  candyStreet:  { start: 1600, end: 2500 },
  zombieIntro:  { start: 2500, end: 3400 },
  giveTutorial: { start: 3400, end: 4100 },
  firstCure:    { start: 4100, end: 5000 },
  xoloSecret:   { start: 5000, end: 5800 },
  ofrenda:      { start: 5800, end: 6500 },
  endBeat:      { start: 6500, end: 7000 }
};
```

These are tuning guidance, not immutable coordinates.

---

# 17. Trigger Sequence

## Trigger A — MOVE

Condition:

- level starts,
- no movement after short delay.

Action:

- pulse right button,
- Xolo steps right.

Complete when:

- horizontal displacement > threshold.

## Trigger B — JUMP

Condition:

- player approaches first obstacle.

Action:

- pulse JUMP,
- Xolo demonstrates.

Complete when:

- player successfully lands beyond obstacle.

## Trigger C — CANDY

Condition:

- first candy collected.

Action:

- HUD animates.

Complete when:

- candy collection registered.

## Trigger D — FIRST DAMAGE

Condition:

- zombie overlaps player.

Action:

- ÑAM,
- remove heart,
- hurt feedback.

Complete when:

- first damage event emitted.

## Trigger E — GIVE TEACH

Condition:

- first damage happened,
- player enters giveTutorial region.

Action:

- enable GIVE,
- Xolo hint behavior,
- pulse GIVE.

Complete when:

- first valid GIVE starts.

## Trigger F — CURE

Condition:

- cure sequence completes.

Action:

- cured townsperson celebrates,
- reveal one candy.

## Trigger G — XOLO SECRET

Condition:

- player enters secret region.

Action:

- Xolo hints side nook.

Complete when:

- player enters secret zone or ignores and passes beyond it.

## Trigger H — OFRENDA

Condition:

- overlap ofrenda area.

Action:

- set checkpoint,
- heal,
- Xolo sits,
- calm audio,
- show CONTINUE.

## Trigger I — END

Condition:

- player exits ofrenda segment / enters endBeat.

Action:

- short completion scene,
- transition to EndScene.

---

# 18. Checkpoint System

## 18.1 Checkpoint Data

```ts
type CheckpointData = {
  id: string;
  x: number;
  y: number;
  heartsOnRespawn: number;
};
```

## 18.2 Tutorial Safe Points

Before first ofrenda, use invisible safe respawn anchors.

Examples:

- `start`,
- `postJump`,
- `preZombie`.

These are not visible “checkpoints” to the child.

## 18.3 Ofrenda

Ofrenda becomes the active checkpoint once reached.

On activation:

- save position,
- restore hearts,
- emit `checkpoint:activated`,
- optionally persist to localStorage.

---

# 19. Save System

No backend.

Use localStorage only if persistence across refresh is desired.

Suggested key:

```text
chumbala_vertical_slice_v01
```

Suggested data:

```ts
type SaveData = {
  version: 1;
  checkpointId: string;
  selectedCharacter?: string;
  muted?: boolean;
};
```

Do not save personal data.

Do not generate user IDs.

No analytics events leave the device.

---

# 20. HUD

Top-left:

```text
❤️ ❤️ ❤️
```

Top-right:

```text
🍬 x 3/5
```

Mobile touch controls:

- bottom left: LEFT / RIGHT,
- bottom right: JUMP / GIVE.

HUD must scale without becoming tiny.

No dense text.

---

# 21. Audio Requirements

Use placeholders if needed.

Required audio events:

- footsteps,
- jump,
- land,
- candy pickup,
- zombie ambient,
- zombie attack `ÑAM`,
- happy eating `ÑAM`,
- player hurt,
- GIVE cue,
- cure sparkle,
- Xolo bark,
- checkpoint calm cue,
- completion cue.

Do not use copyrighted music/recordings from “Chúmbala Cachúmbala” in the implementation.

Original/placeholder audio only.

---

# 22. Visual Placeholder Requirements

The first functional build may use:

- colored rectangles,
- simple sprites,
- icons,
- placeholder particles.

But interaction states must remain visually distinguishable.

Minimum:

- player idle/run/jump/hurt/give placeholder states,
- zombie normal/cured distinction,
- Xolo visible,
- candy visible,
- Pan de Muerto visible during GIVE sequence,
- ofrenda clearly visible,
- touch controls visible.

Do not block engineering progress waiting for final art.

---

# 23. Collision Matrix

| A | B | Behavior |
|---|---|---|
| Player | Ground | solid collision |
| Player | Platform | solid collision |
| Player | Candy | overlap → collect |
| Player | Zombie | overlap → damage if eligible |
| Player | Ofrenda | overlap → checkpoint |
| Player | Xolo | no blocking collision |
| Zombie | Ground | solid collision |
| Zombie | Platform | solid collision if needed |
| Zombie | Bread visual | scripted receive; no damage collider |
| Xolo | World | simplified / non-blocking as practical |

Bread does not require a damaging physics projectile collider.

---

# 24. Event Model

Recommended event names:

```text
player:moved
player:jumped
player:hurt
player:zeroHealth

candy:collected
health:changed

give:enabled
give:started
give:completed

zombie:noticedPlayer
zombie:cured

xolo:hintStarted
xolo:hintCompleted

checkpoint:activated
level:completed
```

Use either Phaser EventEmitter or a small local event bus.

Avoid global mutable state when possible.

---

# 25. Camera

Camera behavior:

- side-scroll follow player,
- slight deadzone preferred,
- no aggressive camera snapping,
- no screen shake on damage in v0.1,
- maintain good forward visibility.

On mobile, do not let HUD move with world camera.

Camera bounds should cover world only.

---

# 26. Accessibility / Comfort

Minimum v0.1:

- no flashing rapid strobe effects,
- moderate particle count,
- readable icon contrast,
- no critical information only by color,
- mute button is recommended,
- large touch targets.

Future options such as reduced motion can be added later.

---

# 27. Performance

Target:

- smooth play on modern mobile Safari/Chrome,
- aim for 60 FPS where possible,
- avoid large uncompressed textures,
- avoid excessive dynamic lights,
- keep particle counts small,
- atlas sprites if asset count grows.

Do not introduce WebGL-heavy effects for the vertical slice unless necessary.

---

# 28. Testing Strategy

## 28.1 Unit Tests

### Health

Test:

- max hearts never > 3,
- damage decrements once,
- invulnerability prevents repeated damage,
- heal works,
- zero health emits correct state.

### Candy

Test:

- candy increments,
- 5 candies restore 1 missing heart,
- candy cannot double-collect.

### GIVE

Test:

- cannot GIVE before enabled,
- cannot GIVE out of range,
- can GIVE in range,
- zombie cannot be cured twice,
- cured zombie cannot damage player.

## 28.2 Browser Smoke Tests

Use Playwright or equivalent for:

- app loads,
- Menu → Level01,
- resize to mobile landscape viewport,
- touch UI visible,
- no console errors,
- EndScene reachable through a test helper.

## 28.3 Manual Real-Device Test

Required before calling v0.1 ready:

- open in mobile Safari on target iPhone,
- play landscape,
- test simultaneous movement + jump,
- test simultaneous movement + GIVE,
- verify buttons do not conflict with safe areas,
- verify audio starts correctly after user gesture,
- verify page does not scroll while playing.

---

# 29. Logging

Development logging may exist in dev mode.

Do not send telemetry anywhere.

Example:

```ts
if (import.meta.env.DEV) {
  console.debug("[Tutorial]", tutorialId, "completed");
}
```

Production build should avoid noisy logs.

---

# 30. Implementation Phases

## Phase 0 — Bootstrap

Deliver:

- Vite + Phaser + TypeScript project,
- BootScene,
- MenuScene,
- Level01Scene,
- base scaling,
- placeholder assets.

Acceptance:

- app launches,
- playable canvas fits desktop/mobile landscape.

## Phase 1 — Movement

Deliver:

- Player,
- InputSystem,
- touch controls,
- keyboard,
- camera,
- first platforming area,
- coyote time,
- jump buffer.

Acceptance:

- player can MOVE/JUMP on desktop and touch.

## Phase 2 — Health + Candy

Deliver:

- hearts HUD,
- Candy entity/system,
- 5-candy heal rule,
- safe collectibles.

Acceptance:

- candy collection/heal logic works.

## Phase 3 — Zombie + Damage

Deliver:

- one zombie,
- wander/chase,
- player damage,
- ÑAM,
- invulnerability,
- knockback,
- zero-health soft respawn.

Acceptance:

- zombie contact behaves exactly once per invulnerability window.

## Phase 4 — GIVE / Cure

Deliver:

- Pan basket visual,
- giveEnabled tutorial state,
- GIVE input,
- range check,
- give animation,
- scripted bread transfer,
- zombie receive/eat/cure states,
- cured townsperson state.

Acceptance:

- no projectile-combat feel,
- zombie cures reliably.

## Phase 5 — Xolo

Deliver:

- FOLLOW,
- GIVE tutorial hint,
- secret hint,
- hurt reaction,
- checkpoint sit,
- cure celebration.

Acceptance:

- Xolo assists without blocking player.

## Phase 6 — Ofrenda + End

Deliver:

- checkpoint,
- heal,
- respawn,
- calm checkpoint beat,
- EndScene,
- Play Again.

Acceptance:

- full vertical slice completes end-to-end.

## Phase 7 — Mobile Polish

Deliver:

- safe-area handling,
- touch target tuning,
- landscape prompt,
- iPhone real-device testing fixes,
- audio unlock behavior.

Acceptance:

- full slice playable comfortably on iPhone-sized device.

## Phase 8 — Playtest Build

Deliver:

- no debug overlays,
- stable hosted browser build,
- simple playtest checklist,
- version tag `vertical-slice-v0.1`.

---

# 31. Definition of Done — Vertical Slice v0.1

The vertical slice is DONE only when all are true:

- [ ] project runs with one command locally,
- [ ] production build succeeds,
- [ ] desktop keyboard controls work,
- [ ] mobile touch controls work,
- [ ] simultaneous movement + jump works,
- [ ] simultaneous movement + GIVE works,
- [ ] MOVE tutorial is non-blocking,
- [ ] JUMP tutorial is non-blocking,
- [ ] candy is collectible,
- [ ] 5 candies restore a missing heart,
- [ ] zombie damages player once per invulnerability window,
- [ ] zero-health flow is soft/non-scary,
- [ ] GIVE is enabled through tutorial trigger,
- [ ] Pan de Muerto is visually offered, not fired,
- [ ] zombie receives/eats/cures,
- [ ] cured zombie cannot hurt player,
- [ ] Xolo follows player,
- [ ] Xolo can hint at GIVE,
- [ ] Xolo can hint at secret,
- [ ] ofrenda restores health,
- [ ] ofrenda becomes checkpoint,
- [ ] respawn uses latest checkpoint/safe point,
- [ ] EndScene is reachable,
- [ ] no reading is required to finish,
- [ ] no backend is required,
- [ ] no analytics/tracking exists,
- [ ] mobile landscape layout respects safe areas,
- [ ] build has been manually tested on an iPhone-sized viewport,
- [ ] real-device mobile test is completed before playtest release.

---

# 32. Acceptance Criteria by User Experience

The build should allow a child to:

1. enter play with minimal friction,
2. discover movement,
3. discover jump,
4. want to pick up candy,
5. understand that zombie contact removes a heart,
6. understand that Pan de Muerto can be GIVEN,
7. see the zombie become safe/happy,
8. notice that Xolo provides hints,
9. reach a calm ofrenda,
10. finish without reading instructions.

---

# 33. Suggested First Codex / Claude Implementation Prompt

Use the following as the first execution prompt after attaching this spec and the GDD:

> Implement Phase 0 and Phase 1 of the CHÚMBALA! vertical slice according to the attached GDD v0.3, Level Design Blueprint v0.1, and Technical Implementation Spec v0.1.
>
> Scope only:
> - bootstrap a Phaser 3 + TypeScript + Vite project,
> - create BootScene, MenuScene and Level01Scene,
> - configure responsive 1280x720 logical canvas with FIT scaling,
> - implement InputSystem with keyboard + multitouch abstraction,
> - implement Player MOVE and JUMP,
> - implement coyote time and jump buffering using centralized tuning constants,
> - implement simple Level01 placeholder geometry for the safe spawn and first jump section,
> - implement mobile landscape touch controls with LEFT, RIGHT and JUMP,
> - add a non-blocking landscape-orientation message for portrait mobile.
>
> Do not implement candy, zombies, GIVE, Xolo, checkpoints or final art yet.
>
> Use simple placeholder graphics. Keep the code modular and readable. At the end, explain:
> 1. the architecture you created,
> 2. how input abstraction works,
> 3. how coyote time works,
> 4. how jump buffering works,
> 5. what remains for Phase 2.
>
> Do not expand scope beyond this phase.

---

# 34. Engineering Notes for Future Agents

When continuing implementation:

- Always read the latest GDD version first.
- Treat “Locked Decisions” as constraints.
- Check whether a newer Level Blueprint or Technical Spec exists.
- Do not silently redesign mechanics.
- If a playtest changes a rule, update documentation before or alongside code.
- Prefer small implementation phases over generating the whole game at once.

---

# 35. Versioning

Recommended documentation/code tags:

```text
GDD v0.3
Wireframe v0.1
Tech Spec v0.1
Vertical Slice Build v0.1
```

Future changes should increment the artifact that changed rather than overwriting history silently.
