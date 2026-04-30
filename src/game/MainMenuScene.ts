import Phaser from "phaser";
import levelsData from "../data/levels.json";
import type { LevelConfig } from "./types/LevelTypes";
import { ProgressManager } from "./managers/ProgressManager";
import { UiFactory } from "./ui/UiFactory";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#020617");

    UiFactory.createPanel(this, width / 2, height / 2, 520, 430, 0.9);
    this.add
      .text(width / 2, 120, "TEXT DRIVE", {
        fontFamily: "Arial",
        fontSize: "56px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 178, "Drive and type at the same time.", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#93c5fd"
      })
      .setOrigin(0.5);

    const progressManager = new ProgressManager(levelsData as LevelConfig[]);
    UiFactory.createButton(this, width / 2, 270, "Play", () => {
      this.scene.start("GameScene", { startLevelId: progressManager.getPreferredPlayLevelId() });
    });

    UiFactory.createButton(this, width / 2, 336, "Level Select", () => {
      this.scene.start("LevelSelectScene");
    });
  }
}
