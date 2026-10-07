# CHÚMBALA! — Game Design Document (GDD) v0.3

**GDD = Game Design Document**  
En español: **Documento de Diseño del Videojuego**.

Este documento es la fuente principal de decisiones de diseño de CHÚMBALA!. Está preparado para compartirse como contexto con Claude, Codex u otros agentes de desarrollo sin depender de conversaciones anteriores.

---

## 0. Document Status

- **Project:** CHÚMBALA!
- **Version:** 0.3
- **Phase:** Pre-production
- **Genre:** 2D side-scrolling platformer / child-friendly spooky adventure
- **Target audience:** niñas y niños de aproximadamente 4–6 años
- **Primary delivery:** web browser
- **Target devices:** desktop, tablet y mobile
- **Initial real-world mobile playtest device:** iPhone 15 Pro
- **Preferred orientation:** landscape
- **Game mode:** single-player
- **Connectivity model:** no online social interaction
- **Visual direction:** spooky season + cultura visual mexicana
- **Primary in-game language:** inglés sencillo apoyado por iconografía, animación y audio
- **Cultural vocabulary kept in Spanish:** Xolo, calaca, ofrenda, cempasúchil, papel picado, Pan de Muerto
- **Current working title:** CHÚMBALA!

---

# 1. High Concept

**CHÚMBALA!** is a child-friendly spooky 2D platformer inspired by Mexican visual culture.

The player explores a magical Mexican town at night, runs, jumps, collects candy, avoids silly zombies and **offers Pan de Muerto to cure them**, accompanied by a loyal Xolo.

The game is designed to be understandable even for a child who cannot yet read.

---

# 2. Product Vision

CHÚMBALA! should feel like a **real videogame made for young children**, not like an educational worksheet disguised as a game.

The intended experience is:

> “I can do this” → “What is over there?” → “Zombie!” → “Run!” → “Jump!” → “Give!” → “I cured it!” → “I want to keep exploring.”

Core qualities:

- Simple controls.
- Real platforming.
- Immediate feedback.
- Low-frustration failure.
- Gradual difficulty.
- Short playable sections.
- Natural stopping points.
- Strong Mexican visual identity.
- Spooky without becoming disturbing.
- No dependency on reading.
- No manipulative retention mechanics.
- Privacy by design.

Primary success question:

> **Can a 4–5 year old understand what to do without an adult explaining every action, complete the experience, and voluntarily want to play again?**

---

# 3. Design Pillars

## 3.1 Easy to Understand

Important actions must be communicated through:

- animation,
- sound,
- color,
- movement,
- iconography,
- environmental cues.

Reading is optional support, not a requirement.

## 3.2 Real Platforming

The game contains genuine videogame verbs:

- move,
- run,
- jump,
- avoid,
- explore,
- collect,
- give,
- discover secrets.

The game must not be simplified to the point of becoming passive.

## 3.3 Spooky, Never Disturbing

Allowed:

- zombies,
- skeletons,
- graveyards,
- moonlight,
- fog,
- candles,
- ghosts,
- funny spooky sounds.

Not allowed:

- blood,
- gore,
- exposed organs,
- explicit bites,
- dismemberments,
- realistic suffering,
- disturbing horror imagery.

## 3.4 Non-Violent Resolution

The player does not kill zombies.

The player **offers Pan de Muerto**, which breaks the curse and restores the zombie to normal.

The action is framed as **giving/caring**, not shooting/attacking.

## 3.5 Mexican Identity

Mexican culture is part of the world and systems, not merely decoration.

Visual and environmental references may include:

- papel picado,
- cempasúchil,
- ofrendas,
- decorated calaveras,
- colorful facades,
- plazas,
- candles,
- festive nighttime lighting,
- Pan de Muerto,
- Xoloitzcuintle companion.

## 3.6 Child-Centered

The game prioritizes:

- gradual onboarding,
- forgiving controls,
- immediate feedback,
- short challenges,
- safe repetition,
- natural pauses,
- zero reading dependency.

## 3.7 Privacy by Design

No:

- chat,
- multiplayer online,
- public profiles,
- usernames,
- friend systems,
- photos,
- location,
- user-generated content,
- messaging,
- public leaderboards.

## 3.8 Parent-Friendly

A parent can sit beside the child, observe, comment or help physically.

The game never requires communication with another person online.

---

# 4. Lore: Candy Is NOT the Cause of the Zombie Curse

Candy is mechanically positive because it restores health. Therefore, the same candy should not also be presented as the source of the zombie transformation.

**Locked decision:** normal candy does not cause the zombie transformation.

Working lore:

