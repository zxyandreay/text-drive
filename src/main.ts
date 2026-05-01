import Phaser from "phaser";
import "./style.css";
import { GameScene } from "./game/GameScene";
import { EndingScene } from "./game/EndingScene";
import { MainMenuScene } from "./game/MainMenuScene";
import { LevelSelectScene } from "./game/LevelSelectScene";
import { ResultScene } from "./game/ResultScene";

const GAME_WIDTH = 900;
const GAME_HEIGHT = 540;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "app",
  backgroundColor: "#111827",
  scene: [MainMenuScene, LevelSelectScene, GameScene, ResultScene, EndingScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

async function boot(): Promise<void> {
  try {
    await document.fonts.load("700 64px Teko");
    await document.fonts.load("600 20px Inter");
    await document.fonts.ready;
  } catch {
    /* fall back to system fonts */
  }
  new Phaser.Game(config);
}

void boot();
