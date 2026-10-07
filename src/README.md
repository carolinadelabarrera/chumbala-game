# CHÚMBALA! 💀🥖🐕

**A child-friendly spooky platformer inspired by Mexican culture, built for the web with Phaser and TypeScript.**

CHÚMBALA! is a browser-first 2D platformer for young children. Players run, jump, collect candy, avoid silly zombies and **offer Pan de Muerto to cure them**, while a loyal Xolo helps reveal secrets along the way.

The project is currently in **pre-production / vertical-slice development**.

> The goal is not to build a complete game all at once.  
> The goal is to build a small, polished experience, playtest it with the target audience, learn from it, and iterate.

---

## 🎮 Core Gameplay

The current core loop is:

```text
Explore
  ↓
Move / Jump
  ↓
Collect Candy
  ↓
Avoid Zombies
  ↓
Give Pan de Muerto
  ↓
Cure Zombies
  ↓
Follow Xolo's Hints
  ↓
Rest at an Ofrenda
  ↓
Explore Again
```

The three core player actions are:

```text
MOVE + JUMP + GIVE
```

---

## 🍬 Core Systems

### Candy

Candy restores health.

```text
5 candies → 1 heart
```

Candy does **not** cause the zombie curse.

### Pan de Muerto

The player carries a small basket of Pan de Muerto.

Pan de Muerto is used to **cure** zombies.

The interaction is intentionally designed as:

```text
offer → receive → eat → cure
```

—not as projectile combat.

### Zombies

Zombies are silly, slow and child-friendly.

They can hurt the player with a comic:

> **ÑAM!**

But there is no gore, realistic violence or killing.

### Xolo

A Xoloitzcuintle companion follows the player and provides diegetic hints.

Xolo can:

- guide,
- notice secrets,
- react to danger,
- sit at checkpoints,
- celebrate cured zombies.

Xolo cannot take damage or die.

### Ofrendas

Ofrendas are safe spaces that act as:

- checkpoints,
- healing points,
- natural stopping moments.

They are never treated as lootable or destructive game objects.

---

## 🇲🇽 Cultural Direction

CHÚMBALA! combines a playful spooky atmosphere with visual and cultural references from Mexico.

Possible world elements include:

- papel picado,
- cempasúchil,
- decorated calaveras,
- colorful town facades,
- candles,
- plazas,
- Pan de Muerto,
- Xoloitzcuintles,
- ofrendas.

A key design rule is:

> **Día de Muertos is not treated as “Mexican Halloween.”**

The zombies are living townspeople affected by a fictional magical curse. Ancestors and the returning dead are not presented as enemies.

---

## 👧 Child-Centered Design

The game is designed for approximately **ages 4–6**.

Current design principles include:

- no reading required to progress,
- one mechanic introduced at a time,
- immediate audiovisual feedback,
- forgiving platforming,
- gradual difficulty,
- low-cost failure,
- large mobile controls,
- natural stopping points,
- no manipulative retention mechanics.

The first playtest question is intentionally simple:

> **Can a young child understand what to do without an adult explaining every step — and voluntarily want to play again?**

Replay interest is treated as UX feedback, not as a target for addictive engagement.

---

## 🔒 Privacy & Safety by Design

CHÚMBALA! is single-player by design.

The MVP does **not** include:

- accounts,
- public profiles,
- usernames,
- chat,
- comments,
- friend requests,
- online multiplayer,
- user-generated content,
- location,
- advertising,
- behavioral tracking,
- targeted recommendations,
- in-app purchases.

Current MVP direction:

```text
No backend.
No account.
No analytics.
```

Local browser storage may be used only for non-personal game state such as checkpoints or preferences.

---

## 📱 Platform Strategy

CHÚMBALA! is **browser-first** and designed for:

- desktop,
- tablet,
- mobile.

Mobile is a first-class target, not a later port.

Initial mobile design assumptions:

- landscape orientation,
- large touch controls,
- safe-area/notch awareness,
- simultaneous movement + jump,
- simultaneous movement + GIVE.

The vertical slice will be validated on an iPhone-sized viewport and a real mobile device before playtesting.

---

## 🛠 Planned Tech Stack

The current technical direction is:

- **Phaser 3**
- **TypeScript**
- **Vite**
- **HTML5 Canvas**
- **Phaser Arcade Physics**
- **Web Audio / Phaser audio**

Planned development tooling:

- ESLint
- Prettier
- Vitest
- Playwright

The stack may evolve only when there is a concrete technical reason.

---

## 🧱 Architecture Direction

The first implementation is expected to separate:

```text
Scenes
Entities
Systems
UI
State
Level
Config
Tests
```

Key gameplay entities:

```text
Player
Zombie
Xolo
Candy
Ofrenda
```

Key systems:

