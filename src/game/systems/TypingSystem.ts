import Phaser from "phaser";
import { PhoneUI } from "../ui/PhoneUI";
import type { DialoguePrompt } from "../types/LevelTypes";
import { getMessagePacing, type MessagePacing } from "../ui/messagePacing";

export type TypingFailureReason = "wrong_input";
export type TypingIncident = {
  reason: TypingFailureReason;
};

function normalizeForCompare(value: string): string {
  return value.trim().toLowerCase();
}

function nextIncomingWithJitter(baseMs: number): number {
  const j = Phaser.Math.Between(-40, 40);
  return Math.max(400, baseMs + j);
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

  private pacing: MessagePacing = getMessagePacing("");
  private composeActive = false;
  private exchangeGeneration = 0;

  private incomingDelayTimer?: Phaser.Time.TimerEvent;
  private typingIndicatorTimer?: Phaser.Time.TimerEvent;
  private hintRevealTimer?: Phaser.Time.TimerEvent;
  private sendBeatTimer?: Phaser.Time.TimerEvent;
  private nextExchangeTimer?: Phaser.Time.TimerEvent;

  private gameplayInputBlocked = false;

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

  private cancelExchangeTimers(): void {
    this.incomingDelayTimer?.remove();
    this.incomingDelayTimer = undefined;
    this.typingIndicatorTimer?.remove();
    this.typingIndicatorTimer = undefined;
    this.hintRevealTimer?.remove();
    this.hintRevealTimer = undefined;
    this.sendBeatTimer?.remove();
    this.sendBeatTimer = undefined;
    this.nextExchangeTimer?.remove();
    this.nextExchangeTimer = undefined;
  }

  private dispose(): void {
    this.cancelExchangeTimers();
    this.scene.input.keyboard?.off("keydown", this.handleKeyDown, this);
  }

  public startLevel(prompts: DialoguePrompt[], levelId: string): void {
    this.pacing = getMessagePacing(levelId);
    this.phoneUI.clearThread();
    this.prompts = prompts;
    this.currentIndex = 0;
    this.typedValue = "";
    this.completedCount = 0;
    this.completed = false;
    this.incidentQueue = [];
    this.composeActive = false;
    this.exchangeGeneration = 0;
    this.cancelExchangeTimers();
    this.loadPrompt(0);
  }

  public isCompleted(): boolean {
    return this.completed;
  }

  /** Successfully submitted replies this level (increments only on correct Enter). */
  public getCompletedDialogueSteps(): number {
    return this.completedCount;
  }

  /** Total dialogue exchanges in the active level (prompts length). */
  public getDialogueStepTotal(): number {
    return this.prompts.length;
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

  /** When true, reply typing (including Enter/Backspace) is ignored — used during gameplay pause. */
  public setGameplayInputBlocked(blocked: boolean): void {
    this.gameplayInputBlocked = blocked;
  }

  /** Pause/resume message-exchange timers without removing them (gameplay pause). */
  public setExchangeTimersPaused(paused: boolean): void {
    const setPaused = (ev?: Phaser.Time.TimerEvent): void => {
      if (ev) {
        ev.paused = paused;
      }
    };
    setPaused(this.incomingDelayTimer);
    setPaused(this.typingIndicatorTimer);
    setPaused(this.hintRevealTimer);
    setPaused(this.sendBeatTimer);
    setPaused(this.nextExchangeTimer);
  }

  private scheduleHintReveal(gen: number, prompt: DialoguePrompt): void {
    this.hintRevealTimer = this.scene.time.delayedCall(this.pacing.hintDelayMs, () => {
      this.hintRevealTimer = undefined;
      if (gen !== this.exchangeGeneration) {
        return;
      }
      if (!this.isUnderPressure()) {
        return;
      }
      const p = this.prompts[this.currentIndex];
      const sameExchange =
        !!p && p.reply === prompt.reply && p.incoming === prompt.incoming;
      if (!sameExchange) {
        return;
      }
      const expectedIncoming = normalizeForCompare(prompt.incoming);
      const lastPartner = this.phoneUI.getLastPartnerMessageBody();
      if (lastPartner !== expectedIncoming) {
        this.phoneUI.appendPartnerMessage(prompt.incoming);
      }
      this.phoneUI.setReplyHint(p.reply);
      this.composeActive = true;
      this.phoneUI.setStatus("type while driving");
    });
  }

  private revealPartnerAndHint(gen: number, prompt: DialoguePrompt): void {
    this.phoneUI.setTypingIndicator(false);
    this.phoneUI.appendPartnerMessage(prompt.incoming);
    this.phoneUI.setStatus("read the message");
    this.scheduleHintReveal(gen, prompt);
  }

  private loadPrompt(index: number): void {
    if (this.prompts.length === 0) {
      return;
    }

    this.cancelExchangeTimers();
    this.exchangeGeneration += 1;
    const gen = this.exchangeGeneration;

    this.composeActive = false;
    this.phoneUI.setTypingIndicator(false);

    const wrapped = index % this.prompts.length;
    this.currentIndex = wrapped;
    this.typedValue = "";
    const prompt = this.prompts[wrapped];

    this.phoneUI.clearReplyHint();
    this.phoneUI.refreshTypedDisplay("", prompt.reply);
    this.phoneUI.setStatus("incoming…");

    this.incomingDelayTimer = this.scene.time.delayedCall(this.pacing.incomingDelayMs, () => {
      this.incomingDelayTimer = undefined;
      if (gen !== this.exchangeGeneration) {
        return;
      }
      if (!this.isUnderPressure()) {
        return;
      }

      if (this.pacing.typingIndicatorMs > 0) {
        this.phoneUI.setTypingIndicator(true);
        this.typingIndicatorTimer = this.scene.time.delayedCall(this.pacing.typingIndicatorMs, () => {
          this.typingIndicatorTimer = undefined;
          if (gen !== this.exchangeGeneration) {
            return;
          }
          if (!this.isUnderPressure()) {
            return;
          }
          this.revealPartnerAndHint(gen, prompt);
        });
      } else {
        this.revealPartnerAndHint(gen, prompt);
      }
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.gameplayInputBlocked) {
      return;
    }

    if (!this.isUnderPressure()) {
      return;
    }

    if (!this.composeActive) {
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
        const genAtSubmit = this.exchangeGeneration;
        this.cancelExchangeTimers();
        this.composeActive = false;
        this.phoneUI.clearReplyHint();
        this.phoneUI.refreshTypedDisplay("", "");
        this.typedValue = "";

        this.completedCount += 1;
        this.onCorrectReply?.();

        if (this.completedCount >= this.prompts.length) {
          this.sendBeatTimer = this.scene.time.delayedCall(this.pacing.sendBeatMs, () => {
            this.sendBeatTimer = undefined;
            if (genAtSubmit !== this.exchangeGeneration) {
              return;
            }
            this.phoneUI.appendPlayerMessage(submitted);
            this.completed = true;
            this.phoneUI.setStatus("all messages sent", "#86efac");
          });
        } else {
          this.phoneUI.setStatus("sending…", "#86efac");
          this.sendBeatTimer = this.scene.time.delayedCall(this.pacing.sendBeatMs, () => {
            this.sendBeatTimer = undefined;
            if (genAtSubmit !== this.exchangeGeneration) {
              return;
            }
            this.phoneUI.appendPlayerMessage(submitted);
            this.phoneUI.setStatus("sent", "#86efac");
            const wait = nextIncomingWithJitter(this.pacing.nextIncomingMs);
            this.nextExchangeTimer = this.scene.time.delayedCall(wait, () => {
              this.nextExchangeTimer = undefined;
              if (genAtSubmit !== this.exchangeGeneration) {
                return;
              }
              this.loadPrompt(this.currentIndex + 1);
            });
          });
        }
      } else {
        this.phoneUI.setStatus("wrong reply press enter to try again", "#fca5a5");
        this.incidentQueue.push({ reason: "wrong_input" });
      }
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      this.typedValue += event.key;
      this.phoneUI.refreshTypedDisplay(this.typedValue, prompt.reply);
      this.phoneUI.setStatus("press enter when ready");
    }
  }
}
