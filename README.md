# TEXT DRIVE

Small narrative-driven browser game prototype about the danger of texting while driving.

## Short Description

`TEXT DRIVE` is a focused Phaser 3 prototype built to demonstrate one core experience: simultaneous driving and exact-text typing under pressure. It prioritizes the emotional tension of split attention over feature breadth.

## Prototype Note

This project is intentionally a prototype, not a full commercial game.  
Scope is deliberately small and centered on validating the core mechanic and emotional arc with a polished, playable vertical slice.

## Core Concept

At all times, the player must:

- steer a car with the mouse
- type exact message replies with the keyboard
- avoid obstacles while managing stress effects

The mechanics remain consistent across three short narrative levels:

1. First Date
2. Marriage
3. Dying Wife

## Features

- Polished in-game UI and HUD with clearer layout and hierarchy
- Main menu before gameplay
- Level selection screen with locked/unlocked/completed states
- Progression gating (Level 1 unlocked by default; later levels unlock in order)
- Replay support for any unlocked/completed level
- Game over flow with `Play Again` and `Main Menu`
- Ending flow after finishing all levels
- Local progress persistence for unlocked/completed levels
- Difficulty tuning pass for fairer pacing (still tense, less punishing spiral)

## Current Game Flow

1. `Main Menu` -> `Play` or `Level Select`
2. Start selected (or preferred unlocked) level
3. Drive + type simultaneously through the level prompt queue
4. On overload -> `Game Over` -> `Play Again` or `Main Menu`
5. On level completion -> next level unlocks
6. After final level -> ending screen -> return to main menu

## Controls

- Mouse: steer left/right
- Keyboard: type exact reply text
- Enter: submit current reply
- Backspace: correct typed input

## Progression / Level Unlocks

- Level 1 is unlocked by default
- Level 2 unlocks after completing Level 1
- Level 3 unlocks after completing Level 2
- Any unlocked/completed level can be replayed from Level Select
- Progress is saved in browser `localStorage` under `text-drive-progress-v1`

## Tech Stack

- TypeScript
- Phaser 3
- Vite
- GitHub Actions (for Pages deployment)

## How to Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL (usually `http://localhost:5173`).

## Live Demo

GitHub Pages is compatible with this project because Vite outputs a static `dist` build.

- Expected live URL (once Pages is enabled and deploy succeeds):  
  [https://zxyandreay.github.io/text-drive/](https://zxyandreay.github.io/text-drive/)
- Automatic deployment workflow is included at `.github/workflows/deploy-pages.yml`.

To enable it on GitHub:

1. Push `main` with the workflow file included.
2. In GitHub repository settings, open `Settings -> Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Wait for the `Deploy to GitHub Pages` workflow to finish on `main`.
5. Open the Pages URL shown in repo Pages settings (or the URL above).

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
    GameOverScene.ts
    EndingScene.ts
    managers/
      DialogueManager.ts
      LevelManager.ts
      ProgressManager.ts
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
- No save slots/cloud sync (local browser progress only)
- Placeholder geometric visuals (no authored art/audio pass yet)
- Designed as a small prototype focused on one mechanic, not a full content-rich game