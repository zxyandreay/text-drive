import Phaser from "phaser";
import { DrivingSystem } from "./systems/DrivingSystem";
import { ObstacleSystem } from "./systems/ObstacleSystem";
import { PhoneUI } from "./ui/PhoneUI";
import { TypingSystem } from "./systems/TypingSystem";
import { StressSystem } from "./systems/StressSystem";
import { DialogueManager } from "./managers/DialogueManager";
import { LevelManager } from "./managers/LevelManager";
import levelsData from "../data/levels.json";
import dialogueData from "../data/dialogue.json";
import type { LevelConfig } from "./types/LevelTypes";

export class GameScene extends Phaser.Scene {
  private readonly roadBounds = { left: 250, right: 650 };
  private drivingSystem!: DrivingSystem;
  private obstacleSystem!: ObstacleSystem;
  private typingSystem!: TypingSystem;
  private stressSystem!: StressSystem;
  private levelManager!: LevelManager;
  private dialogueManager!: DialogueManager;
  private statusText!: Phaser.GameObjects.Text;
  private levelTitleText!: Phaser.GameObjects.Text;
  private narrativeText!: Phaser.GameObjects.Text;
  private gameOver = false;
  private transitioningLevel = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#020617");

    this.levelTitleText = this.add
      .text(width / 2, 24, "TEXT DRIVE", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5, 0);

    this.add
      .text(14, 72, "Mouse: steer", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#94a3b8"
      })
      .setOrigin(0, 0);
    this.add
      .text(14, 96, "Keyboard: type exact reply + Enter (Backspace works)", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#94a3b8"
      })
      .setOrigin(0, 0);
    this.add
      .text(14, 120, "Mistakes raise stress. Overload ends the run.", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#94a3b8"
      })
      .setOrigin(0, 0);

    this.narrativeText = this.add
      .text(14, 146, "", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#cbd5e1",
        wordWrap: { width: 420 }
      })
      .setOrigin(0, 0);

    this.drivingSystem = new DrivingSystem(this, this.roadBounds);
    this.drivingSystem.create();

    this.obstacleSystem = new ObstacleSystem(this, this.roadBounds);
    const phoneUI = new PhoneUI(this);
    this.typingSystem = new TypingSystem(this, phoneUI);
    this.typingSystem.create();
    this.stressSystem = new StressSystem(this, this.drivingSystem, this.obstacleSystem, phoneUI);
    this.levelManager = new LevelManager(levelsData as LevelConfig[]);
    this.dialogueManager = new DialogueManager(dialogueData);

    this.statusText = this.add
      .text(width / 2, height - 20, "Drive and type simultaneously", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#cbd5e1"
      })
      .setOrigin(0.5, 1);

    this.startCurrentLevel();
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) {
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

    const typingIncident = this.typingSystem.pollIncident();
    if (typingIncident) {
      this.stressSystem.applyIncident(typingIncident.reason);
    }

    if (this.obstacleSystem.consumeCrashEvent() && this.typingSystem.isUnderPressure()) {
      this.stressSystem.applyIncident("crash");
    }

    if (this.typingSystem.isCompleted() && !this.obstacleSystem.isCrashed()) {
      this.statusText.setText("Conversation complete. Hold the lane.");
      this.statusText.setColor("#86efac");
    } else {
      this.statusText.setText(
        `Stress ${this.stressSystem.getStress()}/${this.stressSystem.getMaxStress()} - survive pressure`
      );
      this.statusText.setColor("#cbd5e1");
    }

    if (this.stressSystem.isOverloaded()) {
      this.endRun("Failure: cognitive overload");
      return;
    }

    if (this.typingSystem.isCompleted() && !this.transitioningLevel) {
      this.handleLevelComplete();
    }
  }

  private endRun(message: string): void {
    this.gameOver = true;
    this.statusText.setText(`${message} - refresh to retry`);
    this.statusText.setColor("#fca5a5");
  }

  private startCurrentLevel(): void {
    const level = this.levelManager.getCurrentLevel();
    const intro = this.dialogueManager.getIntro(level.id);

    this.levelTitleText.setText(
      `${level.title} (${this.levelManager.getCurrentLevelNumber()}/${this.levelManager.getTotalLevels()})`
    );
    this.narrativeText.setText(`${level.tone}\n${intro}`);

    this.drivingSystem.setRoadSpeed(level.roadSpeed);
    this.obstacleSystem.configureLevel(level.obstacleSpeed, level.obstacleSpawnMs);
    this.obstacleSystem.resetForLevel();
    this.stressSystem.configureLevel(level.maxStress);
    this.stressSystem.reset();
    this.typingSystem.startLevel(this.dialogueManager.getPrompts(level.id));
    this.transitioningLevel = false;
  }

  private handleLevelComplete(): void {
    this.transitioningLevel = true;
    const currentLevel = this.levelManager.getCurrentLevel();
    const outro = this.dialogueManager.getOutro(currentLevel.id);
    this.statusText.setText(outro);
    this.statusText.setColor("#86efac");

    if (!this.levelManager.advanceLevel()) {
      this.gameOver = true;
      this.time.delayedCall(900, () => {
        this.scene.start("EndingScene", {
          finalMessage:
            "You made it to the end of the road.\nBut every message demanded attention that driving needed.\nNo reply is worth a life."
        });
      });
      return;
    }

    this.time.delayedCall(1400, () => {
      this.startCurrentLevel();
    });
  }
}