> During a nighttime celebration, an old magical chant or accidental spell awakens a strange moonlit curse across the town. Some townspeople become silly, candy-hungry zombies. The player must restore them by offering Pan de Muerto.

The exact narrative origin of the curse remains open for a later story pass.

Possible future directions:

- a spell accidentally activated during the festival,
- a magical moon event,
- an enchanted bell,
- a mysterious nighttime chant,
- an accidental magical ritual.

Candy remains visually and mechanically positive.

---

# 5. Cultural Design Principles

## 5.1 Día de Muertos Is Not Treated as “Mexican Halloween”

Halloween/spooky-season elements and Día de Muertos-inspired visuals may coexist in the fictional world, but they are not treated as identical traditions.

## 5.2 The Dead Are Not the Villains

The zombies are **living townspeople under a magical curse**.

They are not ancestors returning from the dead.

## 5.3 Ofrendas Are Safe Spaces

Ofrendas are never:

- destroyed,
- looted,
- mocked,
- used as enemy spawning points.

Instead, they serve an important positive gameplay function.

## 5.4 Pan de Muerto Is Offered, Not Weaponized

The game does not use a “bread launcher.”

The player carries a **small basket of Pan de Muerto** and offers a piece when close enough to a zombie.

The visual grammar must communicate:

> **give → receive → eat → cure**

not:

> aim → fire → hit → defeat.

Pan de Muerto used for curing does not come from an ofrenda.

---

# 6. Ofrendas as Checkpoints — LOCKED

When the player reaches an ofrenda:

1. Xolo sits down.
2. Ambient music becomes calmer.
3. Hearts are restored.
4. Progress is saved locally.
5. The player gets a natural pause.
6. The game asks whether to continue.

Example:

**Rest?**

- `KEEP GOING`
- `STOP HERE`

No automatic transition forces another level.

Gameplay role:

> PLAY → CHALLENGE → OFRENDA → REST → CONTINUE / STOP

---

# 7. Player Characters

Character selection at the beginning:

- **Witch**
- **Wizard**
- **Calaca Girl**
- **Calaca Boy**

All characters have identical speed, jump physics, health and GIVE behavior.

Character choice is cosmetic.

No public character is based visually on the creator's daughter or contains identifying information about her.

---

# 8. Xolo Companion — LOCKED

The player's permanent companion is a **Xoloitzcuintle**.

Xolo:

- follows the player,
- reacts to danger,
- waits when needed,
- notices secrets,
- gives environmental hints,
- sits at checkpoints,
- celebrates cured zombies.

Xolo does not attack, take damage, die or become a resource-management burden.

## 8.1 Xolo State Machine

```text
FOLLOW
  ↓
WAIT
  ↓
NOTICE_SECRET
  ↓
HINT
  ↓
FOLLOW

CHECKPOINT → SIT
PLAYER_HURT → REACT
ZOMBIE_CURED → CELEBRATE
```

---

# 9. Core Player Verbs

Three fundamental actions:

## MOVE
Walk/run left and right.

## JUMP
Jump over gaps, obstacles, platforms and slow enemies.

## GIVE
Offer a piece of Pan de Muerto to a nearby zombie.

Design goal:

> **Three actions, many combinations.**

---

# 10. Core Gameplay Loop

> **Explore → Move/Jump → Collect Candy → Avoid Zombies → GIVE Pan de Muerto → Cure Zombies → Discover Secrets with Xolo → Rest at Ofrenda → Explore**

---

# 11. Health System

Health is represented by three large hearts:

```text
❤️ ❤️ ❤️
```

Zombie contact:

```text
❤️ ❤️ 🖤
```

The zombie reaction is comic rather than violent:

> **ÑAM!**

After damage, the player receives temporary invulnerability frames so repeated collision does not remove all health instantly.

Initial target invulnerability window:

- approximately 1–1.5 seconds,
- subject to playtesting.

---

# 12. Candy System — LOCKED

Candy has one primary meaning:

> **Candy = Health**

Initial rule:

- collect 5 candies,
- restore 1 missing heart.

```text
🍬 🍬 🍬 🍬 🍬
        ↓
       ❤️
```

Candy does not cure zombies and does not cause the zombie curse.

---

# 13. Pan de Muerto / GIVE System — LOCKED

The character carries a **small basket of Pan de Muerto**.

Pan de Muerto has one primary meaning:

> **Pan de Muerto = Cure**

Interaction:

```text
PLAYER → GIVE → PAN → ZOMBIE EATS → CURE
```

Design rules:

