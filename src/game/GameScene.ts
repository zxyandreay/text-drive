import Phaser from "phaser";
import { DrivingSystem } from "./systems/DrivingSystem";
import { ObstacleSystem } from "./systems/ObstacleSystem";
import { PhoneUI } from "./ui/PhoneUI";
import { TypingSystem } from "./systems/TypingSystem";
import { StressSystem } from "./systems/StressSystem";
import { DialogueManager } from "./managers/DialogueManager";
import { LevelManager } from "./managers/LevelManager";
import { ProgressManager } from "./managers/ProgressManager";
import { RunScore } from "./managers/RunScore";
import { LevelIntroOverlay } from "./ui/LevelIntroOverlay";
import { computeGameplayLayout, type GameplayLayoutMetrics } from "./ui/GameplayLayout";
import { UiTheme } from "./ui/UiTheme";
import levelsData from "../data/levels.json";
import dialogueData from "../data/dialogue.json";
import type { LevelConfig } from "./types/LevelTypes";

/** Top gameplay HUD: shared horizontal rhythm (inset from layout marginX). */
const HUD_BAR_PAD_X = 12;
const HUD_RIGHT_PAD = 12;
const HUD_BACK_W = 122;
const HUD_BACK_H = 36;
const HUD_GAP_AFTER_BACK = 14;
const HUD_TITLE_GAP = 14;
const HUD_STATS_GAP = 20;
const HUD_STAT_STEP = 108;

type GameSceneData = {
  startLevelId?: string;
};

type LevelFlowState = "preLevelNarration" | "gameplay" | "ending";

export class GameScene extends Phaser.Scene {
  private readonly roadBounds = { left: 0, right: 0 };
  private drivingSystem!: DrivingSystem;
  private obstacleSystem!: ObstacleSystem;
  private typingSystem!: TypingSystem;
  private stressSystem!: StressSystem;
  private phoneUI!: PhoneUI;
  private levelManager!: LevelManager;
  private dialogueManager!: DialogueManager;
  private progressManager!: ProgressManager;
  private runScore!: RunScore;

  private layout!: GameplayLayoutMetrics;
  private topBarBg!: Phaser.GameObjects.Rectangle;
  private levelTitleText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private stressText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private toneText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private hintCardBg!: Phaser.GameObjects.Rectangle;
  private hintCardText!: Phaser.GameObjects.Text;
  private backHit!: Phaser.GameObjects.Rectangle;
  private backLabel!: Phaser.GameObjects.Text;

  private gameOver = false;
  private transitioningLevel = false;
  private remainingStorySeconds = 0;
  private crashCount = 0;
  private flowState: LevelFlowState = "preLevelNarration";
  private pendingFlowTimer?: Phaser.Time.TimerEvent;
  private hintFaded = false;

  constructor() {
    super("GameScene");
  }

  create(data: GameSceneData): void {
    this.cameras.main.setBackgroundColor(UiTheme.colors.bg);
    this.gameOver = false;
    this.transitioningLevel = false;
    this.crashCount = 0;
    this.hintFaded = false;
    this.pendingFlowTimer?.remove();
    this.pendingFlowTimer = undefined;

    this.layout = computeGameplayLayout(this.scale);
    this.roadBounds.left = this.layout.road.left;
    this.roadBounds.right = this.layout.road.right;

    this.buildHudChrome();

    this.drivingSystem = new DrivingSystem(this, this.roadBounds);
    this.drivingSystem.create();

    this.obstacleSystem = new ObstacleSystem(this, this.roadBounds);
    this.phoneUI = new PhoneUI(this, this.layout.phone);
    this.phoneUI.setDepth(this.layout.phoneDepth);

    this.runScore = new RunScore();
    this.typingSystem = new TypingSystem(this, this.phoneUI);
    this.typingSystem.setOnCorrectReply(() => {
      this.runScore.addCorrectReply();
    });
    this.typingSystem.create();
    this.stressSystem = new StressSystem(this, this.drivingSystem, this.obstacleSystem, this.phoneUI);
    this.levelManager = new LevelManager(levelsData as LevelConfig[]);
    this.dialogueManager = new DialogueManager(dialogueData);
    this.progressManager = new ProgressManager(levelsData as LevelConfig[]);

    const startId = data.startLevelId;
    if (startId && !this.progressManager.isUnlocked(startId)) {
      this.scene.start("MainMenuScene");
      return;
    }
    if (startId) {
      this.levelManager.setCurrentById(startId);
    }
    this.configureLevel();
    this.applyHudLayout(this.layout);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once("shutdown", () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.pendingFlowTimer?.remove();
      this.pendingFlowTimer = undefined;
    });

