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
- **Level intro narration** before gameplay starts (fade-in context + continue)
- **Two-step result flow**: score first, then short success/failure aftermath context
- Submit-only typing validation (no per-letter punishment)
- Local persistence: `localStorage` key `text-drive-progress-v2` (older saves may migrate from v1)
- **Phone messaging UI**: scrollable chat thread with partner (left) and player (right) bubbles, optional typing indicator, and per-level message pacing (delays between incoming text, hint reveal, send beat, and next message). Reply hints and colored typed text share the same monospace layout.
- **Reply box wrapping**: word-aware line breaks (wraps at spaces; splits mid-word only when a single token is wider than the reply area). Implemented in `src/game/ui/typingHighlightLayout.ts`.

## Current Game Flow

1. Main menu → Play or Level select
2. **Level intro** narration appears before each run (including replays)
3. Gameplay: drive, type, beat the story clock, finish all messages
4. **Result** score screen (success or failure)
5. **Aftermath** screen with short post-level story context based on success/failure
6. Success: optional **Play next level** or **Continue to ending** on the final level
7. Failure: **Play again** or **Main menu**

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

## Narrative & content style

- In-game copy is written **lowercase** with **minimal punctuation** on purpose.
- Level setup in `src/data/levels.json` includes `introNarration` (short context lines shown pre-level).
- Dialogue and outcome text in `src/data/dialogue.json` include:
  - in-level `prompts`
  - `outcome.success` aftermath lines
  - `outcome.failure` aftermath lines
- Required replies are compared with **trim + lowercase**, so typing capital letters still matches.

## NPM scripts

- `npm run dev` — Vite dev server
- `npm run build` — TypeScript check + production bundle to `dist/`
- `npm run preview` — Serve the production build locally
- `npm run gh -- …` — (Windows) forwards arguments to [GitHub CLI](https://cli.github.com/) after syncing PATH via [`scripts/invoke-gh.ps1`](scripts/invoke-gh.ps1). Example: `npm run gh -- pr create --fill`

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
scripts/
  invoke-gh.ps1          # Windows helper so GitHub CLI works when PATH is trimmed (e.g. some agent shells)
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
      ChatBubbleRow.ts       # Partner / player / typing row factories for the phone thread
      GameplayLayout.ts      # Road / phone layout metrics
      LevelIntroOverlay.ts
      messagePacing.ts       # Per-level incoming/hint/send delays
      PhoneUI.ts             # Phone chrome, chat thread, reply strip, status
      typingHighlightLayout.ts  # Monospace wrap + per-character positions for hint vs typed line
      UiFactory.ts
      UiTheme.ts
  main.ts
  style.css
```

## Future Improvements / Limitations

- No branching narrative or multiple endings
- No cloud sync (local browser only)
- Placeholder visuals
- Small scope: one core mechanic, not a full commercial title

## Implementation notes

- **Result flow:** `src/game/ResultScene.ts` records completion/best on success, then shows a short aftermath step before action buttons.
- **Narration flow:** `src/game/ui/LevelIntroOverlay.ts` shows pre-level context; `GameScene` gates timer and typing until intro dismissal.
- **Input:** `TypingSystem` removes its keyboard listener on scene `shutdown` so restarting a level does not stack handlers.
- **UI buttons:** `UiFactory` uses an interactive rectangle plus separate text so hit areas align with the scaled canvas.
- **Messaging:** `TypingSystem` sequences each prompt (incoming delay, optional typing row, partner bubble, hint delay, reply hint, compose gate, send beat, player bubble, next prompt). `PhoneUI` keeps `chatHistory` and rebuilds the thread on resize. Pacing presets live in `src/game/ui/messagePacing.ts` (keys: `first-date`, `marriage`, `dying-wife`).
- **Driving pressure:** `isUnderPressure()` stays true until the level dialogue is fully completed so stress/crash coupling does not drop between messages.