```text
InputSystem
HealthSystem
CandySystem
GiveSystem
CheckpointSystem
TutorialSystem
```

Game tuning values such as movement speed, jump velocity, coyote time, zombie speed and GIVE range should remain centralized so playtesting changes do not require rewriting gameplay logic.

---

## 🕹 Input Model

Physical input is separated from game actions.

Conceptually:

```text
Keyboard ─┐
          ├──→ MOVE / JUMP / GIVE
Touch ────┘
```

This lets desktop and mobile share the same gameplay logic.

Planned desktop mapping:

```text
← / →       MOVE
SPACE       JUMP
X           GIVE
```

Planned mobile layout:

```text
LEFT SIDE                    RIGHT SIDE

◀    ▶                       JUMP

                              🥖 GIVE
```

---

## 🧪 Vertical Slice v0.1

The first playable slice targets approximately **4–6 minutes**.

Planned flow:

```text
START
 │
 ▼
Learn MOVE
 │
 ▼
Learn JUMP
 │
 ▼
Collect CANDY
 │
 ▼
First ZOMBIE / ÑAM
 │
 ▼
Learn GIVE
 │
 ▼
Offer PAN DE MUERTO
 │
 ▼
Cure ZOMBIE
 │
 ▼
XOLO reveals SECRET
 │
 ▼
Reach OFRENDA
 │
 ▼
END
```

The purpose of the slice is to test the core game hypothesis before building a larger game.

---

## 🗺 Development Roadmap

```text
Phase 0 — Bootstrap
   ↓
Phase 1 — Movement
   ↓
Phase 2 — Health + Candy
   ↓
Phase 3 — Zombie + Damage
   ↓
Phase 4 — GIVE + Cure
   ↓
Phase 5 — Xolo
   ↓
Phase 6 — Ofrenda + Ending
   ↓
Phase 7 — Mobile Polish
   ↓
Phase 8 — Playtest Build
```

### Current status

**Next milestone: Phase 0 + Phase 1**

That means:

- bootstrap Phaser + TypeScript + Vite,
- responsive canvas,
- player movement,
- jump,
- keyboard input,
- mobile touch input,
- coyote time,
- jump buffering,
- first placeholder level geometry.

Candy, zombies, Pan de Muerto, Xolo and checkpoints come later.

---

## 📚 Project Documentation

The design is documented before implementation so coding agents do not need to invent product decisions.

Current documents live in `docs/`:

```text
docs/
├── CHUMBALA_GDD_v0.3.md
├── CHUMBALA_Level_Wireframe_v0.1.md
└── CHUMBALA_Technical_Implementation_Spec_v0.1.md
```

### GDD

The **Game Design Document** defines:

- product vision,
- gameplay rules,
- design pillars,
- child-centered requirements,
- cultural rules,
- privacy constraints,
- locked decisions.

### Level Design Blueprint / Wireframe

Defines the first vertical slice screen by screen.

### Technical Implementation Spec

Translates the game design into:

- architecture,
- state machines,
- systems,
- triggers,
- tuning,
- testing,
- implementation phases,
- Definition of Done.

AI coding agents should also read:

```text
AGENTS.md
```

before making changes.

---

## 🤖 AI-Assisted Development

CHÚMBALA! uses AI coding agents as engineering collaborators.

The project follows a constrained workflow:

```text
Design
  ↓
Document
  ↓
Implement one phase
  ↓
Review
  ↓
Understand
  ↓
Test
  ↓
Playtest
  ↓
Iterate
```

Agents are explicitly instructed **not** to silently redesign locked mechanics or expand scope.

An important project goal is technical learning: implementation work should be explainable, reviewable and understandable by the project owner.

---

## ✅ Definition of Success for the First Slice

The first vertical slice succeeds if a young child can:

1. discover movement,
2. discover jump,
3. understand candy is positive,
4. understand zombie contact removes health,
5. understand that Pan de Muerto can be given,
6. cure the zombie,
7. notice that Xolo helps,
8. recognize the ofrenda as a safe place,
9. finish without needing to read instructions.

---

## 🚫 Out of Scope for Now

Not part of the first vertical slice:

- multiplayer,
- online co-op,
- accounts,
- chat,
- backend services,
- cloud saves,
- boss fights,
- inventory,
- crafting,
- skill trees,
- procedural generation,
- multiple worlds,
- app-store packaging,
- advanced character customization.

The project will grow only after the core experience has been validated.

---

## 📌 Status

**Pre-production → Vertical Slice Development**

Current documentation baseline:

```text
GDD v0.3
Wireframe v0.1
Technical Spec v0.1
```

Next:

```text
Phase 0 + Phase 1 implementation
```

---

## License

License not selected yet.

Until a license is explicitly added, do not assume the repository is open source.
