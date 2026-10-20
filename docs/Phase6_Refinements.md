# Phase 6 playtest refinements

These owner-requested refinements supplement the v0.1 blueprint/spec. They are
Level01 teaching decisions, not global rules for future levels.

- GIVE capability remains `GiveSystem.enabled` / `enable()`. `GiveTutorial` owns
  teaching policy. Level01 uses first successful damage plus the teaching region;
  a future level can pass `{ alreadyLearned: true }` to start with GIVE available,
  without taking damage or replaying the hint. First valid GIVE records learning
  in that tutorial instance. The local-save follow-up now persists that learning.
- Smaller bottom-aligned player (32×56) and zombie (40×64) bodies permit forgiving
  jump evasion. Art sizes, jump physics and overlap-only damage remain unchanged.
- The zombie notices at detection range, then pursues until the player leaves the
  encounter (x=2600..3300). Chase speed is 120 versus player speed 240. Its Arcade
  body also has encounter bounds, preventing physical overshoot. It returns to
  patrol when the player leaves. It never reaches the tutorial start or Ofrenda.
- Level01 requires its one tutorial cure. A decorative passage at x=4250 opens
  on `zombie:cured`. Ofrenda overlap independently checks the same Level01
  progression state. Evading the zombie is allowed; completing the tutorial still
  requires returning and offering Pan. No damage, penalty or forced camera is
  attached to the gate. Optional zombies in future levels need no such rule.
- After the optional-secret region, Xolo uses an Ofrenda HINT: lead a short
  distance, wait/look back, and settle beside the altar before activation. The
  player remains free to stop or investigate. Rest still requires player overlap.

## Checkpoints versus local saves

`CheckpointSystem` owns **current-run respawn**, including world coordinates and
SafePoint fallback. It neither reads nor writes storage. It emits
`checkpoint:activated` after first activation; repeated overlap does not emit again.

`SaveSystem` now handles cross-session semantic progress through the level-aware
`Level01SaveCoordinator`. Ofrenda activation and STOP HERE persist the checkpoint;
successful ending persists completion. CONTINUE reconstructs canonical checkpoint
state without replaying activation effects. NEW GAME / PLAY AGAIN reset the run,
retain learned GIVE, and leave the saved checkpoint available until replaced by
another valid checkpoint. See [Local Save v1](Local_Save_v1.md) for schema,
restore rules, fallback behavior, and browser-storage limitations.

## Validation note

Because the required cure removes the only hazard before the Ofrenda, naturally
losing all hearts after activation is no longer possible in this level. Browser
respawn coverage therefore uses a clearly injected checkpoint fixture with the
original live hazard; normal rest/ending tests require the real cure sequence.
