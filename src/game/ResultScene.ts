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

type ResultFlowPhase = "result" | "aftermath";

export class ResultScene extends Phaser.Scene {
  private dataPayload!: ResultSceneData;
  private phase: ResultFlowPhase = "result";
  private basePanel!: Phaser.GameObjects.Rectangle;
  private chromeDepth = 30;
  private phaseRoot!: Phaser.GameObjects.Container;

  constructor() {
    super("ResultScene");
  }

  create(data: ResultSceneData): void {
    this.dataPayload = data;
    this.phase = "result";
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#020617");

    this.basePanel = UiFactory.createPanel(this, width / 2, height / 2, 600, 460, 0.92);
    this.basePanel.setDepth(0);

    const backY = 52;
    const backX = 96;
    const backBg = this.add.rectangle(backX, backY, 132, 40, 0x334155, 0.95);
    backBg.setStrokeStyle(1, 0x64748b, 0.9);
    backBg.setInteractive({ useHandCursor: true });
    backBg.setDepth(this.chromeDepth);
    const backLabel = this.add
      .text(backX, backY, "← level select", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5);
    backLabel.setDepth(this.chromeDepth + 1);
    backBg.on("pointerup", () => {
      this.scene.start("LevelSelectScene");
    });

    this.phaseRoot = this.add.container(0, 0);
    this.phaseRoot.setDepth(10);

    this.renderResultPhase();
  }

  private clearPhaseRoot(): void {
    this.phaseRoot.removeAll(true);
  }

  private renderResultPhase(): void {
    if (this.phase !== "result") {
      return;
    }
    this.clearPhaseRoot();
    const data = this.dataPayload;
    const { width } = this.scale;
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

    this.phaseRoot.add(headlineText);
    this.phaseRoot.add(levelTitleText);
    this.phaseRoot.add(scoreText);
    this.phaseRoot.add(bestText);
    if (reasonText) {
      this.phaseRoot.add(reasonText);
    }

    UiFactory.createButtonInContainer(this.phaseRoot, this, width / 2, 350, "continue", () => {
      if (this.phase !== "result") {
        return;
      }
      this.phase = "aftermath";
      this.clearPhaseRoot();
      this.renderAftermathPhase();
    });
  }

  private renderAftermathPhase(): void {
    if (this.phase !== "aftermath") {
      return;
    }
    this.clearPhaseRoot();
    const data = this.dataPayload;
    const { width } = this.scale;
    const title = data.outcome === "success" ? "what happened after" : "what followed";
    const bodyLines =
      data.aftermathLines.length > 0
        ? data.aftermathLines
        : ["you take a breath and the story keeps moving", "you can choose what to do next"];

    const titleText = this.add
      .text(width / 2, 120, title, {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5);

    const bodyText = this.add
      .text(width / 2, 212, bodyLines.join("\n\n"), {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#cbd5e1",
        align: "center",
        wordWrap: { width: 520 }
      })
      .setOrigin(0.5);

    this.phaseRoot.add(titleText);
    this.phaseRoot.add(bodyText);

    let buttonY = 328;

    if (data.outcome === "success" && data.nextLevelId) {
      UiFactory.createButtonInContainer(this.phaseRoot, this, width / 2, buttonY, "play next level", () => {
        this.scene.start("GameScene", { startLevelId: data.nextLevelId });
      });
      buttonY += 58;
    }

    UiFactory.createButtonInContainer(this.phaseRoot, this, width / 2, buttonY, "play again", () => {
      this.scene.start("GameScene", { startLevelId: data.levelId });
    });
    buttonY += 58;

    if (data.outcome === "success" && data.nextLevelId === null) {
      UiFactory.createButtonInContainer(this.phaseRoot, this, width / 2, buttonY, "continue to ending", () => {
        this.scene.start("EndingScene", {
          finalMessage:
            "you made it to the end of the road.\nbut every message demanded attention that driving needed.\nno reply is worth a life."
        });
      });
      buttonY += 58;
    }

    UiFactory.createButtonInContainer(
      this.phaseRoot,
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
