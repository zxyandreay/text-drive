# Text & Drive Project Context

This document is an AI handoff file for **Text & Drive**. It is meant to give another developer or AI assistant enough context to understand what the app is, how it is structured, where the important behavior lives, and how to debug or extend it without first reverse-engineering the whole repository.

## 1. Project Identity

**Text & Drive** is a small browser game prototype built with Phaser 3, TypeScript, and Vite. The player drives a car while typing exact text replies into a phone UI. The game is about split attention: the player must keep the car inside the lane, avoid obstacles, finish a message thread, and keep enough focus to reach the end before time runs out.

Important identity details:

- Technical repository/package slug: `text-drive`
- In-game title: `Text & Drive`
- Runtime target: browser
- Rendering/game framework: Phaser 3
- Language: TypeScript
- Bundler/dev server: Vite
- Game dimensions: fixed logical canvas of `900 x 540`, scaled with Phaser `FIT` and centered
- License model: source-available for viewing, learning, and portfolio review only; commercial use, redistribution, publishing, or monetization requires written permission
- Current product status: intentional prototype / playable vertical slice, not a finished commercial game

The project focuses on one complete core loop rather than a large system surface. It currently contains three authored levels in fixed order:

1. `first-date` - `Level 1: First Date`
2. `marriage` - `Level 2: Marriage`
3. `hospital` - `Level 3: Hospital`

## 2. Tech Stack And Commands

Main dependencies:

- `phaser` `^3.90.0`
- `typescript` `^5.9.0`
- `vite` `^5.4.0`

NPM scripts in `package.json`:

- `npm run dev` - starts the Vite dev server
- `npm run build` - runs `tsc` and then `vite build`
- `npm run preview` - serves the production build locally
- `npm run gh -- ...` - runs GitHub CLI through `scripts/invoke-gh.ps1` on Windows

Windows note:

- In PowerShell, `npm run build` may fail if script execution blocks `npm.ps1`.
- Use `npm.cmd run build` as the reliable Windows command.

TypeScript configuration:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `resolveJsonModule: true`, so JSON data can be imported directly
- `noEmit: true`; Vite handles output bundling
- Included source: `src`

Vite configuration:

- `base` is `process.env.VITE_BASE_PATH ?? "/"`
- This allows GitHub Pages builds to set a repository-relative base path.
- Dev server has `open: true`.

## 3. Repository Structure

High-level structure:

```text
.
|-- .cursor/
|   `-- rules/
|       `-- git-push-without-pr.mdc
|-- .github/
|   `-- workflows/
|       `-- deploy-pages.yml
|-- .vscode/
|   `-- settings.json
|-- docs/
|   `-- PROJECT_CONTEXT.md
|-- public/
|   `-- favicon.svg
|-- scripts/
|   `-- invoke-gh.ps1
|-- src/
|   |-- data/
|   |   |-- dialogue.json
|   |   `-- levels.json
|   |-- game/
|   |   |-- EndingScene.ts
|   |   |-- GameScene.ts
|   |   |-- LevelSelectScene.ts
|   |   |-- MainMenuScene.ts
|   |   |-- ResultScene.ts
|   |   |-- managers/
|   |   |   |-- DialogueManager.ts
|   |   |   |-- LevelManager.ts
|   |   |   |-- ProgressManager.ts
|   |   |   `-- RunScore.ts
|   |   |-- systems/
|   |   |   |-- DrivingSystem.ts
|   |   |   |-- ObstacleSystem.ts
|   |   |   |-- StressSystem.ts
|   |   |   `-- TypingSystem.ts
|   |   |-- types/
|   |   |   `-- LevelTypes.ts
|   |   `-- ui/
|   |       |-- ChatBubbleRow.ts
|   |       |-- GameplayLayout.ts
|   |       |-- GameplayPauseOverlay.ts
|   |       |-- LevelIntroOverlay.ts
|   |       |-- PhoneUI.ts
|   |       |-- UiFactory.ts
|   |       |-- UiTheme.ts
|   |       |-- messagePacing.ts
|   |       |-- narrativeLayout.ts
|   |       `-- typingHighlightLayout.ts
|   |-- main.ts
|   `-- style.css
|-- index.html
|-- LICENSE
|-- package-lock.json
|-- package.json
|-- README.md
|-- tsconfig.json
`-- vite.config.ts
```

Generated/ignored directories:

- `node_modules/` is dependency install output.
- `dist/` is production build output.
- Both are ignored by `.gitignore`.

## 4. App Entry Point

`src/main.ts` is the browser/game entry point.

It does the following:

- Imports Phaser.
- Imports global page CSS from `src/style.css`.
- Imports all Phaser scenes.
- Defines the fixed logical canvas size:
  - width: `900`
  - height: `540`
- Configures Phaser:
  - renderer: `Phaser.AUTO`
  - parent DOM element: `#app`
  - background color: `#111827`
  - scale mode: `Phaser.Scale.FIT`
  - auto center: `Phaser.Scale.CENTER_BOTH`
  - scene boot order:
    1. `MainMenuScene`
    2. `LevelSelectScene`
    3. `GameScene`
    4. `ResultScene`
    5. `EndingScene`
- Preloads the Inter and Teko font variants through `document.fonts.load`.
- Falls back silently if font loading fails.
- Instantiates `new Phaser.Game(config)` after font readiness or fallback.

`index.html` provides:

- The document title `Text & Drive`
- The favicon from `/favicon.svg`
- Google Fonts links for Inter and Teko
- A hidden text span to encourage browser font availability
- The `#app` mount element for Phaser
- A footer credit and Ko-fi link
- The module script `/src/main.ts`

`src/style.css` provides the browser page shell around the Phaser canvas:

- Full-viewport layout
- No body margin
- Hidden overflow
- `#app` fills available vertical space
- Footer remains visible below the game area
- Footer styling and link styling

## 5. Game Concept

Each level is one continuous run.

The player must:

- Move the mouse to steer the car laterally.
- Avoid falling obstacles on a vertically scrolling road.
- Read incoming phone messages.
- Type the exact expected reply into the phone UI.
- Press Enter to submit replies.
- Finish every prompt in the current dialogue thread.
- Keep the focus meter above zero.
- Finish before the level story timer reaches zero.

The key design tension is that the road needs visual and motor attention while the phone needs reading and typing attention.

The game deliberately checks typed replies only on Enter. It does not fail the player on every wrong character. While typing, characters are highlighted against the expected reply to show which characters match.

Reply matching uses:

- `trim()`
- `toLowerCase()`

This means leading/trailing spaces and letter case are ignored for final submit comparison. Internal punctuation, spaces, and words still matter.

## 6. Controls

Gameplay controls:

| Input | Scene/state | Action |
| --- | --- | --- |
| Mouse movement | Gameplay | Steer car toward pointer X within lane bounds |
| Typable character keys | Gameplay, compose active | Add character to reply |
| Backspace | Gameplay, compose active | Delete one character |
| Enter | Gameplay, compose active | Submit typed reply |
| Escape | Gameplay only | Toggle pause overlay |
| Space | Level intro overlay | Continue into gameplay |
| Enter | Level intro overlay | Continue into gameplay |
| Click | Level intro overlay | Continue into gameplay |
| Pointer/click on buttons | Menus/results/pause | Navigate between scenes |