- The player does not “shoot” bread.
- The bread is visually offered.
- The zombie must be within a forgiving interaction range.
- The zombie becomes temporarily non-threatening while receiving/eating.
- The Pan de Muerto supply is not treated as traditional ammunition in the vertical slice.
- The player cannot become permanently stuck because they “ran out.”

Possible visual behavior:

- player extends bread,
- bread moves a short friendly arc / float,
- zombie receives it,
- happy “ñam,”
- cempasúchil/glow particles,
- zombie transforms into a normal townsperson.

---

# 14. Zombie System

Zombies are intentionally silly.

Possible behaviors:

- walk crooked,
- wobble,
- follow slowly,
- become distracted,
- trip,
- say “ñam,”
- look confused,
- dance after being cured.

## 14.1 Zombie State Machine

```text
WANDER
  ↓
NOTICE_PLAYER
  ↓
CHASE
  ↓
RECEIVING_PAN
  ↓
EATING
  ↓
CURED
  ↓
CELEBRATE
```

---

# 15. Failure Model

Failure exists mechanically but is emotionally inexpensive.

At zero hearts:

1. Xolo runs to the player.
2. A soft cempasúchil transition covers the screen.
3. Player respawns at the latest safe checkpoint.
4. Hearts return.
5. Important progress is preserved.

No scary “YOU DIED” screen, limited continues or severe punishment.

---

# 16. Platforming Feel

Initial forgiving-control targets:

- **Coyote time:** ~150 ms.
- **Jump buffer:** ~150 ms.
- Large landing areas.
- Low fall punishment.
- No slippery controls.

Goal:

> The child feels “I made the jump” more often than “the controls ignored me.”

---

# 17. Child-Centered Design Requirements

- No reading dependency.
- One mechanic at a time.
- Immediate audiovisual feedback.
- Gradual difficulty.
- Natural pauses.
- No manipulative retention mechanics.
- No autoplay into endless levels.
- No streaks, gacha, FOMO or daily rewards.

Teaching sequence:

1. move,
2. jump,
3. candy,
4. zombie contact,
5. GIVE / Pan de Muerto,
6. Xolo hints,
7. checkpoints.

---

# 18. English Learning Layer

CHÚMBALA! is not an English-learning app.

English exposure is incidental.

Examples:

- **Jump!**
- **Run!**
- **Candy!**
- **Watch out!**
- **Follow Xolo!**
- **Give!**
- **Great job!**

Cultural terms remain in Spanish:

- Xolo
- calaca
- ofrenda
- cempasúchil
- papel picado
- Pan de Muerto

---

# 19. Progressive Teaching Model

```text
MOVE
  ↓
JUMP
  ↓
CANDY → HEALTH
  ↓
ZOMBIE CONTACT → LOSE HEART
  ↓
GIVE PAN DE MUERTO → CURE
  ↓
XOLO HINTS
  ↓
COMBINE KNOWN SYSTEMS
```

---

# 20. Vertical Slice

Target duration:

- approximately 5 minutes.

Flow:

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
Find CANDY
 │
 ▼
Encounter first ZOMBIE
 │
 ▼
Lose HEART / understand danger
 │
 ▼
XOLO teaches PAN DE MUERTO / GIVE
 │
 ▼
Cure ZOMBIE
 │
 ▼
XOLO reveals SECRET
 │
 ▼
Reach OFRENDA checkpoint
 │
 ▼
Small celebration
 │
 ▼
END
```

---

# 21. Playtest Success Criteria

| Metric | Initial Target |
|---|---|
| Understand movement without verbal explanation | ≤ 30 sec |
| Discover jump | ≤ 60 sec |
| Understand candy is positive | first encounter |
| Recognize heart loss after zombie contact | first/second encounter |
| Discover GIVE/Pan behavior | ≤ 2 attempts |
| Complete vertical slice | ≤ 8 min |
| Adult prompts required | max 1–2 |
| Understand Xolo as a guide | observable after first hint |
| Reading required | 0 |
| Voluntarily wants to replay | record yes/no |

Replay desire is UX information, not a target for addictive design.

---

# 22. Privacy & Safety Requirements — LOCKED

CHÚMBALA! v1 will not include:

- accounts,
- public profiles,
- usernames,
- chat,
- comments,
- multiplayer online,
- friend requests,
- photos,
- location,
- global leaderboards,
- user-generated content,
- advertising,
- behavioral tracking,
- targeted recommendations,
- in-app purchases.

Initial MVP goal:

> **No backend. No account. No analytics.**

Possible save data:

- local browser storage only.

---

# 23. Browser-First, Mobile-Included Strategy

The game must run in a browser on desktop, tablet and mobile phones.

Mobile is a first-class target.

The initial real-world mobile reference is an **iPhone 15 Pro**.

Initial recommendation:

> **Landscape orientation**

Mobile principles:

- large touch targets,
- few simultaneous buttons,
- high contrast,
- no tiny text,
- no precise gestures,
- safe-area/notch awareness,
- support for varying aspect ratios.

Touch layout:

```text
LEFT SIDE                    RIGHT SIDE

