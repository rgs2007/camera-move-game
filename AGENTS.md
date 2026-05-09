# Codex Project Instructions

## Project Context

This repository is a static GitHub Pages project for a camera-controlled browser
game prototype called `camera-move-game`.

The primary page is `index.html`, and the site is intended to stay no-build,
easy to open locally, and easy to publish from the root of the `main` branch.

Public site:
https://rgs2007.github.io/camera-move-game/

Local preview:
Open `C:\github_\camera-move-game\index.html` in a browser, or use a local HTTP
server when camera APIs require a secure browser context.

Basic tests:
Add lightweight browser-based tests as game logic grows beyond simple DOM wiring.

## Engineering Standards

- Follow clean code best practices: readable names, small functions, clear control
  flow, and minimal hidden state.
- Keep changes focused. Avoid broad rewrites unless the user explicitly asks for a
  larger redesign.
- Prefer simple browser-native HTML, CSS, and JavaScript for this project.
- Use SOLID principles where they apply naturally, especially single
  responsibility and dependency boundaries. Do not force abstractions into a small
  static game when plain code is clearer.
- Keep behavior testable by separating pure calculation from DOM updates whenever
  practical.
- Avoid duplicated constants. If a value controls behavior in multiple places,
  give it a meaningful name.
- Preserve accessibility for interactive controls with labels, semantic elements,
  keyboard-friendly behavior, and sufficient contrast.
- All implemented code should aim to run in the current and immediately previous
  major/recent version of major known browsers whenever practical. Prefer stable,
  broadly supported web platform features, and treat newer APIs as progressive
  enhancements unless the user explicitly accepts a narrower browser target.
- Prefer breaking code into small, focused files so future AI-assisted work does
  not require loading the entire project into context for each change. Use file
  boundaries that reflect responsibilities, not arbitrary size targets.
- For this project, optimize file boundaries for AI-assisted reading as well as
  human maintenance. A change to physics, camera lifecycle, motion detection, UI,
  or tuning should usually be possible by opening one focused file plus `main.js`,
  not one giant script.
- Prefer browser-native ES modules for that split so the project stays static and
  no-build while still allowing clear imports between small files.

## Logging

- Add logging only when it helps debug user-visible behavior or integration
  problems.
- Prefer concise, structured `console.info`, `console.warn`, or `console.error`
  messages over noisy logs.
- Do not leave temporary debugging logs in the final code.
- Never log secrets, tokens, private profile data, or unnecessary personal data.

## Testing

- Add basic unit tests when JavaScript behavior grows beyond trivial DOM wiring.
- Keep testable logic in small pure functions, for example movement math,
  sensitivity calculations, collision detection, camera-signal normalization, or
  score formatting helpers.
- Prefer lightweight tests that can run locally without a complex build pipeline.
- This project should prefer browser-based HTML tests unless the user explicitly
  asks for a package manager or command-line runner.
- For visible UI changes, verify the local `index.html` in a browser after each
  change.
- When using live camera input, verify both the happy path and blocked-permission
  path so the game remains understandable even when camera access fails.

## Comments

- This project intentionally favors regular plain-text comments in the code, even
  in places where strict clean-code style might normally remove them.
- Add comments for every meaningful section of HTML, CSS, and JavaScript that
  explain what the section is doing and why it exists.
- Add comments for design decisions, gameplay tradeoffs, browser quirks, test
  hooks, and non-obvious interactions.
- Add comments above helper functions explaining their role in the camera-control
  game experience.
- When changing code, update nearby comments in the same edit so they stay true.
- When adding a feature, include comments that explain the user-facing behavior
  and the implementation approach.
- Avoid misleading or stale comments. It is better to rewrite a comment than leave
  an old explanation attached to new behavior.

## Design Direction

- The first screen should be the playable game, not a marketing page.
- Keep the interface readable, game-like, and motion-focused.
- Treat camera interaction as the central mechanic and make it visually clear how
  body movement maps to gameplay response.
- Favor polished, browser-native interaction patterns over heavy setup friction.
- Avoid marketing-page composition. The first screen should be the usable
  interactive experience.
- Prefer implementation choices that degrade gracefully across major browser
  engines and their immediately previous released versions.

## Current Design Decisions

- The app stays static and no-build so it can be opened directly and served by
  GitHub Pages without a package manager or bundler.