Important input constraints:

- Typing is ignored before the current prompt's compose state is active.
- Typing is blocked while gameplay is paused.
- Escape pause only works in `GameScene` while `flowState` is `gameplay`.
- Pause is not active in menus, level intro, result, aftermath, or ending.

## 7. Full Game Flow

Primary user flow:

1. `MainMenuScene`
   - Shows the `Text & Drive` title, animated road backdrop, tagline, and `START`.
   - Clicking `START` opens `LevelSelectScene`.

2. `LevelSelectScene`
   - Shows all levels as cards.
   - Each card displays title, tone, and state.
   - States are `Completed`, `Unlocked`, or `Locked`.
   - Locked levels cannot be clicked.
   - Clicking an unlocked level starts `GameScene` with `{ startLevelId }`.

3. `GameScene` pre-level narration
   - Builds all gameplay systems and HUD.
   - Validates that the requested level is unlocked.
   - Configures the selected level.
   - Shows `LevelIntroOverlay`.
   - Player continues with Space, Enter, or click.

4. `GameScene` gameplay
   - Road scrolls.
   - Car follows mouse steering.
   - Obstacles spawn and move downward.
   - Incoming messages arrive according to pacing.
   - Reply hint appears after a delay.
   - Player types and submits replies.
   - Story timer counts down.
   - Focus drops after wrong submits or crashes under pressure.
   - Score changes throughout the run.

5. Successful completion
   - All replies have been submitted correctly.
   - Run score receives completion, time, and possibly no-crash bonuses.
   - Scene transitions to `ResultScene` with outcome `success`.
   - If a next level exists, its id is passed as `nextLevelId`.
   - If this was final level, `nextLevelId` is `null`.

6. Failure completion
   - Story timer reaches zero, or the focus meter reaches zero.
   - Scene transitions to `ResultScene` with outcome `failure`.
   - Failure reason is passed as either `out of story time` or `you lost focus`.
   - Failure aftermath text comes from dialogue data.

7. `ResultScene`
   - First phase: score summary.
   - Success marks level complete and records best score if better.
   - Failure shows existing best score without marking completion.
   - Player clicks `continue`.
   - Second phase: aftermath narrative from dialogue data.
   - Navigation buttons depend on outcome and whether a next level exists.

8. `EndingScene`
   - Only reached after final level success if player chooses `continue to ending`.
   - Shows final anti-texting-while-driving message.
   - Returns to main menu.

## 8. Scene Details

### 8.1 `MainMenuScene`

File: `src/game/MainMenuScene.ts`

Responsibilities:

- Draws main menu background and road-style perspective.
- Animates faint center dashes using a `Graphics` object in `update`.
- Displays large `Text & Drive` wordmark using Teko.
- Computes responsive title font size with `mainMenuTitlePx`.
- Shows tagline: `a game about texting while driving.`
- Creates a `START` button using `UiFactory.createButton`.
- Navigates to `LevelSelectScene`.

Important implementation details:

- Uses constants for menu layout, road line alpha, road vanish point, and button sizing.
- Uses `navLocked` to prevent double navigation from repeated pointer events.
- Avoids Phaser font shorthand for the title because Phaser can split font family strings incorrectly.

### 8.2 `LevelSelectScene`

File: `src/game/LevelSelectScene.ts`

Responsibilities:

- Loads level data from `src/data/levels.json`.
- Instantiates `ProgressManager`.
- Renders a heading `LEVEL SELECT`.
- Renders one card per level.
- Uses `ProgressManager.isUnlocked` and `ProgressManager.isCompleted`.
- Starts `GameScene` with `{ startLevelId: level.id }` when an unlocked card is clicked.
- Provides a `Back` button to return to `MainMenuScene`.

Card behavior:

- Completed: badge `Completed`, success color.
- Unlocked but incomplete: badge `Unlocked`, yellow-ish color.
- Locked: badge `Locked`, muted styling, non-interactive card.
- Locked subtitle says to finish the previous level.

### 8.3 `GameScene`

File: `src/game/GameScene.ts`

This is the core gameplay coordinator. It owns the run lifecycle and wires all systems together.

Key private state:

- `roadBounds` - left/right x positions for the drivable lane.
- `drivingSystem`
- `obstacleSystem`
- `typingSystem`
- `stressSystem`
- `phoneUI`
- `levelManager`
- `dialogueManager`
- `progressManager`
- `runScore`
- HUD objects:
  - top bar
  - level title
  - campaign progress text
  - focus text
  - score text
  - timer text
  - tone text
  - status text
  - hint card
  - back button
  - dialogue progress strip
- Run state:
  - `gameOver`
  - `transitioningLevel`
  - `remainingStorySeconds`
  - `crashCount`
  - `flowState`
  - `pendingFlowTimer`
  - `hintFaded`
  - `gameplayPaused`
  - `pauseOverlay`

`flowState` values:

- `preLevelNarration`
- `gameplay`
- `ending`

Creation flow:

1. Reset run state.
2. Compute gameplay layout with `computeGameplayLayout`.
3. Build HUD chrome.
4. Create driving system.
5. Create obstacle system.
6. Create phone UI.
7. Create run scoring.
8. Create typing system and connect correct-reply callback.
9. Create stress system.
10. Create managers.
11. Validate requested start level is unlocked.
12. Set current level if requested.
13. Configure level.
14. Apply HUD layout.
15. Attach Escape pause listener.
16. Attach resize listener.
17. Register shutdown cleanup.
18. Show level intro overlay.

Gameplay update loop:

- Returns early if game over, not in gameplay flow state, or paused.
- Updates driving.
- Updates obstacles with car bounds and road speed.
- Updates typing system.
- Decrements story timer while dialogue is incomplete.
- Ends run if story timer reaches zero.
- Polls typing incident queue.
- Applies wrong-submit penalty and stress incident for typing mistakes.
- Checks crash events from obstacle system.
- Applies crash penalty and stress incident only while typing system is under pressure.
- Updates HUD status, remaining focus, score, and timer.
- Ends the run when the internal stress count consumes all remaining focus.
- Handles success if typing is complete.

Pause behavior:

- Escape toggles pause only during gameplay.
- Pause sets `this.time.paused = true`.
- Pause calls `this.tweens.pauseAll()`.
- Pause blocks typing input.
- Pause pauses message-exchange timers.
- Resume reverses those operations.
- Pause overlay offers resume, level select, and main menu.
- Leaving through pause abandons the run without result flow.

Resize behavior:

- Recomputes gameplay layout.
- Updates road bounds.
- Relayouts driving system.
- Applies new phone UI layout.
- Re-applies HUD layout.
- Rebuilds pause overlay if currently paused.

End run behavior:

- Failure transitions after a short delayed call to `ResultScene`.
- `you lost focus` applies the internal overload score penalty.
- Failure result payload includes outcome, level id, title, score, reason, no next level, and failure aftermath text.

Success behavior:

- Adds level-complete points.
- Adds time bonus based on remaining story seconds.
- Adds no-crash bonus if `crashCount === 0`.
- Looks up next level id through `LevelManager`.
- Transitions to `ResultScene` with success aftermath text.

### 8.4 `ResultScene`

File: `src/game/ResultScene.ts`

Result scene data shape:

