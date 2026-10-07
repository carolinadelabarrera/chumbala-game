# CHÚMBALA! — Level Design Blueprint / Visual Wireframe v0.1

**Artifact type:** Level Design Blueprint + Visual Wireframe  
**Scope:** Vertical Slice v0.1  
**Target duration:** ~4–6 minutes  
**Primary validation device:** iPhone 15 Pro in landscape  
**Other targets:** desktop browser, tablet browser

---

# 1. Goal

This artifact translates the GDD into a concrete first playable level.

The vertical slice must teach and validate the complete core loop:

> **Move → Jump → Collect Candy → Meet Zombie → Lose Heart → Learn GIVE → Offer Pan de Muerto → Cure Zombie → Follow Xolo Hint → Reach Ofrenda**

The child should be able to complete the level without needing to read.

---

# 2. Locked Mechanics Used in This Slice

## Core verbs

- **MOVE**
- **JUMP**
- **GIVE**

## Core objects

- `Candy` → health progress
- `Pan de Muerto` → cures zombies
- `Hearts` → health
- `Xolo` → companion + diegetic hints
- `Ofrenda` → checkpoint + rest

## Important constraints

- Pan de Muerto is **offered**, never fired.
- Character carries a small basket.
- No bread ammunition management.
- No online/social features.
- No reading dependency.
- Failure is low-cost.

---

# 3. Mobile HUD Concept

Landscape layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ ❤️ ❤️ ❤️                           🍬 x 0/5                 │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

Requirements:

- Touch targets must be large.
- `JUMP` and `GIVE` must be visually distinct.
- Controls must allow simultaneous movement + jump.
- Controls must respect iPhone safe areas/notches.
- No precision swipes or gestures.

---

# 4. Macro Flow

```text
[0] Intro / Play
   ↓
[1] Safe Spawn + MOVE
   ↓
[2] First JUMP
   ↓
[3] Candy Path
   ↓
[4] First Zombie / ÑAM
   ↓
[5] Xolo Teaches GIVE / Pan de Muerto
   ↓
[6] First Cure
   ↓
[7] Reward Beat
   ↓
[8] Xolo Secret
   ↓
[9] Ofrenda Checkpoint
   ↓
[10] End Beat
```

---

# 5. Suggested World Layout

This is functional layout, not final art.

```text
START PLAZA
x=0..900
  ↓
FIRST JUMP
x=900..1600
  ↓
CANDY STREET
x=1600..2500
  ↓
SPOOKY EDGE / FIRST ZOMBIE
x=2500..3400
  ↓
PAN TEACH SPACE
x=3400..4100
  ↓
FIRST CURE SPACE
x=4100..5000
  ↓
XOLO SECRET
x=5000..5800
  ↓
OFRENDA
x=5800..6500
  ↓
END BEAT
x=6500..7000
```

Coordinates are initial implementation guidance only and should remain tunable.

---

# 6. Screen-by-Screen Blueprint

## Screen 0 — Title / Fast Entry

```text
         🌙
    papel picado

        CHÚMBALA!

        [ PLAY ]

  🧙‍♀️  🧙‍♂️  💀  💀
             🐕
```

**Goal:** enter play quickly.

For the first functional build, character selection can be postponed and a default character can be used.

---

## Screen 1 — Safe Spawn / Teach MOVE

