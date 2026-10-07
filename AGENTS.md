# AGENTS.md — CHÚMBALA!

This file defines the working rules for AI coding agents contributing to this repository.

## 1. Project Mission

CHÚMBALA! is a child-friendly 2D spooky platformer inspired by Mexican visual culture.

The core experience is:

```text
MOVE → JUMP → CANDY → ZOMBIE DAMAGE → GIVE PAN DE MUERTO
→ CURE → XOLO SECRET → OFRENDA CHECKPOINT → END
```

The project is intentionally small at first. The immediate goal is to build and validate a polished vertical slice before expanding scope.

---

## 2. Read These Files Before Coding

Before making changes, read the latest versions of:

1. `docs/CHUMBALA_GDD_v0.3.md`
2. `docs/CHUMBALA_Level_Wireframe_v0.1.md`
3. `docs/CHUMBALA_Technical_Implementation_Spec_v0.1.md`

These documents are the design and engineering source of truth.

If newer versions exist, prefer the newest version.

Do not silently override decisions marked as **LOCKED**.

If implementation reveals a conflict or ambiguity, stop and explain it instead of inventing a new product decision.

---

## 3. Current Locked Product Decisions

Treat these as constraints unless explicitly changed by the project owner:

- Browser-first delivery.
- Desktop, tablet and mobile support.
- Mobile is a first-class target.
- iPhone-sized landscape gameplay must work well.
- Target audience: approximately ages 4–6.
- Single-player only.
- No online social interaction.
- No chat, public profiles, accounts, usernames or friend systems.
- No analytics or behavioral tracking in the MVP.
- No backend in the MVP.
- No advertising or in-app purchases.
- Reading must not be required to progress.
- Core player actions:
  - `MOVE`
  - `JUMP`
  - `GIVE`
- Player health uses 3 hearts.
- Candy restores health.
- Candy does not cause the zombie curse.
- The player carries a small basket of Pan de Muerto.
- Pan de Muerto cures zombies.
- Pan de Muerto is **offered**, never fired.
- Do not turn Pan de Muerto into ammunition.
- No bread launcher or projectile-combat framing.
- Zombies are silly and non-gory.
- Xolo is a companion and diegetic guide.
- Xolo cannot die, take damage or become a combat mechanic.
- Ofrendas are checkpoints, healing spaces and natural stopping points.
- Failure should be mechanically real but emotionally inexpensive.
- The first milestone is a vertical slice, not a complete game.

---

## 4. Current Technical Direction

Preferred stack:

- Phaser 3
- TypeScript
- Vite
- HTML5 Canvas
- Phaser Arcade Physics
- Web Audio / Phaser audio

Use `npm` unless the repository already contains a lockfile for another package manager.

Do not replace the stack without explicit approval.

---

## 5. Scope Discipline

Implement only the requested phase.

Do **not** add features just because they seem useful.

Out of scope unless explicitly requested:

- multiplayer,
- online co-op,
- chat,
- accounts,
- cloud saves,
- backend services,
- leaderboards,
- achievements,
- inventory,
- crafting,
- skill trees,
- character stats,
- procedural generation,
- boss fights,
- AI NPC chat,
- additional enemy types,
- app-store packaging,
- advanced lighting systems,
- large animation frameworks,
- unnecessary state-management libraries.

Prefer a small working implementation over a broad incomplete one.

---

## 6. Architecture Principles

Keep responsibilities separated.

Preferred conceptual structure:

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

Avoid putting all game logic into one large scene file.

Examples of separate responsibilities:

```text
Player
Zombie
Xolo
Candy
Ofrenda
```

and:

```text
InputSystem
HealthSystem
CandySystem
GiveSystem
CheckpointSystem
TutorialSystem
```

Only introduce abstractions that are actually used by the current slice.

Do not create framework-like infrastructure for hypothetical future features.

---

## 7. Input Rules

Game logic must consume abstract game actions, not device-specific input.

Conceptually:

```text
Keyboard ─┐
Touch ────┼──→ MOVE / JUMP / GIVE
          ┘
```

Player movement code should not need to know whether the action came from keyboard or touch.

Mobile controls must support simultaneous input, especially:

- hold RIGHT + tap JUMP,
- hold RIGHT + tap GIVE.

Respect mobile safe areas and landscape layout.

---

## 8. Game Feel Rules

Movement should be forgiving for young children.

Keep key tuning values centralized, including:

- movement speed,
- jump velocity,
- coyote time,
- jump buffer,
- invulnerability duration,
- zombie speed,
- GIVE range,
- candy-per-heart threshold.

Do not scatter magic numbers throughout gameplay code.