```ts
export type ResultSceneData = {
  outcome: "success" | "failure";
  levelId: string;
  levelTitle: string;
  score: number;
  reason?: string;
  nextLevelId: string | null;
  aftermathText: string;
};
```

Responsibilities:

- Displays result summary first.
- Then displays aftermath narrative.
- Updates saved progress and best scores.
- Offers navigation based on result state.

Phases:

- `result`
- `aftermath`

Result phase:

- Shows `level complete` for success, `run ended` for failure.
- Shows level title.
- Shows failure reason when available.
- Shows score.
- Shows best score.
- On success:
  - calls `ProgressManager.markCompleted(levelId)`
  - calls `ProgressManager.recordBestIfBetter(levelId, score)`
- On failure:
  - calls `ProgressManager.getBestScore(levelId)`
  - does not mark completion
  - does not record a new best score

Aftermath phase:

- Title is `what happened after` for success or `what followed` for failure.
- Body text is `aftermathText` from dialogue data.
- If no aftermath text exists, uses fallback paragraphs.
- Success with `nextLevelId`: buttons for `play next level`, `play again`, and `main menu`.
- Final success with `nextLevelId === null`: buttons for `continue to ending`, `play again`, and `main menu`.
- Failure: buttons for `play again` and `main menu`.
- Both phases include a top `level select` ghost button.

Double navigation protection:

- Uses `exiting` flag in `goScene` to prevent repeated pointerup events from starting multiple scenes.

### 8.5 `EndingScene`

File: `src/game/EndingScene.ts`

Responsibilities:

- Displays final brand line.
- Displays `Ending`.
- Displays final message.
- Provides `Main Menu` button.

Data shape:

```ts
type EndingSceneData = {
  finalMessage?: string;
};
```

Default final message:

```text
You reached the hospital parking lot.
The phone finally stops vibrating.
Silence feels heavier than speed.
```

When reached through final success in `ResultScene`, the passed final message is:

```text
you made it to the end of the road.
but every message demanded attention that driving needed.
no reply is worth a life.
```

## 9. Data Model

### 9.1 Level Types

File: `src/game/types/LevelTypes.ts`

```ts
export type LevelConfig = {
  id: string;
  title: string;
  tone: string;
  introNarration: string[];
  roadSpeed: number;
  obstacleSpeed: number;
  obstacleSpawnMs: number;
  maxStress: number;
  storyTimeSeconds: number;
};

export type DialoguePrompt = {
  incoming: string;
  reply: string;
};

export type DialogueBlock = {
  outro: string;
  outcome: {
    success: string;
    failure: string;
  };
  prompts: DialoguePrompt[];
};
```

`LevelConfig` controls both presentation and tuning:

- `id` must be stable and unique.
- `title` is shown in level select, HUD, intro, and results.
- `tone` is displayed in level select and HUD.
- `introNarration` is the pre-level narration.
- `roadSpeed` controls lane marker scrolling and contributes to obstacle downward motion.
- `obstacleSpeed` controls obstacle downward speed.
- `obstacleSpawnMs` controls obstacle spawn cadence.
- `maxStress` is the internal incident allowance used to derive the visible focus meter.
- `storyTimeSeconds` is the whole-level countdown.

`DialoguePrompt` controls each exchange:

- `incoming` is the partner message.
- `reply` is the exact expected player reply after trim and case normalization.

`DialogueBlock` controls one level's conversation:

- `prompts` are completed in array order.
- `outro` exists in data but is not currently used by result flow.
- `outcome.success` is the success aftermath.
- `outcome.failure` is the failure aftermath.

### 9.2 Level Data

File: `src/data/levels.json`

Current levels:

| id | title | tone | roadSpeed | obstacleSpeed | obstacleSpawnMs | maxStress | storyTimeSeconds |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| `first-date` | `Level 1: First Date` | `casual, short, forgiving` | 222 | 238 | 1340 | 5 | 118 |
| `marriage` | `Level 2: Marriage` | `formal, longer, demanding` | 246 | 270 | 1080 | 4 | 148 |
| `hospital` | `Level 3: Hospital` | `short, heavy, oppressive` | 262 | 292 | 980 | 3 | 120 |

Difficulty ramps through:

- Higher road speed.
- Higher obstacle speed.
- Faster obstacle spawn cadence.
- Smaller focus allowance (implemented by lowering `maxStress`).
- Heavier narrative tone.

### 9.3 Dialogue Data

File: `src/data/dialogue.json`

Top-level shape:

```ts
Record<string, DialogueBlock>
```

Keys must match level ids in `levels.json`.

Current prompt counts:

- `first-date`: 8 prompts
- `marriage`: 9 prompts
- `hospital`: 8 prompts

Dialogue style:

- Mostly lowercase.
- Light punctuation.
- Short replies under pressure.
- Narrative stakes rise from dating, to family/marriage logistics, to hospital urgency.

Authored level ids must stay aligned across:

- `src/data/levels.json`
- `src/data/dialogue.json`
- `src/game/ui/messagePacing.ts`
- Saved progress state in `localStorage`
- Any scene payloads using `startLevelId`, `levelId`, or `nextLevelId`

If a level id changes, update all references and consider migration for existing saves.

## 10. Managers

### 10.1 `LevelManager`

File: `src/game/managers/LevelManager.ts`

Purpose:

- Owns current level index for a gameplay session.
- Provides current level and navigation helpers.

Key methods:

- `setCurrentById(levelId)`
  - Finds level index by id.
  - Falls back to index `0` if id is missing.
- `getCurrentLevel()`
- `getCurrentLevelNumber()`
  - 1-based display index.
- `getTotalLevels()`
- `hasNextLevel()`
- `getNextLevelId()`
  - Returns next id or `null`.
- `advanceLevel()`
  - Increments index if possible.
  - Not currently central to result navigation.

### 10.2 `DialogueManager`

File: `src/game/managers/DialogueManager.ts`

Purpose:

- Wraps dialogue JSON access.
- Throws useful errors when a level has no dialogue block.

Key methods:

- `getOutro(levelId)`
- `getOutcomeText(levelId, outcome)`
- `getPrompts(levelId)`

Important detail:

- `getOutro` exists, but current flow uses `outcome.success` and `outcome.failure` for result aftermath. If another AI is looking for outro display behavior, it is not currently wired into the user-facing result flow.

### 10.3 `ProgressManager`

File: `src/game/managers/ProgressManager.ts`

Purpose:

- Manages local progress in browser `localStorage`.
- Enforces linear unlocks.
- Records best successful score per level.
- Migrates older save formats.

Current storage key:

- `text-drive-progress-v2`

Legacy storage key:

- `text-drive-progress-v1`

Current state shape:

```ts
type ProgressStateV2 = {
  version: 2;
  completed: string[];
  bestScores: Record<string, number>;
};
```

Legacy v1 shape:

```ts
type LegacyProgressState = {
  unlocked?: string[];
  completed: string[];
};
```

Unlock logic:

- First level is always unlocked.
- For each completed level at index `i`, level `i + 1` is unlocked.
- Unlocks are derived from completions, not stored directly in v2.

Completion normalization:

- Invalid level ids are dropped.
- Completed ids are reordered to match `levels.json`.
- Out-of-order completions are dropped so progression remains sequential.
- Example: if save claims level 2 complete without level 1, level 2 completion is discarded.

