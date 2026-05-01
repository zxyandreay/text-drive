# TEXT DRIVE

Small narrative-driven browser game prototype about the danger of texting while driving.

## Short description

`TEXT DRIVE` is a focused Phaser 3 prototype built around one core experience: **simultaneous driving and exact-text typing under pressure**. It emphasizes the emotional tension of split attention over feature breadth.

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
3. **Level 3: Hospital** (`dying-wife` — internal id used in data and pacing)

## Features

- **Main menu** with large **Teko** wordmark, **Inter** UI, flat night-road backdrop, faint horizon / lane perspective, and **animated centerline dashes** (forward scroll). **START** goes to level select.
- **Level select** with **LEVEL SELECT** heading; cards show title, tone, and **Completed / Unlocked / Locked** badges.
- **Strict linear unlocks**: only **level 1** is available on a fresh save; completing level *n* unlocks level *n*+1. Progress is stored as an ordered **completed** list; **`ProgressManager`** recomputes unlocks and **coerces** saves to a valid prefix so out-of-order completion data cannot unlock later levels early.
- **Per-run score** and **best score per level** (updated on **successful** clears only); persisted under **`text-drive-progress-v2`** in `localStorage` (migrates from legacy `text-drive-progress-v1` if present).
- **Story timer** per level (whole-level budget, not per-message caps); values in `src/data/levels.json` (`storyTimeSeconds`).
- **Level intro narration** (full-screen overlay: title, body, hint to continue; optional **← levels** back to level select).
- **Two-step result flow**: score card first (**← level select** in the corner), then **aftermath** copy with primary/secondary actions (e.g. **play next level**, **play again**, **main menu**, **continue to ending** on final success).
- **Narrative text layout**: intro bodies and result **aftermath** / **failure reason** use **measurement-based word wrap** (`src/game/ui/narrativeLayout.ts`) so line length matches Phaser text metrics; column width is capped for readability and scales with panel width.
- **Phone messaging UI**: scrollable chat (partner / player bubbles), optional typing indicator, per-level pacing in `src/game/ui/messagePacing.ts` (keys: `first-date`, `marriage`, `dying-wife`). Reply hints and typed feedback use shared monospace layout logic in `src/game/ui/typingHighlightLayout.ts` (word-aware wrapping).
- **Typography**: [Google Fonts](https://fonts.google.com/) **Teko** (700) for display titles / wordmark; **Inter** for UI and body. `src/main.ts` waits on `document.fonts.load` / `document.fonts.ready` before booting Phaser to reduce font flash. **Note:** Phaser `Text` must use `fontFamily` + `fontSize` + `fontStyle` (or a 3-token `font` string) — the engine’s `font` shorthand parser breaks stacks like `Teko, sans-serif`.

## Current game flow

1. **Main menu** → **START**
2. **Level select** → choose an **unlocked** level (or **Back** to main menu)
3. **Level intro** narration → continue (space / enter / click, or backdrop)
4. **Gameplay**: drive, type, beat the story clock, finish all messages
5. **Result** (e.g. *level complete* / *run ended*): score, optional failure reason → **continue**
6. **Aftermath**: short outcome copy → **play next level** / **play again** / **main menu** / **continue to ending** (final level success)
7. **Ending** scene (optional) → **Main menu**

## Controls

- **Mouse**: steer
- **Keyboard**: type replies; **Enter** submits; **Backspace** edits
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
- Shared colors and type tokens: [`src/game/ui/UiTheme.ts`](src/game/ui/UiTheme.ts).
- Buttons: [`src/game/ui/UiFactory.ts`](src/game/ui/UiFactory.ts) — rectangle hit area + separate label text for reliable picking under scale.

## Project structure

```text
.github/workflows/
  deploy-pages.yml       # Build + deploy dist to GitHub Pages
scripts/
  invoke-gh.ps1          # Windows helper for GitHub CLI when PATH is trimmed
index.html               # Google Fonts links, font priming span, #app mount
src/
  data/
    dialogue.json
    levels.json
  game/
    MainMenuScene.ts
    LevelSelectScene.ts
    GameScene.ts
    ResultScene.ts
    EndingScene.ts
    managers/
      DialogueManager.ts
      LevelManager.ts
      ProgressManager.ts  # v2 save, unlock derivation, sequential completion coercion
      RunScore.ts
    systems/
      DrivingSystem.ts
      ObstacleSystem.ts
      StressSystem.ts
      TypingSystem.ts
    types/
      LevelTypes.ts
    ui/
      ChatBubbleRow.ts
      GameplayLayout.ts
      LevelIntroOverlay.ts
      messagePacing.ts
      narrativeLayout.ts    # formatNarrativeBody, column width, measure wrap
      PhoneUI.ts
      typingHighlightLayout.ts
      UiFactory.ts
      UiTheme.ts
  main.ts
  style.css
```

## Future improvements / limitations

- No branching narrative beyond success/failure outcomes
- No cloud sync (local browser only)
- Stylized but simple visuals
- Single core mechanic — not a full commercial title

## Implementation notes

- **Boot:** async font loading in `main.ts` before `new Phaser.Game(config)`.
- **Results:** `ResultScene` records completion and best score on success; explicit vertical gaps between copy blocks and buttons (`GAP_TEXT_TO_BTN`, `BTN_GAP`).
- **Intro:** `LevelIntroOverlay` gates start; `GameScene` starts the story clock after dismissal.
- **Input:** `TypingSystem` removes keyboard listeners on scene `shutdown` to avoid duplicate handlers.
- **Driving pressure:** stress coupling stays active until dialogue is fully complete (`isUnderPressure()` in gameplay code paths).
