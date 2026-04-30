import Phaser from "phaser";
import levelsData from "../data/levels.json";
import type { LevelConfig } from "./types/LevelTypes";
import { ProgressManager } from "./managers/ProgressManager";
import { UiFactory } from "./ui/UiFactory";

export type ResultSceneData = {
  outcome: "success" | "failure";
  levelId: string;
  levelTitle: string;
  score: number;
  reason?: string;
  nextLevelId: string | null;
  aftermathLines: string[];
};

export class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  create(data: ResultSceneData): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#020617");

    UiFactory.createPanel(this, width / 2, height / 2, 600, 460, 0.92);

    const progress = new ProgressManager(levelsData as LevelConfig[]);
    let bestShown: number;

    if (data.outcome === "success") {
      progress.markCompleted(data.levelId);
      bestShown = progress.recordBestIfBetter(data.levelId, data.score);
    } else {
      bestShown = progress.getBestScore(data.levelId);
    }

    const headline = data.outcome === "success" ? "level complete" : "run ended";
    const headlineColor = data.outcome === "success" ? "#86efac" : "#fca5a5";

    const headlineText = this.add
      .text(width / 2, 108, headline, {
        fontFamily: "Arial",
        fontSize: "42px",
        color: headlineColor
      })
      .setOrigin(0.5);

    const levelTitleText = this.add
      .text(width / 2, 162, data.levelTitle, {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5);

    let reasonText: Phaser.GameObjects.Text | null = null;
    if (data.outcome === "failure" && data.reason) {
      reasonText = this.add
        .text(width / 2, 204, data.reason, {
          fontFamily: "Arial",
          fontSize: "18px",
          color: "#94a3b8",
          align: "center",
          wordWrap: { width: 520 }
        })
        .setOrigin(0.5);
    }

    const scoreText = this.add
      .text(width / 2, 252, `score ${data.score}`, {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#f8fafc"
      })
      .setOrigin(0.5);

    const bestText = this.add
      .text(width / 2, 294, `best ${bestShown}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#93c5fd"
      })
      .setOrigin(0.5);

    const scoreViewObjects: Phaser.GameObjects.GameObject[] = [headlineText, levelTitleText, scoreText, bestText];
    if (reasonText) {
      scoreViewObjects.push(reasonText);
    }

    const continueButton = UiFactory.createButton(this, width / 2, 350, "continue", () => {
      scoreViewObjects.forEach((obj) => obj.destroy());
      continueButton.destroy();
      this.renderAftermathView(data);
    });
  }

  private renderAftermathView(data: ResultSceneData): void {
    const { width } = this.scale;
    const title = data.outcome === "success" ? "what happened after" : "what followed";

    this.add
      .text(width / 2, 120, title, {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 212, data.aftermathLines.join("\n\n"), {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#cbd5e1",
        align: "center",
        wordWrap: { width: 520 }
      })
      .setOrigin(0.5);

    let buttonY = 328;

    if (data.outcome === "success" && data.nextLevelId) {
      UiFactory.createButton(this, width / 2, buttonY, "play next level", () => {
        this.scene.start("GameScene", { startLevelId: data.nextLevelId });
      });
      buttonY += 58;
    }

    UiFactory.createButton(this, width / 2, buttonY, "play again", () => {
      this.scene.start("GameScene", { startLevelId: data.levelId });
    });
    buttonY += 58;

    if (data.outcome === "success" && data.nextLevelId === null) {
      UiFactory.createButton(this, width / 2, buttonY, "continue to ending", () => {
        this.scene.start("EndingScene", {
          finalMessage:
            "you made it to the end of the road.\nbut every message demanded attention that driving needed.\nno reply is worth a life."
        });
      });
      buttonY += 58;
    }

    UiFactory.createButton(
      this,
      width / 2,
      buttonY,
      "main menu",
      () => {
        this.scene.start("MainMenuScene");
      },
      { width: 240, height: 48, backgroundColor: 0x334155 }
    );
  }
}
