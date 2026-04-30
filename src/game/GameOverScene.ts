import Phaser from "phaser";
import { UiFactory } from "./ui/UiFactory";

type GameOverData = {
  reason: string;
  levelId: string;
};

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#020617");

    UiFactory.createPanel(this, width / 2, height / 2, 560, 360, 0.9);
    this.add
      .text(width / 2, 170, "Game Over", {
        fontFamily: "Arial",
        fontSize: "52px",
        color: "#fca5a5"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 230, data.reason, {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5);

    UiFactory.createButton(this, width / 2, 308, "Play Again", () => {
      this.scene.start("GameScene", { startLevelId: data.levelId });
    });
    UiFactory.createButton(
      this,
      width / 2,
      370,
      "Main Menu",
      () => {
        this.scene.start("MainMenuScene");
      },
      { backgroundColor: 0x334155 }
    );
  }
}
