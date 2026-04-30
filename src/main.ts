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

new Phaser.Game(config);