- The current structure should keep `index.html` mostly declarative, with visual
  styling in `styles/game.css` and browser-native ES modules in `src/` handling
  orchestration, camera lifecycle, motion extraction, physics, debug output, and
  DOM updates.
- As the codebase grows, split logic into small browser-native files with
  boundaries that reduce AI context load. Prefer a structure where a model can
  read only the relevant slice of the project for a specific change.
- Treat that modular split as a product decision, not just a refactor detail. The
  project should be organized so AI tools and humans can inspect only the part
  they need: camera setup, motion extraction, physics, game rendering, or tuning.
- The camera preview should remain visible so the player can understand the input
  loop and relate body movement to game response.
- Camera access may require a secure browser context. When necessary, prefer local
  HTTP preview over `file://` so permission prompts and preview behavior work more
  reliably.
- When using browser APIs for camera, canvas, video, or computer-vision features,
  prefer compatibility-aware patterns and fallbacks that keep the app functional
  across the latest and previous major browser versions where possible.
- The first playable loop uses live camera input to move a ball toward a goal on
  the playfield.
- The game should communicate camera state clearly, including waiting, requesting,
  live, unsupported, blocked, or other failure conditions.
- Camera-motion detection should prefer readable, debuggable heuristics over black
  box complexity. Use small named thresholds and calculations so tuning remains
  practical.
- The active motion engine should stay lightweight: draw the camera into a tiny
  sample canvas, compare luminance against the prior sampled frame, and derive a
  weighted motion center. Avoid loading heavy WebAssembly computer-vision
  runtimes in the default path unless the user explicitly accepts that tradeoff.
- Keep expensive vision work on a slower cadence than rendering when possible.
  For this project, smooth ball motion matters more than analyzing every camera
  frame, so prefer a throttled motion-analysis loop over full-rate image
  processing on the main thread.
- If motion tracking is present, prefer deriving movement from frame-to-frame image
  difference in a way that is visually understandable and easy to tune. Make the
  mapping from camera input to ball movement legible to the user.
- Keep the ball movement responsive enough to feel interactive, but avoid chaotic
  motion that makes the game unreadable or uncontrollable.
- Gameplay tuning values such as speed, sensitivity, thresholds, and damping
  should stay explicit and grouped near the logic that uses them.
- The page may include on-screen hints that teach the player how to move their
  body to affect the ball. Keep those hints brief, browser-friendly, and useful
  when camera permission is denied or blocked.
- The visual layout should present a playable field, game status, and camera
  preview in a way that feels like a real playable prototype rather than a raw
  debugging tool.
- For this project, an optimized future file breakdown would look roughly like:
  `index.html` for markup and asset wiring only, `styles/game.css` for visual
  styling, `src/config.js` for tuning constants and feature flags, `src/dom.js`
  for DOM lookup and rendering helpers, `src/physics.js` for ball motion and
  collision logic, `src/camera.js` for browser camera lifecycle, `src/vision.js`
  for the active lightweight motion-detection pipeline, `src/input-map.js` for
  turning motion signals into gameplay impulses, and `src/main.js` for
  orchestration.
- If debug UI remains useful, prefer a separate `src/debug.js` so temporary
  instrumentation, markers, overlays, and status chips do not stay mixed into the
  main game loop.
- If the project grows into multiple game modes, prefer a `src/games/` or
  `src/modes/` folder so reusable camera, physics, and rendering modules stay
  shared while each game mode owns only its specific rules.
- Keep pure logic such as physics, normalization, thresholds, vector math, and
  motion-to-impulse mapping separate from camera I/O and DOM rendering whenever
  practical so those modules can be read, tested, and modified in isolation.
- When introducing a new feature, prefer adding or extending a focused file rather
  than growing a single large script, unless the change is truly tiny.
- Avoid splitting code into many tiny files with circular dependencies or unclear
  ownership. The goal is a few clear modules with stable APIs, not fragmentation
  for its own sake.
- If future versions add score systems, obstacles, levels, timers, or calibration,
  document those decisions here as they become stable.

## Maintenance Rules

- Update this `AGENTS.md` file when important design or engineering decisions
  change.
- If a future change adds a build tool, package manager, or test runner, document
  the commands here.
- If a future change adds generated files or deployment artifacts, document what
  should and should not be edited by hand.