Best score handling:

- Best scores are stored only for valid level ids.
- Scores must be finite, non-negative numbers.
- Scores are floored.
- `recordBestIfBetter` only updates if new score is greater than previous.
- Failed runs do not call `recordBestIfBetter`.

Legacy level-3 migration:

- Older saves may contain a prior level-3 slug.
- The source stores the old slug as base64 in `legacyLevel3SlugForMigration`.
- It decodes to the old id at runtime when `atob` exists.
- Migration maps that old id to `hospital`.
- Best scores are merged by taking the max.

Notable methods:

- `load()`
- `save(state)`
- `getUnlockedIds()`
- `isUnlocked(levelId)`
- `isCompleted(levelId)`
- `markCompleted(levelId)`
- `getBestScore(levelId)`
- `recordBestIfBetter(levelId, score)`
- `getFirstUnlockedLevelId()`
- `getPreferredPlayLevelId()`

`getFirstUnlockedLevelId` and `getPreferredPlayLevelId` exist for convenience but are not the main level select flow right now.

### 10.4 `RunScore`

File: `src/game/managers/RunScore.ts`

Purpose:

- Owns score for the current run.
- Keeps score non-negative on penalties.

Scoring constants:

| Event | Score change |
| --- | ---: |
| Correct reply | `+100` |
| Level complete | `+250` |
| Time bonus | `+2` per full remaining second |
| No-crash bonus | `+120` |
| Wrong submit | `-45` |
| Crash | `-35` |
| Overload | `-50` |

Key methods:

- `reset()`
- `getScore()`
- `addCorrectReply()`
- `addLevelComplete()`
- `addTimeBonus(remainingStorySeconds)`
- `addNoCrashBonus()`
- `penalizeWrongSubmit()`
- `penalizeCrash()`
- `penalizeOverload()`

## 11. Core Gameplay Systems

### 11.1 `DrivingSystem`

File: `src/game/systems/DrivingSystem.ts`

Purpose:

- Draws the road, lane edges, lane markers, and player car.
- Scrolls lane markers to create road motion.
- Smoothly steers the car toward the mouse pointer.
- Applies temporary steering delay during stress incidents.

Visual objects:

- Road fill rectangle.
- Left and right road edge rectangles.
- Center lane marker rectangles.
- Car rectangle.

Depths:

- Road: `0`
- Lane markers: `1`
- Car: `3`

Car:

- Rectangle size: `52 x 92`
- Color: `0x38bdf8`
- Initial Y: `height - 72`
- X clamped inside road bounds with `carLaneInset = 28`

Road:

- Fill color: `0x1f2937`
- Edge color: `0xf8fafc`
- Markers:
  - spacing: `90`
  - height: `56`
  - width: `10`

Steering constants are grouped in `STEERING`:

- `mouseDeadZonePx: 4`
- `lateralAccelPerPx: 44`
- `maxLateralAccel: 880`
- `maxLateralSpeed: 720`
- `lateralDragPerSec: 5.5`
- `stressAccelMultiplier: 0.78`
- `edgeSoftMarginPx: 40`
- `edgeOutwardDragPerSec: 14`

Steering behavior:

- Mouse X is clamped to road bounds.
- Position error drives lateral acceleration.
- Small mouse error inside dead zone is ignored.
- Velocity uses exponential drag.
- Velocity and position are clamped.
- Edge outward drag reduces sliding into lane bounds.

Stress steering delay:

- `applySteeringDelay(durationSeconds)` sets a timer.
- During delay, steering target updates only every `0.12` seconds.
- Acceleration gain and max acceleration are reduced by `stressAccelMultiplier`.

Important debugging/tuning file:

- Steering feel should be tuned in the `STEERING` object only.

### 11.2 `ObstacleSystem`

File: `src/game/systems/ObstacleSystem.ts`

Purpose:

- Spawns obstacles.
- Moves obstacles downward.
- Detects collisions with the car.
- Emits crash events consumed by `GameScene`.
- Temporarily speeds obstacles after stress incidents.

Obstacle:

- Phaser rectangle.
- Size: `42 x 80`
- Color: `0xf97316`
- Spawn Y: `-50`
- Spawn X: random between `roadBounds.left + 30` and `roadBounds.right - 30`
- Depth: `2`

Movement:

- Each obstacle moves by `(obstacleSpeed * speedBoostMultiplier + roadSpeed) * deltaSeconds`.
- This means both level obstacle speed and visual road speed contribute to downward motion.

Spawn timing:

- `elapsedSinceSpawn` accumulates milliseconds.
- A new obstacle spawns when elapsed exceeds `spawnTimerMs`.
- `configureLevel(obstacleSpeed, spawnTimerMs)` sets level-specific values.

Collision behavior:

- Uses `Phaser.Geom.Intersects.RectangleToRectangle`.
- On collision:
  - Sets internal `crashed = true`.
  - Destroys the colliding obstacle.
  - Removes it from the obstacle array.
  - Starts `crashCooldownSeconds = 0.8`.
  - Flashes camera red/yellow.
- `consumeCrashEvent()` returns true once and clears `crashed`.

Stress speed boost:

- `applyTemporarySpeedIncrease(durationSeconds, multiplier = 1.18)`
- `StressSystem` currently calls it with `1.2` seconds and multiplier `1.14`.

Reset:

- `resetForLevel()` clears timers, crash state, speed boost, cooldown, and destroys all existing obstacles.

### 11.3 `TypingSystem`

File: `src/game/systems/TypingSystem.ts`

Purpose:

- Manages dialogue prompt progression.
- Controls when messages appear.
- Controls compose active state.
- Tracks typed value.
- Validates submitted replies.
- Sends incidents for wrong replies.
- Updates `PhoneUI`.

Reply comparison:

```ts
value.trim().toLowerCase()
```

Incident type:

```ts
export type TypingFailureReason = "wrong_input";
export type TypingIncident = {
  reason: TypingFailureReason;
};
```

Important state:

- `prompts`
- `currentIndex`
- `typedValue`
- `completedCount`
- `completed`
- `incidentQueue`
- `onCorrectReply`
- `pacing`
- `composeActive`
- `exchangeGeneration`
- delayed timer handles for message flow
- `gameplayInputBlocked`

Message flow for each prompt:

1. `loadPrompt(index)`
2. Clear previous timers.
3. Increment `exchangeGeneration`.
4. Set compose inactive.
5. Clear reply hint and typed display.
6. Set status `incoming...`
7. Wait `pacing.incomingDelayMs`.
8. Optionally show typing indicator for `pacing.typingIndicatorMs`.
9. Append partner message.
10. Set status `read the message`.
11. Wait `pacing.hintDelayMs`.
12. Show reply hint.
13. Set compose active.
14. Set status `type while driving`.

Correct Enter behavior:

- Cancels exchange timers.
- Sets compose inactive.
- Clears hint and typed display.
- Increments `completedCount`.
- Calls `onCorrectReply`.
- If all prompts complete:
  - waits `sendBeatMs`
  - appends player message
  - sets `completed = true`
  - status `all messages sent`
- If prompts remain:
  - status `sending...`
  - waits `sendBeatMs`
  - appends player message
  - status `sent`
  - waits next incoming delay with small random jitter
  - loads next prompt