Initial design targets from the Technical Spec should remain easy to tune after playtesting.

---

## 9. GIVE / Pan de Muerto Interaction

This interaction is central to the identity of CHÚMBALA!.

It must visually communicate:

```text
offer → receive → eat → cure
```

Never:

```text
aim → shoot → impact → defeat
```

Do not add:

- crosshairs,
- recoil,
- projectile damage,
- weapon terminology,
- impact VFX,
- ammunition counters.

The Pan de Muerto transfer may be animated or tweened over a short distance, but it is a scripted act of giving, not combat.

---

## 10. Child-Centered UX Rules

The game should teach through the world whenever possible.

Prefer:

- visual cues,
- animation,
- Xolo behavior,
- control pulses,
- sound,
- environmental staging.

Avoid:

- long tutorial text,
- blocking modal instructions,
- dense menus,
- tiny touch targets,
- precision gestures,
- severe punishment.

Tutorial prompts should stop once the player demonstrates understanding.

---

## 11. Privacy and Safety Rules

Do not add code that collects or transmits personal information.

Do not generate persistent user IDs.

Do not add telemetry, analytics SDKs or advertising.

Local browser storage is allowed only for non-personal game state such as:

- checkpoint,
- selected character,
- mute preference.

Do not include identifying information about real children in:

- filenames,
- assets,
- variables,
- comments,
- metadata,
- logs,
- test fixtures.

---

## 12. Cultural Design Rules

Mexican cultural elements should be treated as part of the world, not as generic horror decoration.

Important constraints:

- Día de Muertos is not presented as “Mexican Halloween.”
- The returning dead/ancestors are not villains.
- Zombies are living townspeople affected by a fictional curse.
- Ofrendas are never looted, destroyed or used as enemy-spawn locations.
- Pan de Muerto used for curing does not come from an ofrenda.
- Preserve cultural terms such as:
  - Xolo
  - calaca
  - ofrenda
  - cempasúchil
  - papel picado
  - Pan de Muerto

If a cultural design decision is unclear, flag it for review instead of inventing lore.

---

## 13. Coding Style

Prefer:

- TypeScript strictness,
- small focused functions,
- explicit names,
- readable control flow,
- centralized config,
- minimal dependencies,
- simple Phaser primitives,
- comments only where behavior is non-obvious.

Avoid:

- unnecessary metaprogramming,
- premature optimization,
- giant utility files,
- deep inheritance,
- hidden global state,
- overengineered ECS/state-machine frameworks for the first slice.

Use ESLint and Prettier if configured.

---

## 14. Testing Expectations

When relevant, test:

### Pure logic
- health,
- candy thresholds,
- GIVE eligibility,
- zombie cure state,
- checkpoint selection.

### Browser behavior
- app loads,
- menu reaches level,
- touch controls appear,
- mobile landscape viewport works,
- no console errors.

### Manual mobile validation
Before calling a mobile milestone complete, verify on an iPhone-sized landscape viewport and, when available, a real iPhone.

---

## 15. Working With the Project Owner

This project is also a learning project.

After meaningful implementation work, explain:

1. What changed.
2. Why the architecture was chosen.
3. Which Phaser/TypeScript concepts were used.
4. What tradeoffs were made.
5. What the project owner should understand before the next phase.

Do not only report “done.”

Use technical terminology, but explain it clearly.

---

## 16. Change Management

When a requested change affects a locked gameplay rule:

1. identify the conflict,
2. explain the impact,
3. propose the smallest design/documentation update,
4. wait for approval before silently changing canon.

When playtesting changes product behavior, update the relevant documentation alongside or before implementation.

Do not silently rewrite history.

---

## 17. Git Safety

Do not:

- push to remote,
- merge branches,
- rewrite history,
- force push,
- delete branches,
- create releases,

unless explicitly asked.

Never commit:

- secrets,
- API keys,
- credentials,
- environment files containing secrets.

Prefer small, reviewable changes.

---

## 18. Current Implementation Order

Follow this sequence unless explicitly changed:

```text
Phase 0 — Bootstrap
Phase 1 — Movement
Phase 2 — Health + Candy
Phase 3 — Zombie + Damage
Phase 4 — GIVE + Cure
Phase 5 — Xolo
Phase 6 — Ofrenda + End
Phase 7 — Mobile Polish
Phase 8 — Playtest Build
```

Do not jump ahead unless requested.

---

## 19. Definition of a Good Contribution

A good contribution to CHÚMBALA!:

- works,
- is understandable,
- respects the GDD,
- stays within scope,
- remains easy to tune,
- works on mobile,
- does not compromise child safety/privacy,
- teaches the project owner something,
- leaves the codebase easier to continue than before.
