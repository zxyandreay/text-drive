# TEXT DRIVE

Small narrative-driven browser game prototype about the danger of texting while driving.

## Short description

`TEXT DRIVE` is a focused Phaser 3 prototype built around one core experience: **simultaneous driving and exact-text typing under pressure**. It emphasizes the emotional tension of split attention over feature breadth.

The playfield is a **split HUD**: a road and car on one side, a phone messaging thread on the other, and a **compact top bar** for level title, run stats, and **dialogue progress** (how many player replies are done versus total prompts for that level—not the same as “level 1 of 3” in the campaign).

## Prototype note

This project is intentionally a **prototype**, not a full commercial game. Scope stays small: validate the core mechanic and emotional arc with a polished, playable vertical slice.

## Core concept

During a level the player must:

- **Steer** the car with the **mouse**
- **Type** message replies with the **keyboard** and submit with **Enter**
- **Finish the whole dialogue** before the **level story timer** expires
- **Avoid obstacles** while **stress** affects the run

Wrong letters are not judged until the player presses **Enter** with a reply that does not match the expected text (after trim; matching is case-insensitive).

There are **three** narrative levels (in order):

1. **Level 1: First Date** (`first-date`)
2. **Level 2: Marriage** (`marriage`)
3. **Level 3: Hospital** (internal id: `hospital`)

## Features

