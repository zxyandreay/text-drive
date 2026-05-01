import Phaser from "phaser";
import levelsData from "../data/levels.json";
import type { LevelConfig } from "./types/LevelTypes";
import { ProgressManager } from "./managers/ProgressManager";
import { UiFactory } from "./ui/UiFactory";
import { UiTheme } from "./ui/UiTheme";

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelectScene");
  }

  create(): void {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(UiTheme.colors.bg);
    const levels = levelsData as LevelConfig[];
    const progressManager = new ProgressManager(levels);

    this.add
      .text(width / 2, 60, "Level Select", {
        font: `600 32px ${UiTheme.fontFamily}`,
        color: UiTheme.colors.title
      })
      .setOrigin(0.5);

    const cardW = Math.min(640, width - 48);
    const cardH = 92;
    const startY = 150;

    levels.forEach((level, index) => {
      const y = startY + index * (cardH + 14);
      const unlocked = progressManager.isUnlocked(level.id);
      const completed = progressManager.isCompleted(level.id);

      const cardRoot = this.add.container(width / 2, y);

      const hit = this.add.rectangle(0, 0, cardW, cardH, 0x0f172a, unlocked ? 0.92 : 0.72);
      hit.setStrokeStyle(2, 0x334155, 0.9);
      if (!unlocked) {
        hit.setFillStyle(0x0b1220, 0.72);
      }

      const titleColor = unlocked ? UiTheme.colors.title : UiTheme.colors.muted;
      const subColor = unlocked ? UiTheme.colors.accent : "#475569";
      const titleText = this.add
        .text(-cardW / 2 + 18, -26, level.title, {
          fontFamily: UiTheme.fontFamily,
          fontSize: "26px",
          color: titleColor
        })
        .setOrigin(0, 0);

      const subText = this.add
        .text(-cardW / 2 + 18, 12, unlocked ? level.tone : "Locked — finish the previous level", {
          fontFamily: UiTheme.fontFamily,
          fontSize: "16px",
          color: subColor,
          wordWrap: { width: cardW - 200 }
        })
        .setOrigin(0, 0);

      const badge = completed ? "Completed" : unlocked ? "Unlocked" : "Locked";
      const badgeColor = completed ? UiTheme.colors.success : unlocked ? "#fcd34d" : UiTheme.colors.muted;
      const badgeText = this.add
        .text(cardW / 2 - 18, 0, badge, {
          fontFamily: UiTheme.fontFamily,
          fontSize: "18px",
          color: badgeColor
        })
        .setOrigin(1, 0.5);

      cardRoot.add([hit, titleText, subText, badgeText]);

      if (unlocked) {
        hit.setInteractive({ useHandCursor: true });
        hit.on("pointerup", () => {
          this.scene.start("GameScene", { startLevelId: level.id });
        });
      }
    });

    UiFactory.createButton(this, width / 2, 500, "Back", () => {
      this.scene.start("MainMenuScene");
    }, { width: 200, height: 46, backgroundColor: 0x334155 });
  }
}
