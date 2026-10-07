# CHÚMBALA! — Phase 0 + Phase 1

Browser-first Phaser 3 + TypeScript + Vite movement prototype. Placeholder graphics only.
The current build includes the menu, safe plaza, and first jump obstacle. The world stops
at x=1600; later vertical-slice beats are intentionally not implemented.

## Run

Use Node.js 22.18+ (or Node.js 24 LTS) and npm. Node 22.18+ is needed for the
dependency-free TypeScript unit-test runner; Vite itself supports 22.12+.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Open the URL printed by Vite. `dev` binds to the local network so a phone on the same
Wi-Fi can use the computer's LAN IP and port 5173 (subject to Windows firewall rules).

This workspace also has an ignored, checksum-verified portable Node 24 runtime. To use
it in PowerShell without a system installation:

```powershell
$env:PATH = "$PWD/.tools/node-v24.21.0-win-x64;$env:PATH"
npm.cmd run dev
```

ArrowLeft/A and ArrowRight/D move; Space jumps. Click/tap ▶ PLAY or press Enter to
enter Level01. On-screen LEFT, RIGHT, and JUMP are also available on desktop, which
keeps tutorial pulses visible and makes input testing straightforward.

## Validation

```sh
npm test
npx playwright install chromium webkit
npm run test:browser
```

Four Node tests cover coyote/buffer boundaries, consumption, reset, and double-jump
prevention. Three Playwright scenarios check menu entry, keyboard input, tutorial
pulses and dismissal, obstacle traversal, camera follow, responsive canvas sizing,
live coyote/buffer jumps, real two-pointer touch input at 852×393, portrait suspension,
and return to landscape at 740×360. Browser scenarios check runtime console errors.
Screenshots are written to ignored `test-results/` for visual inspection.

Additional Chromium and WebKit tests cover cold portrait startup, rotation and
recovery, a JavaScript-disabled page, a failed game-module request, and a simulated
Phaser constructor failure. Windows WebKit does not replace the actual iPhone test.

Real iPhone Safari testing remains required before a mobile playtest release. Browser
emulation cannot validate physical thumb comfort, notch behavior on a real device,
or Safari-specific behavior. CSS safe-area insets are implemented; emulation normally
reports zero hardware insets.

## Source structure

```text
src/
  main.ts
  bootstrap.ts
  style.css
  config/gameConfig.ts
  config/tuning.ts
  entities/Player.ts
  level/level01Layout.ts
  scenes/BootScene.ts
  scenes/MenuScene.ts
  scenes/Level01Scene.ts
  systems/InputSystem.ts
  systems/JumpTiming.ts
  systems/TutorialSystem.ts
  ui/TouchControls.ts
  ui/viewport.ts
  dev/startupDiagnostics.js
tests/
  movement.test.ts
  smoke.spec.ts
  mobile-startup.spec.ts
```

The existing `src/README.md` and design documents remain unchanged.

## Implementation walkthrough

**Scenes** are Phaser's lifecycle units: they own game objects, input handlers, and
an `update` loop. BootScene generates a tiny placeholder texture once. MenuScene
offers fast entry. Level01Scene assembles the world, Player, input, tutorials, and
camera, then delegates ongoing behavior. Shutdown handlers dispose of DOM controls
and input listeners, rather than allowing them to accumulate across scene changes.

**InputSystem** converts keyboard keys and touch pointers into one snapshot:
`move: -1 | 0 | 1` and `jumpPressed: boolean`. Opposite directions cancel each other.
Keyboard down events and touch presses queue a jump until the next update, so a
very short tap is not lost between frames. Holding Space does not repeat jumps.
The Player consumes that snapshot without knowing which device produced it.

**TouchControls** uses native HTML buttons and Pointer Events, not Phaser pointers.
Each finger has its own pointer ID; holding RIGHT and tapping JUMP therefore remain
independent. Pointer capture delivers release events even if a finger slides off
a button. Cancellation, lost capture, window blur, and page hiding release controls.
Native CSS sizing keeps targets at least 64 CSS pixels across, independent of canvas
FIT scaling. Controls remain fixed to the viewport while the game camera scrolls.

**Arcade Physics** integrates gravity and velocities and separates overlapping
axis-aligned rectangular bodies. Ground and obstacle are static bodies; the Player
has a dynamic body. A collider makes those surfaces solid. Horizontal velocity is
set directly each frame for immediate stopping, rather than simulating slippery
acceleration or inertia. Upward jump velocity is negative because canvas y increases
downward. Gravity brings the player back down.

