# TEXT DRIVE

**TEXT DRIVE** is a small browser game prototype built with Phaser 3. You steer a car while typing exact text replies in a phone UI: the run is a race between finishing the conversation, staying in the lane, and keeping stress from overwhelming you. The project is narrative-driven and focused on split attention—not on a large feature set.

The npm package name is `text-drive`; the in-game title is **TEXT DRIVE**.

## Prototype note

This is an intentional **prototype**, not a finished commercial game. Scope is limited to a playable vertical slice: one core mechanic, three authored levels, and enough UI and polish to show how the idea feels. Expect a small codebase and honest limitations rather than a long roadmap of systems.

## Core concept

Each level is a single continuous run:

- **Drive** — Move the mouse to steer. The car follows a lane on a scrolling road and must avoid obstacles.
- **Text** — Partner messages arrive in a chat-style UI. You type the expected reply and press **Enter** to send. Matching uses **trim** and is **case-insensitive**. Wrong text is only checked when you submit, not on every keystroke.
- **Pressure** — A **story timer** counts down for the whole level. **Stress** rises on mistakes and crashes; if it hits the level cap, the run ends (“cognitive overload”). Running out of time also ends the run.
- **Progress** — You must complete every reply in the level’s dialogue thread to clear the level successfully.

**Levels** (fixed order, linear unlock):

| Order | Title (from data) | Internal id (for authors) |
|------:|---------------------|---------------------------|
| 1 | Level 1: First Date | `first-date` |
| 2 | Level 2: Marriage | `marriage` |
| 3 | Level 3: Hospital | `hospital` |

## Current features

Features that exist in the code today:

- **Main menu** — Road-style backdrop, animated centerline, tagline, **START** to level select.
- **Level select** — One card per level with title, tone line, and **Completed / Unlocked / Locked** state; **Back** to the menu.
- **Progress & saves** — Linear unlocks (finish level *n* to open *n*+1). Completion and **best score per level** (on successful clears) persist in **`localStorage`** (`text-drive-progress-v2`, with migration from an older key when present). Older saves may be normalized automatically when the format changes.
- **Pre-level narration** — Full-screen intro from level data; dismiss with **Space**, **Enter**, or **click**; optional return to level select.
- **Gameplay** — Simultaneous driving, obstacle avoidance, paced messaging (incoming delay, typing indicator, send beat), reply hints, and status text. Per-level road speed, obstacle cadence, stress cap, and story timer come from data.
- **HUD** — Top bar with **← levels**, level title, campaign progress (`current / total` levels), stress, score, story time, status line, and a **dialogue progress** strip (completed sends vs total prompts for *this* level—not the same as campaign progress).
- **Hint card** — Short control reminder beside the road (fades slightly once play begins).
- **Pause** — **Escape** during gameplay opens a minimal overlay (resume, level select, main menu); simulation and message timers pause; typing is blocked. Choosing level select or main menu from pause **abandons** the run without the result flow.
- **Scoring** — Points for correct sends, clearing the level, leftover story time, and a no-crash bonus; penalties for wrong submits, crashes, overload, and time out (see `RunScore`).
- **Results** — Two-step **Result** scene: score summary, then narrative **aftermath** from dialogue data; navigation to next level, replay, menu, or (after the final level, on success) an optional **ending** scene before returning to the menu.

## Controls

| Input | When | Action |
|--------|------|--------|
| Mouse | Gameplay | Steer (lane target; smoothed lateral movement in code). |
| Typable keys | Gameplay, compose open | Type the reply. |
| **Enter** | Gameplay, compose open | Submit reply (validated against expected text). |
| **Backspace** | Gameplay, compose open | Delete characters in the reply. |
| **Escape** | Gameplay only | Toggle pause overlay. |
| **Space** / **Enter** / click | Level intro overlay | Continue into gameplay. |

Pause is not available on the intro, result, or menu scenes from this key binding.

## Game flow

1. **Main menu** → **START**
2. **Level select** → pick an unlocked level (or **Back**)
3. **Level intro** → continue (Space / Enter / click)
4. **Gameplay** — finish all messages before the story timer hits zero; avoid overload; optionally **Escape** to pause
5. **Result** — score and context; **Continue** to aftermath copy
6. **Aftermath** — outcome text and buttons (e.g. next level, again, main menu; after final success, option to view the **ending**)
7. **Ending** (optional) → **Main menu**

Failed runs (**story timer** or **stress overload**) go through the result / aftermath path with failure copy from data.

## Project structure

High-level layout (not an exhaustive file list):

```text
.github/workflows/   # CI: e.g. GitHub Pages deploy (build with VITE_BASE_PATH)
scripts/             # invoke-gh.ps1 — Windows helper for npm run gh
src/
  main.ts            # Font preload, Phaser config, scene boot order
  style.css          # Page chrome around the canvas
  data/
    levels.json      # Level ids, titles, intro lines, timers, speeds, stress cap
    dialogue.json    # Per-level message threads, expected replies, outcomes
  game/
    *Scene.ts        # MainMenu, LevelSelect, Game, Result, Ending
    managers/        # Level order, dialogue access, progress, scoring
    systems/         # Driving, obstacles, stress, typing/input
    ui/              # Layout, phone UI, overlays, buttons, narrative wrapping, theme
    types/           # TypeScript shapes aligned with JSON
index.html           # App mount, Google Fonts
vite.config.ts       # Dev server, base URL for static hosting
package.json         # Scripts and dependencies
```

## Story and content

- **`src/data/levels.json`** — Player-facing titles, tone, `introNarration` arrays, and gameplay tuning (`storyTimeSeconds`, `roadSpeed`, `obstacleSpeed`, `obstacleSpawnMs`, `maxStress`).
- **`src/data/dialogue.json`** — For each level id: `prompts` (incoming line + expected `reply`), optional `outro`, and `outcome.success` / `outcome.failure` strings used on the result flow.

Copy is mostly lowercase with light punctuation by design.

## How to run locally

```bash
npm install
npm run dev
```

Vite prints a local URL (often `http://localhost:5173`) and may open a browser.

Other scripts:

| Command | Purpose |
|---------|---------|
| `npm run build` | Typecheck (`tsc`) and production bundle to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run gh -- …` | Windows: run GitHub CLI via `scripts/invoke-gh.ps1` |

For **GitHub Pages**, CI sets `VITE_BASE_PATH` to `/<repository-name>/` so asset paths resolve. Example deploy: [text-drive on GitHub Pages](https://zxyandreay.github.io/text-drive/). Workflow: `.github/workflows/deploy-pages.yml`.

## Tech stack

- **TypeScript** (see `package.json` for the pinned major range)
- **Phaser 3**
- **Vite**
- **Google Fonts** — Teko (display) and Inter (UI), linked from `index.html` and loaded before the game boots

## Current status and limitations

- **Branching narrative** — Only success vs failure outcomes per level; no diverging dialogue trees in code.
- **Persistence** — Browser **localStorage** only; no accounts or cloud sync.
- **Presentation** — Simple shapes and UI; focused on readability and the mechanic, not AAA production values.
- **Scope** — Three levels and one main loop; not positioned as a full product.

## Future improvements

Possible directions if the prototype continues: more levels or rewrites, sound design, accessibility (e.g. broader input or difficulty options), tighter tutorial copy, or technical hardening—without promising any specific schedule.

## License

This project is released under the [MIT License](LICENSE).

## Development notes

- Fixed logical size **900×540**, scaled with `FIT` and centered (`src/main.ts`).
- Arcade steering parameters live in a single `STEERING` object at the top of `DrivingSystem.ts` for easy tuning.