Wrong Enter behavior:

- Sets phone status `wrong reply press enter to try again`.
- Pushes `{ reason: "wrong_input" }` into `incidentQueue`.
- Does not clear typed value.
- Does not advance prompt.

Backspace behavior:

- Deletes last character.
- Refreshes typed display.
- Sets status `edit anytime`.

Typing character behavior:

- Accepts single-character keys only.
- Ignores Ctrl/Meta/Alt combinations.
- Prevents browser default.
- Appends raw key value.
- Refreshes highlight display.
- Sets status `press enter when ready`.

Pause handling:

- `setGameplayInputBlocked(true)` ignores input.
- `setExchangeTimersPaused(true)` pauses Phaser timer events rather than removing them.

Generation guard:

- `exchangeGeneration` prevents stale delayed callbacks from a previous prompt/exchange from mutating the current UI.

### 11.4 `StressSystem`

File: `src/game/systems/StressSystem.ts`

Purpose:

- Tracks stress for the current level.
- Applies incident effects across driving, obstacles, phone UI, and camera.
- Reports overload.

Stress incidents:

- Typing wrong input.
- Crash while typing system is under pressure.

State:

- `maxStress`
- `stress`

`configureLevel(maxStress)` sets level cap.

`reset()` sets stress to zero.

`applyIncident(reason)`:

- Adds `1` stress.
- Applies steering delay for `0.95` seconds.
- Applies temporary obstacle speed increase for `1.2` seconds at multiplier `1.14`.
- Vibrates phone UI for `0.55` seconds.
- Shakes camera for `170ms` at intensity `0.0038`.
- If reason is `wrong_input`, phone status becomes `wrong send try again`.
- Otherwise phone status becomes `near miss stay in lane`.

`isOverloaded()`:

- Returns true when `stress >= maxStress`.

Important behavior:

- Because overload uses `>=`, reaching the displayed cap ends the run.

## 12. UI System

### 12.1 `UiTheme`

File: `src/game/ui/UiTheme.ts`

Purpose:

- Central source for colors, fonts, font sizes, button colors, and narrative spacing.

Fonts:

- `fontFamily`: `Inter, system-ui, sans-serif`
- `fontDisplay`: `Teko, sans-serif`

Main colors:

- `bg`: `#020617`
- `panel`: `#0f172a`
- `panelStroke`: `#334155`
- `title`: `#e2e8f0`
- `body`: `#cbd5e1`
- `muted`: `#94a3b8`
- `accent`: `#93c5fd`
- `stress`: `#fca5a5`
- `success`: `#86efac`
- `warn`: `#fb923c`
- `danger`: `#f87171`
- `replyHint`: `#94a3b8`
- `typedCorrect`: `#f1f5f9`
- `typedWrong`: `#f87171`
- `typedCursor`: `#64748b`
- `menuTagline`: `#64748b`

Button presets:

- primary: fill `0x1d4ed8`, stroke `0x93c5fd`
- secondary: fill `0x334155`, stroke `0x64748b`
- ghost: fill `0x1e293b`, stroke `0x475569`

### 12.2 `UiFactory`

File: `src/game/ui/UiFactory.ts`

Purpose:

- Creates reusable panels and buttons.

Exports:

- `ButtonVariant = "primary" | "secondary" | "ghost"`
- `UiFactory.createPanel`
- `UiFactory.createButton`
- `UiFactory.createButtonInContainer`

Button behavior:

- Rectangle background is interactive.
- Text is a separate object.
- Hover scales to `1.02`.
- Pointer down scales to `0.98`.
- Pointer up scales to `1.02` and calls callback.
- Background owns a destroy handler that destroys the text label.
- Container version parents both background and label to a supplied container.

Design detail:

- Text is separate from hit rectangle to avoid container hit-area issues under scale.

### 12.3 `GameplayLayout`

File: `src/game/ui/GameplayLayout.ts`

Purpose:

- Computes responsive gameplay layout from Phaser scale dimensions.

Exports:

- `PhoneLayout`
- `GameplayLayoutMetrics`
- `computeGameplayLayout(scale)`

Layout zones:

- Left hint card zone.
- Center road zone.
- Right phone zone.
- Top HUD bar.

Depth constants:

- HUD: `10`
- Header: `11`
- Phone: `20`

Important outputs:

- `marginX`
- `marginY`
- `topBarTop`
- `topBarH`
- `hintCard`
- `road.left`
- `road.right`
- `phone.centerX`
- `phone.centerY`
- `phone.width`
- `phone.height`

Responsive constraints:

- `marginX` based on width, clamped `8..18`.
- `marginY` based on height, clamped `8..14`.
- `topBarH = 56`.
- Hint width clamped `118..172`.
- Phone width clamped `232..288`.
- Minimum road width `150`.
- Phone height clamped `280..420`.

### 12.4 `PhoneUI`

File: `src/game/ui/PhoneUI.ts`

Purpose:

- Draws and manages the phone/chat UI.
- Stores chat history.
- Shows partner/player bubbles.
- Shows typing indicator.
- Shows reply hint.
- Shows typed character highlights.
- Shows status text.
- Provides vibration/flash feedback.

Major objects:

- Outer phone frame.
- Header bar and `messages` label.
- Thread clipping root.
- Geometry mask graphics for thread viewport.
- Thread content container.
- Input panel.
- Input label `your reply`.
- Reply hint container.
- Typed line container.
- Status text.
- Vibration overlay.
- Root container.

Important geometry:

- Phone layout comes from `GameplayLayout`.
- Header height is `40`.
- Input panel height is clamped based on phone height: `120..168`.
- Thread viewport fills space between header and input panel.
- Thread content scrolls to bottom as messages are added.

Mask implementation detail:

- `threadMaskGraphics` is created manually rather than added to the display list.
- Geometry mask is world-aligned using `threadClipRoot.getWorldTransformMatrix`.
- This exists because nested Graphics masks can stencil incorrectly if Phaser applies parent transforms unexpectedly.

Chat history:

```ts
type ChatHistoryEntry = { kind: "partner" | "player"; body: string };
```

Messages are normalized before display:

- `trim()`
- `toLowerCase()`

Reply hint:

- Strong alpha: `0.55`
- Faded alpha after typing begins: `0.27`
- Hint uses monospace wrapping from `typingHighlightLayout`.

Typed display:

- Empty input shows `_` cursor.
- Typed characters are laid out against expected reply geometry.
- Matching chars use `typedCorrect`.
- Non-matching chars use `typedWrong`.

Vibration:

- Tweens root container x between `-5` and `5`.
- Repeats based on duration.
- Tweens a light overlay alpha.
- Resets container x to `0` on completion.

### 12.5 `ChatBubbleRow`

File: `src/game/ui/ChatBubbleRow.ts`

Purpose:

- Creates partner bubbles, player bubbles, and typing indicator rows.

Bubble implementation:

- Uses Phaser `Graphics` to draw rounded rectangle from arcs and rect lines.
- Does not use an external rounded rectangle plugin.

Shared constants:

- Inner padding: `10`
- Row tail gap: `6`
- Max bubble width fraction: `0.76` of thread width
- Corner radius: `10`

Partner bubble:

