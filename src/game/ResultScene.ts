import Phaser from "phaser";
import levelsData from "../data/levels.json";
import type { LevelConfig } from "./types/LevelTypes";
import { ProgressManager } from "./managers/ProgressManager";
import { UiFactory } from "./ui/UiFactory";
import { UiTheme } from "./ui/UiTheme";
import { formatNarrativeBody, getNarrativeColumnWidth } from "./ui/narrativeLayout";

export type ResultSceneData = {
  outcome: "success" | "failure";
  levelId: string;
  levelTitle: string;
  score: number;
  reason?: string;
  nextLevelId: string | null;
  aftermathText: string;
};

type ResultFlowPhase = "result" | "aftermath";

const MARGIN_OUTER = 24;
const PAD_X = 28;
const PAD_Y = 24;
const NAV_W = 220;
const NAV_H = 40;
const GAP_AFTER_NAV = 12;
const GAP_MD = 12;
const GAP_LG = 18;
/** Space between last text line and first button (center-to-edge uses half button height below this). */
const GAP_TEXT_TO_BTN = 32;
const BTN_W = 272;
const BTN_H = 48;
const BTN_GAP = 18;
const PANEL_H = 480;
const PANEL_MAX_W = 600;

export class ResultScene extends Phaser.Scene {
  private dataPayload!: ResultSceneData;
  private phase: ResultFlowPhase = "result";
  private basePanel!: Phaser.GameObjects.Rectangle;
  private phaseRoot!: Phaser.GameObjects.Container;
  private panelW = PANEL_MAX_W;
  private exiting = false;

  constructor() {
    super("ResultScene");
  }

  init(): void {
    this.exiting = false;
  }

  create(data: ResultSceneData): void {
    this.dataPayload = data;
    this.phase = "result";
    this.exiting = false;
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(UiTheme.colors.bg);

    this.panelW = Math.min(PANEL_MAX_W, width - MARGIN_OUTER * 2);
    const cx = width / 2;
    const cy = height / 2;

    this.basePanel = UiFactory.createPanel(this, cx, cy, this.panelW, PANEL_H, 0.92);
    this.basePanel.setDepth(0);

    this.phaseRoot = this.add.container(cx, cy);
    this.phaseRoot.setDepth(10);

    this.renderResultPhase();
  }

  /** Prevents double pointerup / stacked navigations. */
  private goScene(key: string, data?: Record<string, unknown>): void {
    if (this.exiting) {
      return;
    }
    this.exiting = true;
    if (data !== undefined) {
      this.scene.start(key, data);
    } else {
      this.scene.start(key);
    }
  }

  private textWrapWidth(): number {
    return Math.max(200, this.panelW - PAD_X * 2);
  }

  /** Top-of-card ghost control; local coords inside phaseRoot. */
  private addLevelSelectNav(container: Phaser.GameObjects.Container): void {
    const navCx = -this.panelW / 2 + PAD_X + NAV_W / 2;
    const navCy = -PANEL_H / 2 + PAD_Y + NAV_H / 2;
    UiFactory.createButtonInContainer(container, this, navCx, navCy, "← level select", () => {
      this.goScene("LevelSelectScene");
    }, {
      variant: "ghost",
      width: NAV_W,
      height: NAV_H,
      labelFontSize: UiTheme.sizes.resultNav
    });
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
    const progress = new ProgressManager(levelsData as LevelConfig[]);
    let bestShown: number;

    if (data.outcome === "success") {
      progress.markCompleted(data.levelId);
      bestShown = progress.recordBestIfBetter(data.levelId, data.score);
    } else {
      bestShown = progress.getBestScore(data.levelId);
    }

    let y = -PANEL_H / 2 + PAD_Y + NAV_H + GAP_AFTER_NAV;

    const headline = data.outcome === "success" ? "level complete" : "run ended";
    const headlineColor = data.outcome === "success" ? UiTheme.colors.success : UiTheme.colors.stress;

    const headlineText = this.add
      .text(0, y, headline, {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.resultHeadline,
        color: headlineColor
      })
      .setOrigin(0.5, 0);
    y += headlineText.height + GAP_MD;

    const levelTitleText = this.add
      .text(0, y, data.levelTitle, {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.resultLevelTitle,
        color: UiTheme.colors.title
      })
      .setOrigin(0.5, 0);
    y += levelTitleText.height + GAP_MD;

    let reasonText: Phaser.GameObjects.Text | null = null;
    if (data.outcome === "failure" && data.reason) {
      const reasonStyle: Phaser.Types.GameObjects.Text.TextStyle = {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.resultReason,
        color: UiTheme.colors.muted,
        align: "center",
        lineSpacing: UiTheme.narrative.resultLineSpacing
      };
      const reasonBody = formatNarrativeBody(
        this,
        [data.reason],
        reasonStyle,
        getNarrativeColumnWidth(this.textWrapWidth())
      );
      reasonText = this.add.text(0, y, reasonBody, reasonStyle).setOrigin(0.5, 0);
      y += reasonText.height + GAP_LG;
    }

    const scoreText = this.add
      .text(0, y, `score ${data.score}`, {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.resultScore,
        color: "#f8fafc"
      })
      .setOrigin(0.5, 0);
    y += scoreText.height + GAP_MD;

    const bestText = this.add
      .text(0, y, `best ${bestShown}`, {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.resultBest,
        color: UiTheme.colors.accent
      })
      .setOrigin(0.5, 0);
    y += bestText.height;

    this.phaseRoot.add(headlineText);
    this.phaseRoot.add(levelTitleText);
    if (reasonText) {
      this.phaseRoot.add(reasonText);
    }
    this.phaseRoot.add(scoreText);
    this.phaseRoot.add(bestText);

    const bottomSpace = PANEL_H / 2 - PAD_Y;
    const continueY = Math.min(y + GAP_TEXT_TO_BTN + BTN_H / 2, bottomSpace - BTN_H / 2);
    UiFactory.createButtonInContainer(this.phaseRoot, this, 0, continueY, "continue", () => {
      if (this.phase !== "result" || this.exiting) {
        return;
      }
      this.phase = "aftermath";
      this.clearPhaseRoot();
      this.renderAftermathPhase();
    }, { variant: "primary", width: BTN_W, height: BTN_H });

    this.addLevelSelectNav(this.phaseRoot);
  }

