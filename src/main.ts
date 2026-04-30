import Phaser from "phaser";
import "./style.css";
import { GameScene } from "./game/GameScene";
import { EndingScene } from "./game/EndingScene";

const GAME_WIDTH = 900;
const GAME_HEIGHT = 540;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "app",
  backgroundColor: "#111827",
  scene: [GameScene, EndingScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
