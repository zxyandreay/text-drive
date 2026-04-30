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
import { UiFactory } from "./ui/UiFactory";
import { LevelIntroOverlay } from "./ui/LevelIntroOverlay";
import levelsData from "../data/levels.json";
import dialogueData from "../data/dialogue.json";
import type { LevelConfig } from "./types/LevelTypes";

type GameSceneData = {
  startLevelId?: string;
};

export class GameScene extends Phaser.Scene {
  private readonly roadBounds = { left: 250, right: 650 };
  private drivingSystem!: DrivingSystem;
  private obstacleSystem!: ObstacleSystem;
  private typingSystem!: TypingSystem;
  private stressSystem!: StressSystem;
  private phoneUI!: PhoneUI;
  private levelManager!: LevelManager;
  private dialogueManager!: DialogueManager;
  private progressManager!: ProgressManager;
  private runScore!: RunScore;
  private statusText!: Phaser.GameObjects.Text;
  private levelTitleText!: Phaser.GameObjects.Text;
  private narrativeText!: Phaser.GameObjects.Text;
  private stressText!: Phaser.GameObjects.Text;
  private gameOver = false;
  private transitioningLevel = false;
  private remainingStorySeconds = 0;
  private crashCount = 0;
  private introDismissed = false;

  constructor() {
    super("GameScene");
  }

  create(data: GameSceneData): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#020617");
    this.gameOver = false;
    this.transitioningLevel = false;
    this.crashCount = 0;

    UiFactory.createPanel(this, 165, 126, 300, 178, 0.82);

    this.levelTitleText = this.add
      .text(width / 2, 20, "TEXT DRIVE", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5, 0);

    this.add
      .text(22, 62, "mouse: steer", { fontFamily: "Arial", fontSize: "15px", color: "#94a3b8" })
      .setOrigin(0, 0);
    this.add
      .text(22, 84, "keyboard: type reply then enter", { fontFamily: "Arial", fontSize: "15px", color: "#94a3b8" })
      .setOrigin(0, 0);
    this.add
      .text(22, 106, "backspace ok wrong letters ok until you send", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#94a3b8"
      })
      .setOrigin(0, 0);
    this.add
      .text(22, 128, "story timer runs for the whole level", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#94a3b8"
      })
      .setOrigin(0, 0);

    this.narrativeText = this.add
      .text(22, 156, "", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#cbd5e1",
        wordWrap: { width: 285 }
      })
      .setOrigin(0, 0);

    this.drivingSystem = new DrivingSystem(this, this.roadBounds);
    this.drivingSystem.create();

    this.obstacleSystem = new ObstacleSystem(this, this.roadBounds);
    this.phoneUI = new PhoneUI(this);
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

    this.statusText = this.add
      .text(width / 2, height - 20, "drive and type at the same time", {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#cbd5e1"
      })
      .setOrigin(0.5, 1);

    this.stressText = this.add
      .text(width - 20, 62, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#fca5a5"
      })
      .setOrigin(1, 0);

    const startId = data.startLevelId;
    if (startId && !this.progressManager.isUnlocked(startId)) {
      this.scene.start("MainMenuScene");
      return;
    }
    if (startId) {
      this.levelManager.setCurrentById(startId);
    }
    this.configureLevel();
    this.showLevelIntro();
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) {
      return;
    }
    if (!this.introDismissed) {
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
      this.phoneUI.setStoryTimeRemaining(this.remainingStorySeconds);
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
      this.statusText.setText("conversation complete hold the lane");
      this.statusText.setColor("#86efac");
    } else {
      this.statusText.setText("stay focused");
      this.statusText.setColor("#cbd5e1");
    }
    this.stressText.setText(`stress ${this.stressSystem.getStress()}/${this.stressSystem.getMaxStress()}`);

    if (this.stressSystem.isOverloaded()) {
      this.endRun("cognitive overload");
      return;
    }

    if (this.typingSystem.isCompleted() && !this.transitioningLevel) {
      this.handleLevelComplete();
    }
  }

  private endRun(reason: string): void {
    this.gameOver = true;
    if (reason === "cognitive overload") {
      this.runScore.penalizeOverload();
    }
    const level = this.levelManager.getCurrentLevel();
    const score = this.runScore.getScore();
    const aftermathLines = this.dialogueManager.getOutcomeLines(level.id, "failure");
    this.time.delayedCall(260, () => {
      this.scene.start("ResultScene", {
        outcome: "failure",
        levelId: level.id,
        levelTitle: level.title,
        score,
        reason,
        nextLevelId: null,
        aftermathLines
      });
    });
  }

  private configureLevel(): void {
    const level = this.levelManager.getCurrentLevel();
    this.introDismissed = false;

    this.levelTitleText.setText(
      `${level.title} (${this.levelManager.getCurrentLevelNumber()}/${this.levelManager.getTotalLevels()})`
    );
    this.narrativeText.setText(level.tone);

    this.drivingSystem.setRoadSpeed(level.roadSpeed);
    this.obstacleSystem.configureLevel(level.obstacleSpeed, level.obstacleSpawnMs);
    this.obstacleSystem.resetForLevel();
    this.stressSystem.configureLevel(level.maxStress);
    this.stressSystem.reset();
    this.runScore.reset();
    this.crashCount = 0;
    this.remainingStorySeconds = level.storyTimeSeconds;
    this.phoneUI.setStoryTimeRemaining(this.remainingStorySeconds);
    this.phoneUI.setIdleBeforeConversation();
    this.transitioningLevel = false;
  }

  private showLevelIntro(): void {
    const level = this.levelManager.getCurrentLevel();
    new LevelIntroOverlay(this, {
      title: level.title,
      lines: level.introNarration,
      onComplete: () => {
        this.beginGameplay();
      }
    });
  }

  private beginGameplay(): void {
    const level = this.levelManager.getCurrentLevel();
    this.introDismissed = true;
    this.typingSystem.startLevel(this.dialogueManager.getPrompts(level.id));
  }

  private handleLevelComplete(): void {
    this.transitioningLevel = true;
    this.gameOver = true;
    const level = this.levelManager.getCurrentLevel();
    const storyLeft = this.remainingStorySeconds;

    this.runScore.addLevelComplete();
    this.runScore.addTimeBonus(storyLeft);
    if (this.crashCount === 0) {
      this.runScore.addNoCrashBonus();
    }

    const score = this.runScore.getScore();
    const nextLevelId = this.levelManager.getNextLevelId();
    const aftermathLines = this.dialogueManager.getOutcomeLines(level.id, "success");

    this.time.delayedCall(450, () => {
      this.scene.start("ResultScene", {
        outcome: "success",
        levelId: level.id,
        levelTitle: level.title,
        score,
        reason: undefined,
        nextLevelId,
        aftermathLines
      });
    });
  }
}
