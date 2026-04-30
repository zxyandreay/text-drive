import Phaser from "phaser";
import { PhoneUI } from "../ui/PhoneUI";
import type { DialoguePrompt } from "../types/LevelTypes";

export type TypingFailureReason = "wrong_input" | "timeout";
export type TypingIncident = {
  reason: TypingFailureReason;
};

export class TypingSystem {
  private readonly scene: Phaser.Scene;
  private readonly phoneUI: PhoneUI;
  private prompts: DialoguePrompt[] = [];

  private currentIndex = 0;
  private typedValue = "";
  private completedCount = 0;
  private remainingSeconds = 0;
  private completed = false;
  private acceptingInput = true;
  private recoverTimer = 0;
  private incidentQueue: TypingIncident[] = [];

  constructor(scene: Phaser.Scene, phoneUI: PhoneUI) {
    this.scene = scene;
    this.phoneUI = phoneUI;
  }

  public create(): void {
    this.scene.input.keyboard?.on("keydown", this.handleKeyDown, this);
  }

  public startLevel(prompts: DialoguePrompt[]): void {
    this.prompts = prompts;
    this.currentIndex = 0;
    this.typedValue = "";
    this.completedCount = 0;
    this.remainingSeconds = 0;
    this.completed = false;
    this.acceptingInput = true;
    this.recoverTimer = 0;
    this.incidentQueue = [];
    this.loadPrompt(0);
  }

  public isCompleted(): boolean {
    return this.completed;
  }

  public isUnderPressure(): boolean {
    return !this.completed && this.prompts.length > 0;
  }

  public pollIncident(): TypingIncident | null {
    return this.incidentQueue.shift() ?? null;
  }

  public update(deltaSeconds: number): void {
    if (this.completed) {
      return;
    }

    if (!this.acceptingInput) {
      this.recoverTimer = Math.max(0, this.recoverTimer - deltaSeconds);
      this.phoneUI.setStatus("Refocus...", "#fda4af");
      if (this.recoverTimer <= 0) {
        this.loadPrompt(this.currentIndex);
        this.acceptingInput = true;
      }
      return;
    }

    this.remainingSeconds = Math.max(0, this.remainingSeconds - deltaSeconds);
    this.phoneUI.setTimer(this.remainingSeconds);

    if (this.remainingSeconds <= 0) {
      this.raiseIncident("timeout", "Message timed out");
    }
  }

  private loadPrompt(index: number): void {
    if (this.prompts.length === 0) {
      return;
    }

    const wrapped = index % this.prompts.length;
    this.currentIndex = wrapped;
    this.typedValue = "";
    const prompt = this.prompts[wrapped];
    this.remainingSeconds = prompt.timeLimitSeconds;
    this.phoneUI.setPrompt(prompt.incoming, prompt.reply);
    this.phoneUI.setTypedValue(this.typedValue);
    this.phoneUI.setTimer(this.remainingSeconds);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.acceptingInput || !this.isUnderPressure()) {
      return;
    }

    const prompt = this.prompts[this.currentIndex];

    if (event.key === "Backspace") {
      event.preventDefault();
      this.typedValue = this.typedValue.slice(0, -1);
      this.phoneUI.setTypedValue(this.typedValue);
      this.phoneUI.setStatus("Correct mistakes fast");
      return;
    }

    if (event.key === "Enter") {
      if (this.typedValue === prompt.reply) {
        this.completedCount += 1;
        if (this.completedCount >= this.prompts.length) {
          this.completed = true;
          this.phoneUI.setStatus("Message queue clear", "#86efac");
          this.phoneUI.setTimer(0);
        } else {
          this.phoneUI.setStatus("Sent. New message incoming...", "#86efac");
          this.scene.time.delayedCall(700, () => {
            this.loadPrompt(this.currentIndex + 1);
          });
        }
      } else {
        this.raiseIncident("wrong_input", "Wrong reply under pressure");
      }
      return;
    }

    if (event.key.length === 1) {
      this.typedValue += event.key;
      this.phoneUI.setTypedValue(this.typedValue);

      if (prompt.reply.startsWith(this.typedValue)) {
        this.phoneUI.setStatus("Keep going");
      } else {
        this.raiseIncident("wrong_input", "Wrong input under pressure");
      }
    }
  }

  private raiseIncident(reason: TypingFailureReason, message: string): void {
    this.acceptingInput = false;
    this.recoverTimer = 0.9;
    this.typedValue = "";
    this.phoneUI.setTypedValue(this.typedValue);
    this.phoneUI.setStatus(message, "#fca5a5");
    this.incidentQueue.push({ reason });
  }
}