```text
┌──────────────────────────────────────────────────────────────┐
│ 🌙            🏠                    papel picado            │
│                                                              │
│                                                              │
│   🧙‍♀️   🐕                                                │
│______________________________________________________________│
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

### Teaching objective

`MOVE`

### Behavior

- No enemies.
- Flat floor.
- Xolo stands near player.
- If no input after ~2–3 sec:
  - `▶` softly pulses.
  - Xolo walks a few steps right.
  - Xolo looks back.

### Success

Player moves.

### Failure support

If no input after ~5–6 sec:

- repeat subtle pulse,
- Xolo softly barks,
- optional firefly/chispita moves right.

---

## Screen 2 — First Jump

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                              🍬                              │
│                     _________                                │
│            🐕      |         |                               │
│   🧙‍♀️  _________|         |______________________________  │
│______________________________________________________________│
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

### Teaching objective

`JUMP`

### Design

- One low, wide obstacle/platform.
- Xolo jumps first.
- `JUMP` button pulses when player approaches.
- Candy is placed as visual motivation.

### Failure

- no health loss,
- immediate retry,
- player stays nearby.

### Required feel

- coyote time,
- jump buffer,
- forgiving landing.

---

## Screen 3 — Candy Path

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                 🍬      🍬      🍬                           │
│                                                              │
│         🧙‍♀️   🐕                                           │
│______________________________________________________________│
│ ❤️ ❤️ ❤️                           🍬 x 0/5                 │
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

### Teaching objective

`CANDY = POSITIVE`

### Feedback per candy

- soft positive sound,
- small particle burst,
- HUD increases.

Example:

```text
🍬 x 1/5
🍬 x 2/5
🍬 x 3/5
```

The first candy path must be safe and obvious.

---

## Screen 4 — First Zombie / First ÑAM

```text
┌──────────────────────────────────────────────────────────────┐
│                  🌫️      🪦                                  │
│                                                              │
│                              🧟                              │
│                 🧙‍♀️   🐕                                    │
│______________________________________________________________│
│ ❤️ ❤️ ❤️                           🍬 x 3/5                 │
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

### Teaching objective

`ZOMBIE CONTACT = LOSE HEART`

### Zombie constraints

- one zombie only,
- slow movement,
- wide safe space,
- visible before contact.

### On contact

- sound: `ÑAM!`
- lose one heart,
- small knockback,
- temporary invulnerability,
- Xolo reacts,
- zombie pauses/stumbles briefly.

Example:

```text
❤️ ❤️ ❤️ → ❤️ ❤️ 🖤
```

---

## Screen 5 — Xolo Teaches Pan de Muerto / GIVE

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                🐕 → 🧺                                       │
│                                                              │
│         🧙‍♀️                                                │
│______________________________________________________________│
│ ❤️ ❤️ 🖤                           🍬 x 3/5                 │
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

### Teaching objective

`GIVE`

### Important clarification

The character already carries the Pan de Muerto basket as part of their visual design.

This section **teaches how to use it**; it does not imply the basket was just acquired.

### Behavior

- Xolo moves toward a safe teaching spot.
- Xolo looks at player/basket and then toward zombie.
- `🥖 GIVE` button pulses.
- Optional microcopy/audio: `GIVE!`

No blocking text panel.

---

## Screen 6 — First Cure

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                         🧟                                   │
│                                                              │
│              🧙‍♀️      🐕                                    │
│______________________________________________________________│
│ ❤️ ❤️ 🖤                           🍬 x 3/5                 │
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

### Teaching objective

`GIVE PAN → CURE ZOMBIE`

### Interaction

- player enters forgiving GIVE range,
- presses/taps `GIVE`,
- player performs give animation,
- Pan moves a short friendly distance,
- zombie enters receiving/eating state,
- happy `ÑAM`,
- transformation particles,
- zombie becomes cured townsperson.

Flow:

```text
🧙‍♀️ → 🥖 → 🧟 → 😋 → ✨🌼 → 🙂
```

### Visual grammar

Do not communicate:

```text
aim → shoot → impact
```

Communicate:

```text
offer → receive → eat → restore
```

---

## Screen 7 — Reward Beat

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                         🙂                                    │
│                       ✨💃✨                                  │
│              🧙‍♀️   🐕                                       │
│______________________________________________________________│
│ ❤️ ❤️ 🖤                           🍬 x 3/5                 │
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

### Purpose

Reinforce that curing produces a positive outcome.

### Initial reward

Preferred v0.1:

- 1 candy.

---

## Screen 8 — Xolo Secret