- Left aligned.
- Fill `0x1e293b`.
- Stroke `0x475569`.
- Text color from theme body.

Player bubble:

- Right aligned.
- Fill `0x1d4ed8`.
- Stroke `0x60a5fa`.
- Text color `#eff6ff`.

Typing row:

- Text `typing...` in muted italic style.

### 12.6 `typingHighlightLayout`

File: `src/game/ui/typingHighlightLayout.ts`

Purpose:

- Provides monospace layout helpers for reply hints and typed character highlights.
- Ensures typed characters sit on the same visual grid as the expected reply hint.

Key behaviors:

- Per-index comparison is case-insensitive.
- Characters beyond expected length are wrong.
- Adjacent characters with the same color are merged into text segments.
- Word-aware wrapping is used where possible.
- Long tokens are hard-wrapped when they exceed line budget.
- Text past the expected reply length continues from the end of expected geometry.

Important exports:

- `charsMatchForHighlight`
- `buildCharCells`
- `mergeCellsToSegments`
- `wrapMonospaceStringToLines`
- `positionForStringIndex`
- `positionAfterExpected`
- `layoutTypedCellsWithExpectedGeometry`
- `layoutCellsAsPlacedSegments`

Debugging tip:

- If typed highlighting looks misaligned, inspect `monoCharW`, `monoLineH`, `wrapMonospaceStringToLines`, and `layoutTypedCellsWithExpectedGeometry`.

### 12.7 `messagePacing`

File: `src/game/ui/messagePacing.ts`

Purpose:

- Defines chat exchange timing by level.

Type:

```ts
export type MessagePacing = {
  incomingDelayMs: number;
  hintDelayMs: number;
  sendBeatMs: number;
  nextIncomingMs: number;
  typingIndicatorMs: number;
};
```

Default pacing:

| field | value |
| --- | ---: |
| incomingDelayMs | 520 |
| hintDelayMs | 680 |
| sendBeatMs | 240 |
| nextIncomingMs | 1100 |
| typingIndicatorMs | 420 |

Level pacing:

| level | incomingDelayMs | hintDelayMs | sendBeatMs | nextIncomingMs | typingIndicatorMs |
| --- | ---: | ---: | ---: | ---: | ---: |
| `first-date` | 450 | 600 | 210 | 980 | 400 |
| `marriage` | 520 | 640 | 240 | 1050 | 420 |
| `hospital` | 300 | 400 | 170 | 720 | 280 |

Debugging tip:

- If a new level id is added but no pacing is added, it will use default pacing.

### 12.8 `narrativeLayout`

File: `src/game/ui/narrativeLayout.ts`

Purpose:

- Wraps narrative text using live Phaser text metrics instead of relying on Phaser `wordWrap`.
- Helps intro and result text look intentional and readable.

Key details:

- Max narrative column width: `580`.
- Uses offscreen text probe at `-10000, -10000`.
- Wraps by words.
- Hard-wraps long words when necessary.
- Balances short orphan last lines by moving one word from the previous line when both lines fit.
- Joins separate paragraph strings with blank lines.

Exports:

- `NARRATIVE_MAX_WIDTH`
- `getNarrativeColumnWidth`
- `wrapParagraphToLines`
- `formatNarrativeBody`

### 12.9 `LevelIntroOverlay`

File: `src/game/ui/LevelIntroOverlay.ts`

Purpose:

- Full-screen pre-level narrative overlay.
- Fades in.
- Waits for Space, Enter, or click.
- Fades out and calls `onComplete`.
- Optionally offers back to level select.

Options:

```ts
export type LevelIntroOverlayOptions = {
  title: string;
  lines: string[];
  onComplete: () => void;
  onBack?: () => void;
};
```

Behavior:

- Background is a near-opaque rectangle over gameplay.
- Uses narrative layout helpers for body text.
- Has a minimum dismiss delay of `150ms`.
- Tracks phase:
  - `entering`
  - `ready`
  - `dismissing`
- Detaches keyboard and pointer handlers when dismissing.

### 12.10 `GameplayPauseOverlay`

File: `src/game/ui/GameplayPauseOverlay.ts`

Purpose:

- Minimal pause menu shown during gameplay.

Options:

```ts
export type GameplayPauseOverlayOptions = {
  onResume: () => void;
  onLevelSelect: () => void;
  onMainMenu: () => void;
};
```

Behavior:

- Adds dim backdrop.
- Consumes pointer events behind overlay.
- Adds compact panel with title `paused`.
- Adds buttons:
  - `resume`
  - `level select`
  - `main menu`
- Root depth is `200`.
- `destroy()` destroys root container and children.

## 13. HUD And Gameplay Layout Details

The gameplay HUD is built in `GameScene.buildHudChrome` and positioned in `GameScene.applyHudLayout`.

Top bar includes:

- Back hitbox and label.
- Level title.
- Campaign progress text, e.g. `1/3`.
- Remaining focus text, e.g. `focus 5/5`.
- Score text.
- Timer text.
- Status text.
- Dialogue progress strip.

Dialogue progress strip:

- Tracks completed replies for current level, not campaign progress.
- Filled width is `completed / total`.
- Label displays `completed / total` only if track is wide enough.
- It updates on correct replies and layout changes.

Timer coloring:

- Above 22 seconds: stress color.
- 22 seconds or less: warn color.
- 12 seconds or less: danger color.

Hint card:

- Shows control reminder.
- Fades to alpha `0.52` once gameplay begins.

Back behavior:

- `left levels` style label in source text is intended as a back-to-levels control.
- Clicking it exits to `LevelSelectScene`.
- This abandons current run and does not show result flow.

## 14. Level Content Summary

### 14.1 `first-date`

Title:

- `Level 1: First Date`

Tone:

- `casual, short, forgiving`

Intro:

- Player is driving to meet a date for the first time.
- The phone keeps lighting up.
- The situation is bright and fragile.

Tuning:

- Road speed: `222`
- Obstacle speed: `238`
- Obstacle spawn: `1340ms`
- Focus allowance (`maxStress`): `5`
- Story time: `118s`

Dialogue purpose:

- Short, casual replies.
- Teaches the mechanic with a forgiving focus allowance and slower obstacle pressure.
- Prompts include location, closeness, clothes, nerves, drink preference, and safe driving.

Expected replies include:

- `otw`
- `few minutes`
- `blue jacket`
- `almost there`
- `same here`
- `coffee please`
- `im pulling in now`

Note:

- `almost there` appears as an expected reply more than once.

### 14.2 `marriage`

Title:

- `Level 2: Marriage`

Tone:

- `formal, longer, demanding`

Intro:

- The relationship is years in.
- Messages are about time and showing up.
- Every line is heavier because the couple already knows each other well.

Tuning:

- Road speed: `246`
- Obstacle speed: `270`
- Obstacle spawn: `1080ms`
- Focus allowance (`maxStress`): `4`
- Story time: `148s`

Dialogue purpose:

- Longer replies.
- More domestic logistics.
- More emotional pressure.
- Introduces messages about kids, sitter, Saturday, mother calling, groceries, and getting home safe.

Expected replies include:

- `more like seven ten`
- `tell them im bringing pizza`
- `yes she can stay later`
- `i know, just let me get home`
- `i remember, we will talk tonight`
- `i will call her after dinner`
- `i will try`
- `gonna stop by store`
- `i love you too`