◀    ▶                       JUMP

                              🥖 GIVE
```

Desktop mapping:

```text
← / →       MOVE
SPACE       JUMP
X           GIVE
```

Physical input must be separated from game actions.

---

# 24. Technical Architecture Direction

Current recommended stack:

- **Phaser 3**
- **TypeScript**
- **Vite**
- **HTML5 Canvas**
- **Web Audio API**

Suggested systems:

- InputSystem
- HealthSystem
- CandySystem
- GiveSystem
- CheckpointSystem
- TutorialSystem

---

# 25. Performance Targets

- responsive browser play,
- stable performance on modern phones,
- target 60 FPS when practical,
- compressed image/audio assets,
- modest particle counts,
- fast loading,
- minimal network dependency.

The vertical slice must be tested on a real mobile device, not only desktop emulation.

---

# 26. Natural Stopping Model

```text
PLAY
 ↓
CHALLENGE
 ↓
OFRENDA
 ↓
REST
 ↓
CONTINUE / STOP
```

No autoplay to the next level.

---

# 27. Out of Scope for v0.x

Do not build yet:

- multiplayer,
- online co-op,
- boss fights,
- inventory systems,
- skill trees,
- crafting,
- character stats,
- procedural generation,
- AI chat NPCs,
- accounts,
- cloud saves,
- achievements,
- app-store versions,
- multiple worlds,
- extensive character customization,
- many enemy types,
- large backend infrastructure,
- bread launcher / projectile combat.

First prove:

> Is CHÚMBALA! fun with one player character, Xolo, a few candies, a Pan de Muerto basket, platforms, one silly zombie and one ofrenda?

---

# 28. Working Title and IP Note

**CHÚMBALA!** is currently a working title.

The videogame should have original story, music, characters, dialogue and art.

Before public/commercial release:

- verify name availability,
- review trademark conflicts,
- review rights related to any song, melody or lyrics,
- avoid copying protected recordings or arrangements without permission.

---

# 29. Current Canon / Locked Decisions

- Working title: **CHÚMBALA!**
- Browser-first delivery.
- Desktop + tablet + mobile support.
- Mobile is a first-class target.
- iPhone 15 Pro is a real-device reference for initial playtesting.
- 4–6 target age range.
- Single-player.
- No online social interaction.
- Four selectable archetypes:
  - Witch
  - Wizard
  - Calaca Girl
  - Calaca Boy
- Xolo as permanent companion.
- Three core actions:
  - Move
  - Jump
  - Give
- Three-heart health system.
- Candy restores health.
- Candy does not cause the zombie curse.
- Player carries a small Pan de Muerto basket.
- Pan de Muerto cures zombies.
- Pan is offered, not fired.
- No bread ammunition management in the vertical slice.
- Zombies are silly, not disturbing.
- Failure respawns at the last safe point/ofrenda.
- Ofrendas are checkpoints and natural stopping points.
- Reading is never required to progress.
- English exposure is contextual.
- Mexican cultural vocabulary remains visible.
- Vertical slice comes before full-game production.
- No backend/accounts/analytics in MVP.

---

# 30. Open Design Questions

1. Exact narrative cause of the zombie curse.
2. Exact GIVE interaction:
   - one tap,
   - short hold,
   - contextual button only in range.
3. Exact jump height and movement speed.
4. Whether movement speed is fixed or has acceleration.
5. Whether candy requires 3 or 5 pieces per heart after testing.
6. Exact mobile button sizes and positions.
7. Whether mobile supports portrait at all or landscape only.
8. How Xolo signals secrets without becoming distracting.
9. Exact checkpoint interaction.
10. Exact visual treatment of ofrendas and cultural elements.
11. Final title/subtitle.
12. Original audio direction.
13. Exact visual animation for handing over the Pan de Muerto.

---

# 31. Current Supporting Artifacts

- **Level Design Blueprint / Visual Wireframe — Vertical Slice v0.1**
- **Technical Implementation Spec for Codex/Claude v0.1**

---

# 32. One-Sentence Product Summary

> **CHÚMBALA! is a child-friendly 2D spooky platformer inspired by Mexican visual culture, where young players run, jump, collect candy and offer Pan de Muerto to cure silly zombies alongside a loyal Xolo — designed to be safe, readable without text, forgiving and playable directly in a browser on desktop or mobile.**