    this.showLevelIntro();
  }

  private buildHudChrome(): void {
    const L = this.layout;
    this.topBarBg = this.add.rectangle(
      L.width * 0.5,
      L.topBarTop + L.topBarH * 0.5,
      L.width - L.marginX * 2,
      L.topBarH,
      0x0f172a,
      0.88
    );
    this.topBarBg.setStrokeStyle(1, 0x334155, 0.75);
    this.topBarBg.setDepth(L.headerDepth - 1);

    this.backHit = this.add.rectangle(0, 0, HUD_BACK_W, HUD_BACK_H, 0x334155, 0.95);
    this.backHit.setStrokeStyle(1, 0x64748b, 0.85);
    this.backHit.setInteractive({ useHandCursor: true });
    this.backHit.on("pointerup", () => {
      this.exitToLevelSelect();
    });
    this.backLabel = this.add
      .text(0, 0, "← levels", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.title
      })
      .setOrigin(0.5);
    this.backHit.setDepth(L.headerDepth);
    this.backLabel.setDepth(L.headerDepth + 1);

    this.levelTitleText = this.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.titleMd,
        color: UiTheme.colors.title
      })
      .setOrigin(0, 0.5);
    this.levelTitleText.setDepth(L.headerDepth);

    this.progressText = this.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.accent
      })
      .setOrigin(0, 0.5);
    this.progressText.setDepth(L.headerDepth);

    this.stressText = this.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.stress
      })
      .setOrigin(0, 0.5);
    this.stressText.setDepth(L.headerDepth);

    this.scoreText = this.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.body
      })
      .setOrigin(0, 0.5);
    this.scoreText.setDepth(L.headerDepth);

    this.timerText = this.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.stress
      })
      .setOrigin(0, 0.5);
    this.timerText.setDepth(L.headerDepth);

    this.toneText = this.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.hint,
        color: UiTheme.colors.muted,
        wordWrap: { width: Math.max(200, this.layout.width - this.layout.marginX * 2 - 24) }
      })
      .setOrigin(0, 0);
    this.toneText.setDepth(L.hudDepth);

    this.statusText = this.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.hint,
        color: UiTheme.colors.body
      })
      .setOrigin(1, 0.5);
    this.statusText.setDepth(L.headerDepth);

    this.hintCardBg = this.add.rectangle(0, 0, 1, 1, 0x0f172a, 0.86);
    this.hintCardBg.setStrokeStyle(1, 0x334155, 0.85);
    this.hintCardBg.setDepth(L.hudDepth);

    this.hintCardText = this.add
      .text(0, 0, "mouse steer · enter send · backspace edit", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.hint,
        color: UiTheme.colors.muted,
        align: "left",
        wordWrap: { width: 200 }
      })
      .setOrigin(0.5, 0.5);
    this.hintCardText.setDepth(L.hudDepth + 1);
  }

  private applyHudLayout(L: GameplayLayoutMetrics): void {
    const rowY = L.topBarTop + L.topBarH * 0.5;
    const leftInset = L.marginX + HUD_BAR_PAD_X;
    const rightInset = L.marginX + HUD_RIGHT_PAD;

    this.topBarBg.setPosition(L.width * 0.5, L.topBarTop + L.topBarH * 0.5);
    this.topBarBg.width = L.width - L.marginX * 2;
    this.topBarBg.height = L.topBarH;

    const backCenterX = leftInset + HUD_BACK_W * 0.5;
    this.backHit.setPosition(backCenterX, rowY);
    this.backHit.setSize(HUD_BACK_W, HUD_BACK_H);
    this.backLabel.setPosition(backCenterX, rowY);

    let titleX = backCenterX + HUD_BACK_W * 0.5 + HUD_GAP_AFTER_BACK;
    this.levelTitleText.setPosition(titleX, rowY);

    titleX += this.levelTitleText.width + HUD_TITLE_GAP;
    this.progressText.setPosition(titleX, rowY);

    const statsStart = titleX + this.progressText.width + HUD_STATS_GAP;
    this.stressText.setPosition(statsStart, rowY);
    this.scoreText.setPosition(statsStart + HUD_STAT_STEP, rowY);
    this.timerText.setPosition(statsStart + HUD_STAT_STEP * 2, rowY);

    this.statusText.setPosition(L.width - rightInset, rowY);

    const toneY = L.topBarTop + L.topBarH + 6;
    this.toneText.setPosition(leftInset, toneY);
    this.toneText.setWordWrapWidth(Math.max(200, L.width - leftInset - rightInset), true);

    const hint = L.hintCard;
    this.hintCardBg.setPosition(hint.cx, hint.cy);
    this.hintCardBg.setSize(hint.w, hint.h);
    this.hintCardText.setPosition(hint.cx, hint.cy - 6);
    this.hintCardText.setWordWrapWidth(Math.max(96, hint.w - 16), true);
  }

  private handleResize(): void {
    if (!this.sys.isActive()) {
      return;
    }
    this.layout = computeGameplayLayout(this.scale);
    this.roadBounds.left = this.layout.road.left;
    this.roadBounds.right = this.layout.road.right;
    this.drivingSystem.relayout();
    this.phoneUI.applyLayout(this.layout.phone);
    this.phoneUI.setDepth(this.layout.phoneDepth);
    this.applyHudLayout(this.layout);
  }

  private exitToLevelSelect(): void {
    this.pendingFlowTimer?.remove();
    this.pendingFlowTimer = undefined;
    this.gameOver = true;
    this.flowState = "ending";
    this.scene.start("LevelSelectScene");
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) {
      return;
    }
    if (this.flowState !== "gameplay") {
      return;
    }

    const deltaSeconds = delta / 1000;

    this.drivingSystem.update(deltaSeconds);
    this.obstacleSystem.update(
      deltaSeconds,
      this.drivingSystem.getCarBounds(),
      this.drivingSystem.getRoadSpeed()
    );
    this.typingSystem.update(deltaSeconds);

    if (!this.transitioningLevel && !this.typingSystem.isCompleted()) {
      this.remainingStorySeconds = Math.max(0, this.remainingStorySeconds - deltaSeconds);
      this.refreshStoryTimerHud();
      if (this.remainingStorySeconds <= 0) {
        this.endRun("out of story time");
        return;
      }
    }

    const typingIncident = this.typingSystem.pollIncident();
    if (typingIncident) {
      this.runScore.penalizeWrongSubmit();
      this.stressSystem.applyIncident(typingIncident.reason);
    }

    if (this.obstacleSystem.consumeCrashEvent() && this.typingSystem.isUnderPressure()) {
      this.crashCount += 1;
      this.runScore.penalizeCrash();
      this.stressSystem.applyIncident("crash");
    }

    if (this.typingSystem.isCompleted() && !this.obstacleSystem.isCrashed()) {
      this.statusText.setText("thread done · hold the lane");
      this.statusText.setColor(UiTheme.colors.success);
    } else {
      this.statusText.setText("stay focused");
      this.statusText.setColor(UiTheme.colors.body);
    }

    this.stressText.setText(`stress ${this.stressSystem.getStress()}/${this.stressSystem.getMaxStress()}`);
    this.scoreText.setText(`score ${this.runScore.getScore()}`);

    if (this.stressSystem.isOverloaded()) {
      this.endRun("cognitive overload");
      return;
    }

    if (this.typingSystem.isCompleted() && !this.transitioningLevel) {
      this.handleLevelComplete();
    }
  }

  private refreshStoryTimerHud(): void {
    const t = this.remainingStorySeconds;
    this.timerText.setText(`time ${t.toFixed(1)}s`);
    if (t <= 12) {
      this.timerText.setColor(UiTheme.colors.danger);
    } else if (t <= 22) {
      this.timerText.setColor(UiTheme.colors.warn);
    } else {
      this.timerText.setColor(UiTheme.colors.stress);
    }
  }

  private endRun(reason: string): void {
    this.gameOver = true;
    this.flowState = "ending";
    if (reason === "cognitive overload") {
      this.runScore.penalizeOverload();
    }
    const level = this.levelManager.getCurrentLevel();
    const score = this.runScore.getScore();
    const aftermathText = this.dialogueManager.getOutcomeText(level.id, "failure");
    this.pendingFlowTimer?.remove();
    this.pendingFlowTimer = this.time.delayedCall(260, () => {
      this.pendingFlowTimer = undefined;
      this.scene.start("ResultScene", {
        outcome: "failure",
        levelId: level.id,
        levelTitle: level.title,
        score,
        reason,
        nextLevelId: null,
        aftermathText
      });
    });
  }

  private configureLevel(): void {
    const level = this.levelManager.getCurrentLevel();
    this.flowState = "preLevelNarration";

    this.levelTitleText.setText(level.title);
    this.progressText.setText(
      `${this.levelManager.getCurrentLevelNumber()}/${this.levelManager.getTotalLevels()}`
    );
    this.toneText.setText(level.tone);

    this.drivingSystem.setRoadSpeed(level.roadSpeed);
    this.obstacleSystem.configureLevel(level.obstacleSpeed, level.obstacleSpawnMs);
    this.obstacleSystem.resetForLevel();
    this.stressSystem.configureLevel(level.maxStress);
    this.stressSystem.reset();
    this.runScore.reset();
    this.crashCount = 0;
    this.remainingStorySeconds = level.storyTimeSeconds;
    this.refreshStoryTimerHud();
    this.phoneUI.setIdleBeforeConversation();
    this.transitioningLevel = false;
    this.hintFaded = false;
    this.hintCardBg.setAlpha(1);
    this.hintCardText.setAlpha(1);
  }

  private showLevelIntro(): void {
    const level = this.levelManager.getCurrentLevel();
    new LevelIntroOverlay(this, {
      title: level.title,
      lines: level.introNarration,
      onComplete: () => {
        this.beginGameplay();
      },
      onBack: () => {
        this.exitToLevelSelect();
      }
    });
  }

  private beginGameplay(): void {
    const level = this.levelManager.getCurrentLevel();
    this.flowState = "gameplay";
    this.typingSystem.startLevel(this.dialogueManager.getPrompts(level.id), level.id);

    if (!this.hintFaded) {
      this.hintFaded = true;
      this.tweens.add({
        targets: [this.hintCardBg, this.hintCardText],
        alpha: 0.52,
        duration: 520,
        ease: "Sine.easeOut"
      });
    }
  }

  private handleLevelComplete(): void {
    this.transitioningLevel = true;
    this.gameOver = true;
    this.flowState = "ending";
    const level = this.levelManager.getCurrentLevel();
    const storyLeft = this.remainingStorySeconds;

    this.runScore.addLevelComplete();
    this.runScore.addTimeBonus(storyLeft);
    if (this.crashCount === 0) {
      this.runScore.addNoCrashBonus();
    }

    const score = this.runScore.getScore();
    const nextLevelId = this.levelManager.getNextLevelId();
    const aftermathText = this.dialogueManager.getOutcomeText(level.id, "success");

    this.pendingFlowTimer?.remove();
    this.pendingFlowTimer = this.time.delayedCall(450, () => {
      this.pendingFlowTimer = undefined;
      this.scene.start("ResultScene", {
        outcome: "success",
        levelId: level.id,
        levelTitle: level.title,
        score,
        reason: undefined,
        nextLevelId,
        aftermathText
      });
    });
  }
}