### 14.3 `hospital`

Title:

- `Level 3: Hospital`

Tone:

- `short, heavy, oppressive`

Intro:

- Player is driving to the hospital again.
- Texts are short because there is little room for small talk.
- The player hopes the words still reach her.

Tuning:

- Road speed: `262`
- Obstacle speed: `292`
- Obstacle spawn: `980ms`
- Focus allowance (`maxStress`): `3`
- Story time: `120s`

Dialogue purpose:

- Urgent and emotionally heavy.
- Replies remain relatively short but stakes are high.
- Final level has the smallest focus allowance and fastest pacing.

Expected replies include:

- `five minutes maybe less`
- `tell her im almost there`
- `is the doctor with her?`
- `please keep talking to her`
- `tell her i love her`
- `im leaving the car and running`
- `im pulling in`
- `im coming`

## 15. Persistence And Unlocking

Persistence is browser-local only. There are no accounts, no backend, and no cloud sync.

Storage key:

```text
text-drive-progress-v2
```

Current saved shape:

```json
{
  "version": 2,
  "completed": ["first-date"],
  "bestScores": {
    "first-date": 1435
  }
}
```

Unlocking:

- Level 1 is always unlocked.
- Level 2 unlocks when level 1 is completed.
- Level 3 unlocks when level 2 is completed.
- Completion must be sequential.

When saves are loaded:

- Unknown completed ids are removed.
- Known ids are sorted by level order.
- Out-of-sequence completions are trimmed.
- Best scores are sanitized to valid, non-negative, finite integers.

When a level is completed:

- `ResultScene` calls `markCompleted`.
- Completion can unlock the next level.
- `ResultScene` records best score if the run was successful and score beats prior best.

When a level fails:

- Completion is not marked.
- Best score is not updated.

Migration:

- v2 saves may contain a legacy level-3 id.
- v1 saves may contain old completed ids.
- Legacy level-3 id is mapped to `hospital`.
- Existing best score for the old id is merged into `hospital` using the larger value.

Debugging saves:

- Use browser devtools.
- Inspect Local Storage for the app origin.
- Delete `text-drive-progress-v2` to reset progress.
- If testing migration, also inspect `text-drive-progress-v1`.

## 16. Build And Deployment

Local build:

```bash
npm.cmd run build
```

Expected result:

- TypeScript checks pass.
- Vite production build completes.
- `dist/` is generated.
- Vite may warn that the Phaser bundle chunk is larger than 500 kB.

The large chunk warning is currently expected because Phaser is bundled into the app. It is not a build failure.

GitHub Pages deploy:

- Workflow file: `.github/workflows/deploy-pages.yml`
- Trigger:
  - push to `main`
  - manual `workflow_dispatch`
- Runner: `ubuntu-latest`
- Node version: `20`
- Install command: `npm ci`
- Build command: `npm run build`
- Build env:
  - `VITE_BASE_PATH: /${{ github.event.repository.name }}/`
- Artifact path: `./dist`
- Deploy action: `actions/deploy-pages@v4`

The repo also has `.cursor/rules/git-push-without-pr.mdc`, which says:

- When asked to commit/push, push to the current branch.
- Do not open a PR unless explicitly requested.
- `main` is not branch-protected for this project.

## 17. GitHub CLI Helper

File: `scripts/invoke-gh.ps1`

Purpose:

- Runs GitHub CLI with a full Windows PATH.
- Helpful because some automation shells omit machine-level PATH entries.

Behavior:

- Reads Machine and User PATH.
- Locates `gh`.
- Falls back to `C:\Program Files\GitHub CLI\gh.exe`.
- Errors if GitHub CLI is missing.
- Invokes `gh` with passed arguments.

Package script:

```bash
npm run gh -- ...
```

## 18. Debugging Guide

### 18.1 App does not boot

Check:

- `index.html` includes `<div id="app"></div>`.
- `src/main.ts` parent is `app`.
- Browser console for TypeScript/runtime errors.
- Vite base path if deployed under GitHub Pages.
- Font loading should not block boot permanently because errors are caught.

Relevant files:

- `index.html`
- `src/main.ts`
- `vite.config.ts`

### 18.2 Canvas size or layout looks wrong

Check:

- Phaser scale config in `src/main.ts`.
- Browser page CSS in `src/style.css`.
- Gameplay layout math in `src/game/ui/GameplayLayout.ts`.
- Scene resize handling in `GameScene.handleResize`.
- Phone relayout in `PhoneUI.applyLayout`.

Common issue:

- UI positions are derived from Phaser scale width/height, not CSS pixels directly.

### 18.3 Level is locked unexpectedly

Check:

- `ProgressManager.isUnlocked`.
- Saved `completed` array in `localStorage`.
- Level ids in `levels.json`.
- Whether completions are sequential.

Relevant file:

- `src/game/managers/ProgressManager.ts`

### 18.4 Level starts at wrong id

Check:

- `LevelSelectScene` passes `{ startLevelId: level.id }`.
- `GameScene.create` validates unlock before setting level.
- `LevelManager.setCurrentById` falls back to first level if id not found.
- Level id exists in `levels.json`.

Relevant files:

- `src/game/LevelSelectScene.ts`
- `src/game/GameScene.ts`
- `src/game/managers/LevelManager.ts`

### 18.5 Dialogue missing or crashes on start

Check:

- `dialogue.json` has a top-level key matching the level id.
- `DialogueManager.getBlock` throws if missing.
- Each prompt has both `incoming` and `reply`.

Relevant files:

- `src/data/dialogue.json`
- `src/data/levels.json`
- `src/game/managers/DialogueManager.ts`

### 18.6 Reply is rejected unexpectedly

Check:

- Expected reply in `dialogue.json`.
- Normalization only trims and lowercases.
- Internal spaces and punctuation must match.
- Compose must be active before input is accepted.
- Enter submits only after hint reveal activates compose state.

Relevant files:

- `src/game/systems/TypingSystem.ts`
- `src/game/ui/PhoneUI.ts`
- `src/game/ui/typingHighlightLayout.ts`

### 18.7 Typing highlight looks wrong

Check:

- `PhoneUI.refreshMonoMetrics`.
- `wrapMonospaceStringToLines`.
- `layoutTypedCellsWithExpectedGeometry`.
- Expected reply geometry and overflow positioning.
- Font metrics for `Consolas, monospace`.

Relevant files:

- `src/game/ui/PhoneUI.ts`
- `src/game/ui/typingHighlightLayout.ts`

### 18.8 Phone bubbles disappear or clipping is wrong

Check:

- `PhoneUI.applyThreadViewportMask`.
- `syncThreadMaskGraphicsWorld`.
- Thread mask graphics are world-aligned manually.
- Thread content container mask is cleared and recreated on relayout.

Relevant file:

- `src/game/ui/PhoneUI.ts`

### 18.9 Obstacles feel too hard or too easy

Tune:

- `obstacleSpeed`
- `obstacleSpawnMs`
- `roadSpeed`
- stress speed boost duration/multiplier

Relevant files:

- `src/data/levels.json`
- `src/game/systems/ObstacleSystem.ts`
- `src/game/systems/StressSystem.ts`