**Coyote time** remembers when the player was last grounded. A jump is still accepted
for 150 ms after walking off a platform. JumpTiming invalidates that timestamp after
takeoff so coyote time cannot turn into a second midair jump. It also guards against
the one-frame persistence of grounded collision flags immediately after jumping.

**Jump buffering** remembers a press for 150 ms. If the player lands during that
window, the stored request triggers the jump. Each accepted request is consumed
once. These are timing allowances, not automatic jumps: the child still presses JUMP.

**Scaling** keeps gameplay in a 1280×720 logical coordinate system. `Scale.FIT`
uniformly shrinks or enlarges the canvas to fit its parent without stretching;
`CENTER_BOTH` centers it, leaving letterbox space on wider/taller screens. The parent
insets itself using `env(safe-area-inset-*)`, enabled by `viewport-fit=cover`.
Touch controls have their own CSS safe-area margins. Touch portrait displays a
non-blocking rotate cue and suspends physics and input; returning to landscape
resumes the level. Portrait gameplay is intentionally unsupported.

The critical page background, loading fallback, and CSS portrait cue are supplied
directly by HTML, so they do not depend on Phaser or game-module execution.
`main.ts` sets orientation before dynamically importing `bootstrap.ts`; only the
first rendered Phaser frame dismisses the loading fallback. Viewport/orientation
events and page restoration refresh canvas sizing after layout updates.

## Local startup diagnostics (DEV only)

Open the Network URL with `/?debug=1` on the iPhone. A read-only panel reports boot
stage, orientation/suspension, viewport size, canvas size, and any error. The state
is also available as `window.__CHUMBALA_DIAGNOSTICS__` in the browser console.
There is no storage, analytics, or remote transmission.

- `html-received`: HTML and the early script arrived; the module entry has not run.
- `modules-loading`: the entry ran and is loading the game. Import failure becomes
  `modules-failed`.
- `phaser-booting`: modules loaded and Phaser is starting. Constructor failure
  becomes `phaser-failed`.
- `ready`: Phaser rendered its first frame. `portrait-suspended` means intentional
  gameplay suspension, not a load failure.
- `resource-load-failed`: a script/stylesheet request failed. `runtime-failed`
  identifies an uncaught error or rejected promise.

A ten-second watchdog reports a stalled entry, module load, or Phaser boot stage.
The diagnostic script is injected only by Vite's development server and is absent
from production, including preview with `?debug=1`.
If neither the page shell nor the panel appears, HTML/early-script receipt has not
been confirmed; check the URL, server, and network. JavaScript-disabled browsing
still shows the CSS rotate cue and fallback.

On the actual iPhone: reload in portrait, rotate both ways, tap PLAY in landscape,
hold RIGHT while tapping JUMP, rotate during held input, then return to landscape.
Check the notch, home indicator, Safari toolbars, and absence of stuck movement.
If startup still fails, report the panel's stage/error and the iOS/browser version.

**Camera follow** tracks the Player within world bounds. A deadzone allows small
movements without moving the camera, and interpolation softens larger adjustments.
The world is 1600 pixels wide, so scrolling becomes visible approaching the obstacle.
No additional level sections or end scene are introduced.

**Tuning** keeps movement, gravity, forgiveness windows, tutorial thresholds, and
camera behavior separate from logic. Level01 geometry is similarly centralized in
`level01Layout.ts`. Changing a jump window or obstacle height does not require editing
the input or scene architecture. Initial physics values match the Technical Spec.

## Tradeoffs and next review

- Native DOM controls simplify multitouch and safe-area handling but need their own
  scene cleanup rather than Phaser object destruction.
- Continuous ground makes early failures safe; the platform edge still permits
  testing coyote time without adding a pit or respawn system.
- Full Phaser produces a Vite chunk-size warning (about 322 KB gzipped). No complex
  bundle optimization is introduced for this phase.
- No final art/audio, persistence, health, candy, enemies, GIVE, or Xolo exists yet.

Before Phase 2, review movement speed and stopping, jump height/range, obstacle
forgiveness, tutorial timing and comprehension, touch reachability, and actual iPhone
landscape behavior. Then agree on the Phase 2 health/candy presentation using the
existing three-heart and five-candy rules. Phase 2 has not started.
