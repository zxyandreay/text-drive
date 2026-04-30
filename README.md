# TEXT DRIVE

Short narrative-driven browser game about the danger of texting while driving.  
Built with TypeScript, Phaser 3, and Vite.

## Concept

You must drive and type at the same time:

- Mouse controls steering
- Keyboard types exact text replies on a phone overlay
- Obstacles keep coming while you type
- Mistakes increase stress through temporary punishments
- Too much stress leads to cognitive overload and failure

The game has 3 short levels with the same core mechanics and escalating emotional tone:

1. First Date
2. Marriage
3. Dying Wife

## Tech Stack

- TypeScript
- Phaser 3
- Vite

## Run Locally

From the project root:

```bash
npm install
npm run dev
```

Open the local Vite URL (usually `http://localhost:5173`).

## Controls

- Mouse: steer left/right
- Keyboard: type exact reply
- Enter: submit reply
- Backspace: delete characters
- Ending scene: press `R` to restart

## Game Rules

- Driving and typing are simultaneous at all times
- Typing never pauses driving
- Phone UI remains visible during play
- Exact text matching is required
- Incidents (wrong input, timeout, crash under pressure) raise stress
- Run ends when stress overload threshold is reached

## Project Structure

```text
src/
  data/
    dialogue.json
    levels.json
  game/
    EndingScene.ts
    GameScene.ts
    managers/
      DialogueManager.ts
      LevelManager.ts
    systems/
      DrivingSystem.ts
      ObstacleSystem.ts
      StressSystem.ts
      TypingSystem.ts
    types/
      LevelTypes.ts
    ui/
      PhoneUI.ts
  main.ts
  style.css
```

## NPM Scripts

- `npm run dev` - start development server
- `npm run build` - type-check and build production bundle
- `npm run preview` - preview production build locally