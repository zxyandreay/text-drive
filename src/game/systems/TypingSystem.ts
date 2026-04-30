import Phaser from "phaser";
import { PhoneUI } from "../ui/PhoneUI";
import type { DialoguePrompt } from "../types/LevelTypes";

export type TypingFailureReason = "wrong_input";
export type TypingIncident = {
  reason: TypingFailureReason;
};

const REPLY_HINT_DELAY_MS = 850;

function normalizeForCompare(value: string): string {
  return value.trim().toLowerCase();
}

export class TypingSystem {
  private readonly scene: Phaser.Scene;
  private readonly phoneUI: PhoneUI;
  private prompts: DialoguePrompt[] = [];

  private currentIndex = 0;
  private typedValue = "";
  private completedCount = 0;
  private completed = false;
  private incidentQueue: TypingIncident[] = [];
  private onCorrectReply?: () => void;
  private hintRevealTimer?: Phaser.Time.TimerEvent;
  private nextPromptTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, phoneUI: PhoneUI) {
    this.scene = scene;
    this.phoneUI = phoneUI;
  }

  public setOnCorrectReply(callback: () => void): void {
    this.onCorrectReply = callback;
  }

  public create(): void {
    this.scene.input.keyboard?.on("keydown", this.handleKeyDown, this);
    this.scene.events.once("shutdown", this.dispose, this);
  }

  private cancelTimers(): void {
    this.hintRevealTimer?.remove();
    this.hintRevealTimer = undefined;
    this.nextPromptTimer?.remove();
    this.nextPromptTimer = undefined;
  }

  private dispose(): void {
    this.cancelTimers();
    this.scene.input.keyboard?.off("keydown", this.handleKeyDown, this);
  }

  public startLevel(prompts: DialoguePrompt[]): void {
    this.prompts = prompts;
    this.currentIndex = 0;
    this.typedValue = "";
    this.completedCount = 0;
    this.completed = false;
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

  public update(_deltaSeconds: number): void {
    // Per-reply timers removed; story timer lives in GameScene.
  }

  private loadPrompt(index: number): void {
    if (this.prompts.length === 0) {
      return;
    }

    this.cancelTimers();

    const wrapped = index % this.prompts.length;
    this.currentIndex = wrapped;
    this.typedValue = "";
    const prompt = this.prompts[wrapped];

    this.phoneUI.showIncoming(prompt.incoming);
    this.phoneUI.clearReplyHint();
    this.phoneUI.refreshTypedDisplay("", prompt.reply);
    this.phoneUI.setStatus("type while driving");

    this.hintRevealTimer = this.scene.time.delayedCall(REPLY_HINT_DELAY_MS, () => {
      this.hintRevealTimer = undefined;
      if (!this.isUnderPressure()) {
        return;
      }
      const p = this.prompts[this.currentIndex];
      if (!p) {
        return;
      }
      this.phoneUI.setReplyHint(p.reply);
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isUnderPressure()) {
      return;
    }

    const prompt = this.prompts[this.currentIndex];
    const expected = normalizeForCompare(prompt.reply);

    if (event.key === "Backspace") {
      event.preventDefault();
      this.typedValue = this.typedValue.slice(0, -1);
      this.phoneUI.refreshTypedDisplay(this.typedValue, prompt.reply);
      this.phoneUI.setStatus("edit anytime");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const submitted = normalizeForCompare(this.typedValue);
      if (submitted === expected) {
        this.cancelTimers();
        this.phoneUI.clearReplyHint();
        this.onCorrectReply?.();
        this.completedCount += 1;
        if (this.completedCount >= this.prompts.length) {
          this.completed = true;
          this.phoneUI.setStatus("all messages sent", "#86efac");
        } else {
          this.phoneUI.setStatus("sent next message soon", "#86efac");
          this.nextPromptTimer = this.scene.time.delayedCall(500, () => {
            this.nextPromptTimer = undefined;
            this.loadPrompt(this.currentIndex + 1);
          });
        }
      } else {
        this.phoneUI.setStatus("wrong reply press enter to try again", "#fca5a5");
        this.incidentQueue.push({ reason: "wrong_input" });
      }
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.typedValue += event.key;
      this.phoneUI.refreshTypedDisplay(this.typedValue, prompt.reply);
      this.phoneUI.setStatus("press enter when ready");
    }
  }
}