  private renderAftermathPhase(): void {
    if (this.phase !== "aftermath") {
      return;
    }
    this.clearPhaseRoot();
    const data = this.dataPayload;
    const title = data.outcome === "success" ? "what happened after" : "what followed";
    const bodyParagraphs =
      data.aftermathText.trim().length > 0
        ? [data.aftermathText.trim()]
        : ["you take a breath and the story keeps moving", "you can choose what to do next"];

    let y = -PANEL_H / 2 + PAD_Y + NAV_H + GAP_AFTER_NAV;

    const titleText = this.add
      .text(0, y, title, {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.resultAfterTitle,
        color: UiTheme.colors.title
      })
      .setOrigin(0.5, 0);
    y += titleText.height + GAP_MD;

    const bodyStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: UiTheme.fontFamily,
      fontSize: UiTheme.sizes.resultBody,
      color: UiTheme.colors.body,
      align: "center",
      lineSpacing: UiTheme.narrative.resultLineSpacing
    };
    const bodyString = formatNarrativeBody(
      this,
      bodyParagraphs,
      bodyStyle,
      getNarrativeColumnWidth(this.textWrapWidth())
    );
    const bodyText = this.add.text(0, y, bodyString, bodyStyle).setOrigin(0.5, 0);
    y += bodyText.height;

    this.phaseRoot.add(titleText);
    this.phaseRoot.add(bodyText);

    let buttonY = y + GAP_TEXT_TO_BTN + BTN_H / 2;
    const addPrimary = (label: string, key: string, payload?: Record<string, unknown>) => {
      UiFactory.createButtonInContainer(this.phaseRoot, this, 0, buttonY, label, () => {
        if (payload !== undefined) {
          this.goScene(key, payload);
        } else {
          this.goScene(key);
        }
      }, { variant: "primary", width: BTN_W, height: BTN_H });
      buttonY += BTN_H + BTN_GAP;
    };
    const addSecondary = (label: string, key: string, payload?: Record<string, unknown>) => {
      UiFactory.createButtonInContainer(this.phaseRoot, this, 0, buttonY, label, () => {
        if (payload !== undefined) {
          this.goScene(key, payload);
        } else {
          this.goScene(key);
        }
      }, { variant: "secondary", width: BTN_W, height: BTN_H });
      buttonY += BTN_H + BTN_GAP;
    };

    if (data.outcome === "success" && data.nextLevelId) {
      addPrimary("play next level", "GameScene", { startLevelId: data.nextLevelId });
      addSecondary("play again", "GameScene", { startLevelId: data.levelId });
    } else if (data.outcome === "success" && data.nextLevelId === null) {
      addPrimary("continue to ending", "EndingScene", {
        finalMessage:
          "you made it to the end of the road.\nbut every message demanded attention that driving needed.\nno reply is worth a life."
      });
      addSecondary("play again", "GameScene", { startLevelId: data.levelId });
    } else {
      addPrimary("play again", "GameScene", { startLevelId: data.levelId });
    }

    UiFactory.createButtonInContainer(this.phaseRoot, this, 0, buttonY, "main menu", () => {
      this.goScene("MainMenuScene");
    }, { variant: "ghost", width: BTN_W, height: BTN_H });

    this.addLevelSelectNav(this.phaseRoot);
  }
}
