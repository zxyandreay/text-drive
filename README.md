# TEXT DRIVE

Small narrative-driven browser game prototype about the danger of texting while driving.

## Short Description

`TEXT DRIVE` is a focused Phaser 3 prototype built to demonstrate one core experience: simultaneous driving and exact-text typing under pressure. It prioritizes the emotional tension of split attention over feature breadth.

## Prototype Note

This project is intentionally a prototype, not a full commercial game.  
Scope is deliberately small and centered on validating the core mechanic and emotional arc with a polished, playable vertical slice.

## Core Concept

At all times during a level, the player must:

- steer a car with the mouse
- type message replies with the keyboard (submitted with Enter)
- finish the whole dialogue before the **level story timer** runs out
- avoid obstacles while managing stress effects

Wrong letters in the text field are not punished until the player presses **Enter** with a non-matching reply.

The mechanics stay consistent across three short narrative levels:

1. First Date
2. Marriage
3. Dying Wife

## Features

- Main menu and level select with strict unlock order (derived from completed levels)
- Per-run **score**, **best score per level** (saved locally on successful clears)
- **Story timer** per level (whole-segment budget, not per-message typing limits)
- **Result screen** after success or failure (play again, next level when applicable, main menu)
- Submit-only typing validation (no per-letter punishment)
- Local persistence: `localStorage` key `text-drive-progress-v2` (older saves may migrate from v1)

## Current Game Flow

1. Main menu → Play or Level select
2. Gameplay: drive, type, beat the story clock, finish all messages
3. **Result** screen with score and best (success or failure)
4. Success: optional **Play next level** or **Continue to ending** on the final level
5. Failure: **Play again** or **Main menu**

## Controls

- Mouse: steer
- Keyboard: type your reply; **Enter** submits; **Backspace** edits
- Matching is case-insensitive after trim

## Progression / Level Unlocks

- Level 1 is available from a fresh save
- Level 2 unlocks only after level 1 is **fully** completed (all dialogue in that level)
- Level 3 unlocks only after level 2 is fully completed
- Unlocked levels can be replayed from level select
- Unlock state is recomputed from the **completed** list so saves stay consistent

## Scoring (high level)

Points for correct sends, clearing the level, leftover story time, and a no-crash bonus.  
Penalties for wrong Enter submits, crashes, overload failure, and running out of story time.  
Best score per level updates only on **successful** level completion.

Tune point values in `src/game/managers/RunScore.ts`.  
Tune per-level **story** time budgets in `src/data/levels.json` (`storyTimeSeconds`).

## Dialogue & content style

- In-game copy in `src/data/dialogue.json` is written **lowercase** with **minimal punctuation** on purpose.
- Required replies are compared with **trim + lowercase**, so typing capital letters still matches.

## NPM scripts

- `npm run dev` — Vite dev server
- `npm run build` — TypeScript check + production bundle to `dist/`
- `npm run preview` — Serve the production build locally

## Tech Stack

- TypeScript
- Phaser 3
- Vite
- GitHub Actions (optional Pages deploy)

## How to Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL (usually `http://localhost:5173`).

## Live Demo

GitHub Pages works with the static Vite `dist` output.

- Example URL: [https://zxyandreay.github.io/text-drive/](https://zxyandreay.github.io/text-drive/)
- Workflow: `.github/workflows/deploy-pages.yml`

Enable **Settings → Pages → Source: GitHub Actions** on the repository, then push `main` so the workflow can publish.

## Project Structure

```text
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
      ProgressManager.ts
      RunScore.ts
    systems/
      DrivingSystem.ts
      ObstacleSystem.ts
      StressSystem.ts
      TypingSystem.ts
    types/
      LevelTypes.ts
    ui/
      PhoneUI.ts
      UiFactory.ts
  main.ts
  style.css
```

## Future Improvements / Limitations

- No branching narrative or multiple endings
- No cloud sync (local browser only)
- Placeholder visuals
- Small scope: one core mechanic, not a full commercial title

## Implementation notes

- **Result flow:** `src/game/ResultScene.ts` records level completion and best score on success; failures do not advance unlocks.
- **Input:** `TypingSystem` removes its keyboard listener on scene `shutdown` so restarting a level does not stack handlers.
- **UI buttons:** `UiFactory` uses an interactive rectangle plus separate text so hit areas align with the scaled canvas.
