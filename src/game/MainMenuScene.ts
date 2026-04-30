import Phaser from "phaser";
import { UiFactory } from "./ui/UiFactory";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#020617");

    UiFactory.createPanel(this, width / 2, height / 2, 520, 380, 0.9);
    this.add
      .text(width / 2, 120, "TEXT DRIVE", {
        fontFamily: "Arial",
        fontSize: "56px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 186, "Drive and type at the same time.", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#93c5fd"
      })
      .setOrigin(0.5);

    UiFactory.createButton(this, width / 2, 288, "Start", () => {
      this.scene.start("LevelSelectScene");
    });
  }
}
