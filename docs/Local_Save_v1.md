# Local Save v1 — Phase 6 follow-up

This adds persistence to the accepted Phase 6 slice. Phase 7 is not included.

## Schema and ownership

localStorage key: `chumbala.save.v1`.

```json
{
  "schemaVersion": 1,
  "tutorial": { "giveLearned": true },
  "progress": {
    "currentLevel": "level-01",
    "checkpointId": "ofrenda",
    "levelCompleted": false
  }
}
```

`checkpointId` may be `null` before the Ofrenda. A first valid GIVE saves learning
without claiming a checkpoint; this preserves any previous saved checkpoint.

CheckpointSystem owns current-run respawn coordinates and SafePoint fallback.
SaveSystem serializes only this semantic record, never Phaser/DOM objects,
coordinates, timers, event subscriptions or exact animation history.
Level01SaveCoordinator connects level events to storage. It subscribes before
transition handlers so STOP HERE / completion write before the scene exits.

## Write and load behavior

- First Ofrenda activation saves the checkpoint through `checkpoint:activated`.
- STOP HERE explicitly retries persistence before leaving. Equivalent writes skip
  `setItem`; if the record was lost meanwhile, it is written again.
- Successful ending marks `levelCompleted: true`. Stopping at rest does not.
- NEW GAME / PLAY AGAIN start Level01 at the beginning with fresh hearts, Candy,
  zombie, gate, checkpoint and transient state. Learned GIVE stays available.
  Merely starting a run never erases the saved checkpoint. Reaching another valid
  Ofrenda replaces the previous run's save, including resetting completion false.
- CONTINUE after completion still resumes the only existing Ofrenda; the short
  ending may be enjoyed again. No next level or level selection is implied.
- A learned-only save offers CONTINUE at the beginning with GIVE already learned.

Loading parses JSON, validates version/types/known level and checkpoint IDs, and
copies only schema fields. An Ofrenda record requires learned GIVE; completion
requires a checkpoint. Missing, malformed, inconsistent, or unsupported records
fall back to a fresh run. Storage access, read and write exceptions are contained;
gameplay remains available when storage is denied. No success indicator claims a
save succeeded when it did not. Storage failure remains a best-effort limitation.

## Canonical Ofrenda reconstruction

CONTINUE resolves the stable checkpoint ID against current layout and constructs:

- full health and zero Candy progress,
- cured tutorial zombie and open Level01 gate,
- activated Ofrenda and owned in-session checkpoint,
- player at the safe Ofrenda position and Xolo nearby in FOLLOW/WAIT,
- GIVE learned and immediately available,
- resolved pre-checkpoint pickups/secret (no collectible farming on reload),
- continued rest flow, without automatically opening a dialog,
- fresh input, damage, GIVE and animation state.

Health and Candy progress are not serialized. Within a run their existing rules
remain unchanged. Restore methods do not emit cure/activation events, preventing
duplicate rewards, tutorial prompts, dialogs and writes during reconstruction.

## Privacy, limitations and future levels

The record contains no names, ages, identifiers, personal data, timestamps,
telemetry or network synchronization. There is no account or backend.

localStorage is enough for this tiny synchronous JSON record. It belongs to the
browser profile and exact origin (scheme/host/port), can be cleared or denied,
may be temporary in private browsing, and does not provide cross-device backup.
Changing a development URL can therefore appear to lose a save. Concurrent tabs
use the last successful write; no cross-tab coordination is implemented.

Future levels can extend validation with supported level/checkpoint IDs and add
their own canonical restore mapping/coordinator. Learned tutorial policy already
accepts prior learning independently of damage. A future schema change should
explicitly migrate supported older records or fall back safely; arbitrary JSON
must never be assigned into live scene internals.

Automated Chromium/WebKit reload tests do not establish real-iPhone Safari
persistence. Same-origin refresh, closing/reopening Safari, learned GIVE, both
menu choices, orientation and browser-storage restrictions need device validation.
