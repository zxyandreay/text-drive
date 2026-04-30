import Phaser from "phaser";
import levelsData from "../data/levels.json";
import type { LevelConfig } from "./types/LevelTypes";
import { ProgressManager } from "./managers/ProgressManager";
import { UiFactory } from "./ui/UiFactory";

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelectScene");
  }

  create(): void {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor("#020617");
    const levels = levelsData as LevelConfig[];
    const progressManager = new ProgressManager(levels);

    this.add
      .text(width / 2, 60, "Level Select", {
        fontFamily: "Arial",
        fontSize: "42px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5);

    levels.forEach((level, index) => {
      const y = 160 + index * 110;
      const unlocked = progressManager.isUnlocked(level.id);
      const completed = progressManager.isCompleted(level.id);

      const card = UiFactory.createPanel(this, width / 2, y, 640, 88, unlocked ? 0.92 : 0.72);
      if (!unlocked) {
        card.setFillStyle(0x0b1220, 0.72);
      }

      const titleColor = unlocked ? "#e2e8f0" : "#64748b";
      const subColor = unlocked ? "#93c5fd" : "#475569";
      this.add
        .text(width / 2 - 290, y - 26, level.title, {
          fontFamily: "Arial",
          fontSize: "26px",
          color: titleColor
        })
        .setOrigin(0, 0);

      this.add
        .text(width / 2 - 290, y + 10, unlocked ? level.tone : "Locked - finish previous level", {
          fontFamily: "Arial",
          fontSize: "16px",
          color: subColor
        })
        .setOrigin(0, 0);

      const badge = completed ? "Completed" : unlocked ? "Unlocked" : "Locked";
      this.add
        .text(width / 2 + 222, y - 8, badge, {
          fontFamily: "Arial",
          fontSize: "18px",
          color: completed ? "#86efac" : unlocked ? "#fcd34d" : "#94a3b8"
        })
        .setOrigin(0.5);

      if (unlocked) {
        card.setInteractive();
        card.on("pointerdown", () => {
          this.scene.start("GameScene", { startLevelId: level.id });
        });
      }
    });

    UiFactory.createButton(this, width / 2, 500, "Back", () => {
      this.scene.start("MainMenuScene");
    }, { width: 200, height: 46, backgroundColor: 0x334155 });
  }
}