### 18.10 Steering feels wrong

Tune only the `STEERING` object in `DrivingSystem.ts`.

Relevant parameters:

- Dead zone.
- Acceleration gain.
- Max acceleration.
- Max lateral speed.
- Drag.
- Stress acceleration multiplier.
- Edge soft margin.
- Edge outward drag.

Relevant file:

- `src/game/systems/DrivingSystem.ts`

### 18.11 Focus or failure behavior is surprising

Check:

- Wrong submits push typing incidents.
- Crashes only increase stress if `typingSystem.isUnderPressure()` is true.
- Overload is `stress >= maxStress`.
- The player-facing reason `you lost focus` applies the internal overload score penalty before the result scene.
- Story timer failure reason is `out of story time`.

Relevant files:

- `src/game/GameScene.ts`
- `src/game/systems/StressSystem.ts`
- `src/game/systems/TypingSystem.ts`
- `src/game/systems/ObstacleSystem.ts`

### 18.12 Score or best score seems wrong

Check:

- `RunScore` constants.
- Correct replies add points immediately.
- Wrong submits and crashes subtract points but never below zero.
- Completion adds completion, time, and no-crash bonuses.
- Failure does not record best score.
- Success records best score only if higher.

Relevant files:

- `src/game/managers/RunScore.ts`
- `src/game/ResultScene.ts`
- `src/game/managers/ProgressManager.ts`

### 18.13 Pause does not behave as expected

Check:

- Escape listener in `GameScene.onPauseKey`.
- Pause only works in `flowState === "gameplay"`.
- Pause sets `time.paused`, pauses all tweens, blocks typing input, and pauses typing timers.
- Level select/main menu from pause abandons run.

Relevant files:

- `src/game/GameScene.ts`
- `src/game/ui/GameplayPauseOverlay.ts`
- `src/game/systems/TypingSystem.ts`

### 18.14 Build fails in PowerShell

If error says `npm.ps1 cannot be loaded because running scripts is disabled`, use:

```bash
npm.cmd run build
```

This is a Windows execution policy issue, not necessarily an app issue.

## 19. Extension Guide

### 19.1 Add a new level

Minimum steps:

1. Add a new `LevelConfig` entry to `src/data/levels.json`.
2. Add a matching dialogue block in `src/data/dialogue.json`.
3. Add optional pacing in `src/game/ui/messagePacing.ts`.
4. Verify level order and unlock flow.
5. Run `npm.cmd run build`.

Rules:

- The new level id must match exactly across data files.
- If changing or removing existing ids, add or update progress migration logic.
- Place the new level in `levels.json` where it should appear in linear progression.

### 19.2 Change reply validation

Primary file:

- `src/game/systems/TypingSystem.ts`

Current validation:

- trim
- lowercase
- exact string match

If adding fuzzy matching or punctuation tolerance:

- Update `normalizeForCompare`.
- Consider also updating typed highlight logic, because it currently uses per-character expected geometry.
- Update this document and README.

### 19.3 Change scoring

Primary file:

- `src/game/managers/RunScore.ts`

Also inspect:

- `GameScene` for when score methods are called.
- `ResultScene` for when best score is recorded.

### 19.4 Change progression rules

Primary file:

- `src/game/managers/ProgressManager.ts`

Also inspect:

- `LevelSelectScene` for locked/unlocked display.
- `ResultScene` for completion marking.

### 19.5 Change visual theme

Primary file:

- `src/game/ui/UiTheme.ts`

Also inspect:

- `MainMenuScene` for road backdrop constants.
- `DrivingSystem` and `ObstacleSystem` for primitive shape colors.
- `style.css` for page/footer colors.

### 19.6 Add audio

There is currently no audio system. A future implementation would likely:

- Preload audio assets in a boot/preload scene or existing scenes.
- Add a shared sound manager or scene-level sound hooks.
- Trigger sounds on message arrival, correct submit, wrong submit, crash, overload, pause, and button clicks.
- Add mute controls and persist preference.

No such system exists today.

## 20. Current Limitations

Known limitations by design:

- Prototype scope only.
- Three authored levels.
- One linear campaign.
- No branching dialogue trees.
- No procedural or dynamic dialogue.
- No backend.
- No accounts.
- No cloud save.
- localStorage-only progress.
- No sound.
- No accessibility/difficulty options beyond authored tuning.
- Visuals are simple Phaser shapes and text, not asset-heavy production art.
- Collision uses rectangle bounds.
- Reply validation is exact after trim/lowercase.
- Vite emits a large chunk warning because Phaser is bundled.

Important non-limitations:

- The project is intentionally small and readable.
- The absence of broader systems is not necessarily a bug.
- Many files are deliberately single-purpose to make prototype iteration easy.

## 21. Source Of Truth Summary

Use these files first when answering questions:

| Question | Start here |
| --- | --- |
| What is the app? | `README.md`, `docs/PROJECT_CONTEXT.md` |
| How does the game boot? | `src/main.ts`, `index.html` |
| What scenes exist? | `src/game/*Scene.ts` |
| How is gameplay coordinated? | `src/game/GameScene.ts` |
| What are the levels? | `src/data/levels.json` |
| What are the messages/replies? | `src/data/dialogue.json` |
| How are levels unlocked/saved? | `src/game/managers/ProgressManager.ts` |
| How is score calculated? | `src/game/managers/RunScore.ts` |
| How does steering work? | `src/game/systems/DrivingSystem.ts` |
| How do obstacles work? | `src/game/systems/ObstacleSystem.ts` |
| How does typing work? | `src/game/systems/TypingSystem.ts` |
| How does focus depletion work? | `src/game/systems/StressSystem.ts` |
| How is phone UI built? | `src/game/ui/PhoneUI.ts` |
| How is responsive gameplay layout calculated? | `src/game/ui/GameplayLayout.ts` |
| How is narrative text wrapped? | `src/game/ui/narrativeLayout.ts` |
| How is typed text highlighted? | `src/game/ui/typingHighlightLayout.ts` |
| How does deployment work? | `.github/workflows/deploy-pages.yml`, `vite.config.ts` |

## 22. Mental Model For Future AI Assistants

Think of the app as five layers:

1. Browser shell
   - `index.html`, `style.css`, Vite.

2. Phaser scene flow
   - Menu, level select, gameplay, result, ending.

3. Data-driven content
   - Level configs and dialogue blocks loaded from JSON.

4. Gameplay systems
   - Driving, obstacles, typing, focus/stress internals, scoring, progress.

5. UI helpers
   - Theme, buttons, gameplay layout, phone/chat, overlays, text wrapping.

`GameScene` is the central coordinator. It should usually remain the first file to inspect for runtime behavior because it connects all systems and determines when the run succeeds, fails, pauses, updates HUD, and transitions to results.

When debugging, avoid assuming a problem is only in one system. For example:

- A crash stress issue may involve `ObstacleSystem`, `TypingSystem.isUnderPressure`, `StressSystem`, and `GameScene.update`.
- A reply display issue may involve `TypingSystem`, `PhoneUI`, and `typingHighlightLayout`.
- A locked-level issue may involve `ProgressManager`, `levels.json`, browser localStorage, and `LevelSelectScene`.

When extending the app, keep authored level ids stable and aligned. That is the most important cross-file contract in the project.
