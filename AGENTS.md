# Codex Project Instructions

## Project Context

This repository is a static browser game prototype called `camera-move-game`.
The main page is `index.html`, and the project should stay easy to open locally
and easy to publish through GitHub Pages.

## Engineering Standards

- Prefer plain HTML, CSS, and JavaScript unless the user explicitly asks for a
  framework or build pipeline.
- Keep behavior testable by separating motion math, clamping, collision logic,
  and other pure calculations from direct DOM updates whenever practical.
- Use clear function names, small helpers, and explicit constants for gameplay
  tuning values such as speed, sensitivity, and thresholds.
- Keep code changes focused and avoid broad rewrites unless the user asks for a
  redesign.

## Logging

- Use concise `console.warn` or `console.error` messages for camera permission,
  unsupported browser features, or runtime failures.
- Do not leave temporary debugging noise in the final code.

## Testing

- Add lightweight browser-friendly tests when movement math or game rules become
  more complex.
- Prefer verifying visible game behavior locally after each meaningful UI or
  interaction change.

## Comments

- Add regular plain-text comments explaining the purpose of meaningful HTML, CSS,
  and JavaScript sections.
- Comment gameplay tuning choices, camera-processing decisions, and any
  non-obvious tradeoffs.
- Keep comments updated as the implementation changes.

## Design Direction

- The first screen should be the playable game, not a marketing page.
- Keep the interface readable, game-like, and motion-focused.
- Treat camera interaction as the central mechanic and make it visually clear how
  body movement maps to gameplay response.
- Favor polished, browser-native interaction patterns over heavy setup friction.

## Current Design Decisions

- The first version uses frame-to-frame image difference from the live camera to
  estimate movement direction.
- The camera preview remains visible so the player can understand the input loop.
- The game currently maps motion direction to ball movement and uses a simple goal
  target for scoring.
- The project stays no-build and static for quick iteration and easy GitHub Pages
  deployment.