- **Main menu** with large **Teko** wordmark, **Inter** UI, flat night-road backdrop, faint horizon / lane perspective, and **animated centerline dashes** (forward scroll). **START** goes to level select.
- **Level select** with **LEVEL SELECT** heading; cards show title, tone, and **Completed / Unlocked / Locked** badges.
- **Strict linear unlocks**: only **level 1** is available on a fresh save; completing level *n* unlocks level *n*+1. Progress is stored as an ordered **completed** list; **`ProgressManager`** recomputes unlocks and **coerces** saves to a valid prefix so out-of-order completion data cannot unlock later levels early.
- **Per-run score** and **best score per level** (updated on **successful** clears only); persisted under **`text-drive-progress-v2`** in `localStorage` (migrates from legacy `text-drive-progress-v1` if present).
- **Story timer** per level (whole-level budget, not per-message caps); values in `src/data/levels.json` (`storyTimeSeconds`).
- **Story / dialogue progress strip** in the gameplay top bar: thin track + fill and optional **`completed / total`** label (`total` = number of `prompts` for the level in `dialogue.json`). This reflects **typing progress only**; the blue **`currentLevel / totalLevels`** text beside the level title is separate (campaign position).
- **Level intro narration** (full-screen overlay: title, body, hint to continue; optional **← levels** back to level select).
- **Gameplay pause**: **Escape** toggles pause during the driving phase—Phaser scene `time` and tweens pause, **message-exchange timers** pause, and keyboard typing is blocked; a minimal overlay offers **resume**, **level select**, and **main menu** ([`GameplayPauseOverlay`](src/game/ui/GameplayPauseOverlay.ts)).
- **Arcade steering feel**: mouse X targets a lane position; the car uses **lateral velocity** (acceleration cap, max sideways speed, exponential drag, small dead zone, extra damping near lane edges). Under **stress incidents**, steering uses a **delayed target sample** plus reduced responsiveness ([`DrivingSystem`](src/game/systems/DrivingSystem.ts), [`StressSystem`](src/game/systems/StressSystem.ts)). All tuning lives in the top-level **`STEERING`** constant in `DrivingSystem.ts`.
- **Stress feedback**: wrong submits, crashes, and overload push a **stress** meter; incidents also trigger **steering delay**, temporary **obstacle speed boost**, phone **vibrate**, and light **camera shake** ([`StressSystem`](src/game/systems/StressSystem.ts), [`ObstacleSystem`](src/game/systems/ObstacleSystem.ts)).
- **Two-step result flow**: score card first (**← level select** in the corner), then **aftermath** copy with primary/secondary actions (e.g. **play next level**, **play again**, **main menu**, **continue to ending** on final success).
- **Narrative text layout**: intro bodies and result **aftermath** / **failure reason** use **measurement-based word wrap** (`src/game/ui/narrativeLayout.ts`) so line length matches Phaser text metrics; column width is capped for readability and scales with panel width.
- **Phone messaging UI**: scrollable chat (partner / player bubbles), optional typing indicator, per-level pacing in `src/game/ui/messagePacing.ts` (keys: `first-date`, `marriage`, `hospital`). Reply hints and typed feedback use shared monospace layout logic in `src/game/ui/typingHighlightLayout.ts` (word-aware wrapping).
- **Typography**: [Google Fonts](https://fonts.google.com/) **Teko** (700) for display titles / wordmark; **Inter** for UI and body. `src/main.ts` waits on `document.fonts.load` / `document.fonts.ready` before booting Phaser to reduce font flash. **Note:** Phaser `Text` must use `fontFamily` + `fontSize` + `fontStyle` (or a 3-token `font` string) — the engine’s `font` shorthand parser breaks stacks like `Teko, sans-serif`.

## Current game flow

1. **Main menu** → **START**
2. **Level select** → choose an **unlocked** level (or **Back** to main menu)
3. **Level intro** narration → continue (space / enter / click, or backdrop)
4. **Gameplay**: drive, type, beat the story clock, finish all messages (**Escape** to pause)
5. **Result** (e.g. *level complete* / *run ended*): score, optional failure reason → **continue**
6. **Aftermath**: short outcome copy → **play next level** / **play again** / **main menu** / **continue to ending** (final level success)
7. **Ending** scene (optional) → **Main menu**

## Controls

- **Mouse**: steer (lane target; car follows with smoothing / momentum—see `DrivingSystem`)
- **Keyboard**: type replies; **Enter** submits; **Backspace** edits
- **Escape**: pause / unpause during gameplay (not during intro or result screens)
- Matching: **trim** + **case-insensitive** for required replies

## Progression / level unlocks

- **First launch**: only **level 1** is unlocked.
- **Level 2** unlocks after level 1 is **completed** (successful run that records completion in `ResultScene`).
- **Level 3** unlocks after level 2 is completed.
- Unlocked levels can be replayed from level select.
- **`GameScene`** rejects a `startLevelId` that is not unlocked.

## Scoring (high level)

Points for correct sends, clearing the level, leftover story time, and a no-crash bonus. Penalties for wrong **Enter** submits, crashes, overload failure, and story timeout. Tune values in `src/game/managers/RunScore.ts`.

## Narrative & content style

- Copy is mostly **lowercase** with **minimal punctuation** by design.
- `src/data/levels.json`: `introNarration` arrays for pre-level screens; `title` is the player-facing level name.
- `src/data/dialogue.json`: in-level `prompts`, `outcome.success` / `outcome.failure` aftermath lines, etc.

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (opens browser via `vite.config.ts`) |
| `npm run build` | `tsc` + production bundle to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run gh -- …` | Windows: runs GitHub CLI via [`scripts/invoke-gh.ps1`](scripts/invoke-gh.ps1) |

## Tech stack

- **TypeScript** (~5.9)
- **Phaser 3** (~3.90)
- **Vite** (~5.4)

## How to run locally

```bash
npm install
npm run dev
```

Use the URL Vite prints (typically `http://localhost:5173`).

## Live demo (GitHub Pages)

Static export is built with:

```bash
npm run build
```

For this repo, CI sets `VITE_BASE_PATH` to `/<repository-name>/` so assets resolve on Pages.

- Example: [https://zxyandreay.github.io/text-drive/](https://zxyandreay.github.io/text-drive/)
- Workflow: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) (on push to **`main`** or manual **workflow_dispatch**)

In the repo **Settings → Pages**, set the source to **GitHub Actions** if needed.

## Runtime / layout

- Fixed game size **900×540**; `Phaser.Scale.FIT` + center in [`src/main.ts`](src/main.ts).
- **Gameplay layout** ([`GameplayLayout.ts`](src/game/ui/GameplayLayout.ts)): three columns—hint card, road, phone—with computed `RoadBounds`, phone rectangle, and top bar height sized to fit the story progress strip.
- Shared colors and type tokens: [`src/game/ui/UiTheme.ts`](src/game/ui/UiTheme.ts).
- Buttons: [`src/game/ui/UiFactory.ts`](src/game/ui/UiFactory.ts) — rectangle hit area + separate label text for reliable picking under scale.

## Project structure

Top-level layout of the **tracked** source (no `node_modules` / `dist`). Comments describe what each part owns.

```text
# --- CI / deployment ---
# GitHub Actions workflow: npm ci, build with VITE_BASE_PATH, upload dist, deploy Pages.
.github/workflows/
  deploy-pages.yml

# --- Root tooling & HTML shell ---
# package.json — npm scripts (dev, build, preview, gh), Phaser + devDependencies.
# package-lock.json — reproducible install tree for npm ci (used in CI).
# tsconfig.json — TypeScript compiler options for the app.
# vite.config.ts — base URL from VITE_BASE_PATH (local “/”, Pages “/<repo>/”), dev server open.
# index.html — Google Fonts links, hidden font-priming span, <div id="app"> for Phaser parent.
# README.md — this documentation.
# .gitignore — excludes node_modules, dist, .DS_Store, *.local.
package.json
package-lock.json
tsconfig.json
vite.config.ts
index.html
README.md
.gitignore

# --- Helper scripts (Windows) ---
# invoke-gh.ps1 — prepends common install paths so `gh` works when PATH is trimmed (agents, minimal shells); used by npm run gh.
scripts/
  invoke-gh.ps1

# --- Editor defaults (optional for contributors) ---
# VS Code / Cursor workspace settings if checked in.
.vscode/
  settings.json

# --- Application entry & global CSS ---
# main.ts — async font load, Phaser.Game config (900×540, FIT, center), scene list & boot order.
# style.css — page/body styles around the canvas (not in-canvas Phaser styling).
src/
  main.ts
  style.css

  # --- Static narrative & tuning data (loaded at runtime) ---
  # levels.json — per-level id, title, tone, introNarration[], storyTimeSeconds, roadSpeed, obstacleSpeed, obstacleSpawnMs, maxStress.
  # dialogue.json — per-level prompts (incoming + expected reply), outro, outcome.success / outcome.failure aftermath strings.
  data/
    dialogue.json
    levels.json

  # --- Phaser scenes & gameplay modules ---
  game/
    # Scene flow: menu → select → (intro) → play → result → ending; see Current game flow in this README.
    MainMenuScene.ts       # Night-road backdrop, animated lane dashes, Teko wordmark, START → LevelSelectScene.
    LevelSelectScene.ts    # Level cards with tone + Completed/Unlocked/Locked; starts GameScene with chosen level id (or back to menu).
    GameScene.ts           # Core loop: LevelManager + DialogueManager data; Driving/Obstacle/Stress/Typing systems + PhoneUI;
                           # builds HUD (title, campaign progress text, stress/score/timer, story progress bar, hint card);
                           # intro overlay gate; Escape pause; story timer; transitions to ResultScene on success/fail/timeout/overload.
    ResultScene.ts         # Two-step flow: score summary then narrative aftermath; on success updates ProgressManager + best score via RunScore; routes to next level / replay / menu / EndingScene.
    EndingScene.ts         # Epilogue beat after final level success; return to MainMenuScene.

    # managers/ — cross-cutting state: content access, level order, persistence, scoring.
    managers/
      DialogueManager.ts   # Read-only API over dialogue.json: getPrompts, getOutcomeText, getOutro by level id.
      LevelManager.ts      # Ordered LevelConfig list from levels.json; current level, setCurrentById, getNextLevelId, numbering helpers for UI.
      ProgressManager.ts   # localStorage key text-drive-progress-v2; migrates v1; ordered completed ids; linear unlock + save coercion.
      RunScore.ts          # Per-run points: correct replies, level clear, time left, no-crash bonus; penalties for wrong submit, crash, overload.

    # systems/ — gameplay simulation and input; owned and ticked from GameScene during gameplay state.
    systems/
      DrivingSystem.ts     # Road fill, edges, lane markers, car sprite; vertical scroll; exports RoadBounds type;
                           # mouse X → clamped lane target; lateral velocity integration (STEERING accel/drag/max speed, dead zone, edge damping);
                           # stress steering delay (sparse target resample + reduced gain); relayout on resize.
      ObstacleSystem.ts    # Spawn timer, orange obstacles moving down the road; AABB vs car; crash flag + consume for GameScene/stress;
                           # temporary speed multiplier after stress incidents; level configure/reset helpers.
      StressSystem.ts      # Stress counter vs per-level max; applyIncident (wrong_input, crash) → stress++, steering delay, obstacle boost, phone vibrate, camera shake;
                           # overload check ends run; level configure/reset.
      TypingSystem.ts      # Global keydown: compose gated until partner message + hint; pacing timers (incoming delay, typing indicator, hint reveal, send beat, next exchange);
                           # Enter validates normalized reply; completedCount increments before onCorrectReply (HUD/score sync); incidents queued for wrong submit;
                           # pause hooks block input and pause timers without destroying them.

    # types/ — JSON-aligned TypeScript models.
    types/
      LevelTypes.ts        # LevelConfig, dialogue block/prompt shapes shared by levels.json and dialogue.json consumers.

    # ui/ — layout helpers, overlays, phone chrome, and shared visual tokens (not Phaser Scene subclasses).
    ui/
      ChatBubbleRow.ts         # Builds partner/player bubble rows and typing-indicator row geometry for PhoneUI.
      GameplayLayout.ts        # computeGameplayLayout(scale): full-frame metrics—margins, top bar, hint card, RoadBounds, phone panel, layer depths.
      GameplayPauseOverlay.ts  # Dim fullscreen backdrop + compact panel: Paused, resume / level select / main menu (Escape flow from GameScene).
      LevelIntroOverlay.ts     # Full-screen level title + narration body + continue; optional back to level select.
      messagePacing.ts         # Per-level MessagePacing (delays in ms) keyed by level id; imported by TypingSystem.
      narrativeLayout.ts       # measureParagraph / layout helpers for wrapped narrative text in overlays and ResultScene.
      PhoneUI.ts               # Phone frame, scrollable message list, reply field, status line, hint overlay, vibrate tween hook.
      typingHighlightLayout.ts # Monospace wrap + per-character indices for ghost template vs typed overlay in the reply box.
      UiFactory.ts             # Primary/secondary buttons, panels, labeled hit targets; consistent stroke and depth.
      UiTheme.ts               # Font families/sizes, palette strings, spacing constants for menus and HUD.
```

## Future improvements / limitations

- No branching narrative beyond success/failure outcomes
- No cloud sync (local browser only)
- Stylized but simple visuals
- Single core mechanic — not a full commercial title

## Implementation notes

- **Boot:** async font loading in `main.ts` before `new Phaser.Game(config)`.
- **Results:** `ResultScene` records completion and best score on success; explicit vertical gaps between copy blocks and buttons (`GAP_TEXT_TO_BTN`, `BTN_GAP`).
- **Intro:** `LevelIntroOverlay` gates start; `GameScene` starts the story clock and typing session after dismissal (`beginGameplay` → `TypingSystem.startLevel`).
- **Story HUD:** `refreshStoryProgressHud` uses `DialogueManager.getPrompts(level.id).length` and `TypingSystem.getCompletedDialogueSteps()`; the latter increments **before** `onCorrectReply` so the bar and `N / total` label match the number of successful sends (including the first).
- **Pause:** `GameScene` sets `time.paused` + `tweens` pause, destroys/recreates overlay on resize while paused, and calls `TypingSystem.setGameplayInputBlocked` + `setExchangeTimersPaused`.
- **Steering tuning:** edit the `STEERING` object at the top of `DrivingSystem.ts` only—no separate physics engine.
- **Input lifecycle:** `TypingSystem` registers `keydown` in `create` and removes it on scene `shutdown` to avoid duplicate handlers.
- **Driving pressure:** stress-affecting gameplay treats the run as “under pressure” until dialogue completes (`isUnderPressure()` / `isCompleted()` gates in `GameScene`).
- **GitHub CLI on Windows:** `npm run gh` wraps `invoke-gh.ps1` so `gh pr create` and similar work in stripped PATH environments; run `gh auth login` once per profile if commands fail with auth errors.