```text
┌──────────────────────────────────────────────────────────────┐
│                                       🍬 🍬                  │
│                             ___                               │
│                    🐕  →   | ? |                              │
│            🧙‍♀️            |___|                              │
│______________________________________________________________│
│ ❤️ ❤️ 🖤                           🍬 x 4/5                 │
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

### Teaching objective

`XOLO CAN REVEAL OPTIONAL SECRETS`

### Behavior

- main path remains available,
- Xolo pauses at a side nook,
- barks softly,
- looks at hidden route,
- player can investigate.

### Reward

- 2 candies.

If player was at `4/5`, the first candy reaches `5/5` and restores a heart:

```text
❤️ ❤️ 🖤 → ❤️ ❤️ ❤️
```

The second candy begins the next progress cycle.

Secret is optional and never blocks progress.

---

## Screen 9 — First Ofrenda / Checkpoint

```text
┌──────────────────────────────────────────────────────────────┐
│                    🌼  🕯️  💀  🕯️  🌼                      │
│                                                              │
│                        OFRENDA                               │
│                                                              │
│                🧙‍♀️       🐕                                 │
│______________________________________________________________│
│ ❤️ ❤️ ❤️                           🍬 x 1/5                 │
│   ◀      ▶                                 JUMP   🥖 GIVE    │
└──────────────────────────────────────────────────────────────┘
```

### Teaching objective

`OFRENDA = SAFE / REST / CHECKPOINT`

### On activation

- music softens,
- warm glow,
- Xolo sits,
- missing hearts restore,
- checkpoint saves,
- natural pause appears.

Prototype option:

`CONTINUE`

Later option:

- `KEEP GOING`
- `STOP HERE`

---

## Screen 10 — Slice End

```text
┌──────────────────────────────────────────────────────────────┐
│                       GREAT JOB!                             │
│                                                              │
│               🧙‍♀️   🐕   🙂                                  │
│                    papel picado                              │
│                                                              │
│                    [ PLAY AGAIN ]                            │
└──────────────────────────────────────────────────────────────┘
```

### Goal

Short, clear sense of completion.

No autoplay.

---

# 7. Teaching Map

| Segment | Primary mechanic | Expected understanding |
|---|---|---|
| Spawn | MOVE | I can move |
| First obstacle | JUMP | I can jump |
| Candy path | CANDY | Candy is good |
| Zombie | DAMAGE | Zombie contact costs health |
| Pan tutorial | GIVE | I can offer Pan de Muerto |
| Cure | CURE | Pan restores zombie |
| Secret | XOLO | Xolo can guide me |
| Ofrenda | CHECKPOINT | This is a safe/rest place |

---

# 8. Failure / Retry Rules

## Failed jump

- respawn/reposition nearby,
- no health loss in early tutorial area.

## Zombie contact

- lose one heart,
- knockback,
- invulnerability frames,
- continue.

## Zero hearts

Before first ofrenda:

- soft cempasúchil transition,
- respawn at most recent tutorial-safe point.

After an ofrenda:

- respawn at the ofrenda.

No major progress loss.

---

# 9. Playtest Observation Checklist

## Mobile ergonomics

Observe:

- can child reach left/right buttons comfortably?
- can child hold movement and tap jump?
- are JUMP and GIVE accidentally confused?
- are controls blocked by iPhone safe areas?
- does the child hold the phone comfortably?

## Comprehension

Observe:

- understands movement without instruction?
- discovers jump?
- tries to collect candy?
- understands the ÑAM/heart relationship?
- notices GIVE cue?
- understands Pan de Muerto cures zombie?
- follows Xolo hint?
- recognizes ofrenda as calm/safe?

## Emotional response

Observe:

- zombie funny or scary?
- cure satisfying?
- Xolo appealing?
- any frustration spikes?
- asks to play again?

---

# 10. Vertical Slice Acceptance Criteria

The slice is ready for first real playtest when:

- player can move on keyboard and touch,
- player can jump reliably,
- first tutorial obstacle is completable,
- candies collect and update HUD,
- 5 candies restore one missing heart,
- zombie contact removes exactly one heart,
- repeated contact during invulnerability does not stack damage,
- Xolo follows player,
- GIVE is taught without a text wall,
- Pan de Muerto interaction cures the zombie,
- cured zombie no longer damages player,
- Xolo secret can be discovered,
- ofrenda restores health and records checkpoint,
- zero-health flow respawns safely,
- slice can be completed on iPhone-sized landscape viewport,
- no reading is required for progress,
- no network/backend is required.

---

# 11. Next Artifact

**CHÚMBALA! — Technical Implementation Spec for Codex/Claude v0.1**
