import Phaser from "phaser";
import type { PhoneLayout } from "./GameplayLayout";
import { UiTheme } from "./UiTheme";

export class PhoneUI {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly frame: Phaser.GameObjects.Rectangle;
  private readonly headerBar: Phaser.GameObjects.Rectangle;
  private readonly headerText: Phaser.GameObjects.Text;
  private readonly incomingText: Phaser.GameObjects.Text;
  private readonly targetText: Phaser.GameObjects.Text;
  private readonly inputPanel: Phaser.GameObjects.Rectangle;
  private readonly inputLabel: Phaser.GameObjects.Text;
  private readonly typedText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly vibrationOverlay: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, initial: PhoneLayout) {
    this.scene = scene;

    this.frame = scene.add.rectangle(0, 0, 1, 1, 0x0b1220, 0.92);
    this.frame.setStrokeStyle(1, 0x334155, 0.9);

    this.headerBar = scene.add.rectangle(0, 0, 1, 1, 0x111827, 1);
    this.headerBar.setStrokeStyle(1, 0x1e293b, 0.6);

    this.headerText = scene.add
      .text(0, 0, "messages", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.phoneHeader,
        color: UiTheme.colors.title
      })
      .setOrigin(0, 0);

    this.incomingText = scene.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.phoneBody,
        color: UiTheme.colors.accent,
        wordWrap: { width: 280 }
      })
      .setOrigin(0, 0);

    this.targetText = scene.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.phoneBody,
        color: UiTheme.colors.title,
        wordWrap: { width: 280 }
      })
      .setOrigin(0, 0);

    this.inputPanel = scene.add.rectangle(0, 0, 1, 1, 0x1e293b, 0.94);
    this.inputPanel.setStrokeStyle(1, 0x475569, 0.75);

    this.inputLabel = scene.add
      .text(0, 0, "your reply", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.accent
      })
      .setOrigin(0, 0);

    this.vibrationOverlay = scene.add.rectangle(0, 0, 1, 1, 0xf8fafc, 0);

    this.typedText = scene.add
      .text(0, 0, "", {
        fontFamily: "Consolas, monospace",
        fontSize: UiTheme.sizes.phoneMono,
        color: UiTheme.colors.title,
        wordWrap: { width: 268 }
      })
      .setOrigin(0, 0);

    this.statusText = scene.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.muted
      })
      .setOrigin(0, 0);

    this.container = scene.add.container(0, 0, [
      this.frame,
      this.headerBar,
      this.headerText,
      this.incomingText,
      this.targetText,
      this.inputPanel,
      this.inputLabel,
      this.vibrationOverlay,
      this.typedText,
      this.statusText
    ]);
    this.container.setDepth(20);

    this.applyLayout(initial);
  }

  public applyLayout(phone: PhoneLayout): void {
    const { centerX, centerY, width, height } = phone;
    const halfW = width * 0.5;
    const halfH = height * 0.5;
    const padX = 10;
    const innerW = width - padX * 2;
    const headerH = 40;

    this.frame.setPosition(centerX, centerY);
    this.frame.setSize(width, height);

    const headerTop = centerY - halfH + 8;
    this.headerBar.setPosition(centerX, headerTop + headerH * 0.5);
    this.headerBar.setSize(innerW, headerH);

    const left = centerX - halfW + padX;
    this.headerText.setPosition(left, headerTop + 6);

    let y = headerTop + headerH + 10;
    this.incomingText.setPosition(left, y);
    this.incomingText.setWordWrapWidth(Math.max(160, innerW - 4), true);

    y += 52;
    this.targetText.setPosition(left, y);
    this.targetText.setWordWrapWidth(Math.max(160, innerW - 4), true);

    const inputH = Phaser.Math.Clamp(Math.round(height * 0.28), 120, 168);
    const inputTop = centerY + halfH - inputH - padX - 28;
    this.inputPanel.setPosition(centerX, inputTop + inputH * 0.5);
    this.inputPanel.setSize(innerW - 4, inputH);

    this.inputLabel.setPosition(left + 2, inputTop + 8);
    this.typedText.setPosition(left + 2, inputTop + 32);
    this.typedText.setWordWrapWidth(Math.max(160, innerW - 12), true);

    this.statusText.setPosition(left + 2, inputTop + inputH - 26);

    this.vibrationOverlay.setPosition(centerX, centerY);
    this.vibrationOverlay.setSize(width - 8, height - 8);
  }

  public setDepth(depth: number): void {
    this.container.setDepth(depth);
  }

  /** Clears thread until the first real prompt (e.g. during level intro). */
  public setIdleBeforeConversation(): void {
    this.incomingText.setText("");
    this.targetText.setText("");
    this.typedText.setText("_");
    this.statusText.setText("messages appear after you continue");
    this.statusText.setColor(UiTheme.colors.muted);
  }

  public setPrompt(incoming: string, exactReply: string): void {
    this.incomingText.setText(`incoming: ${incoming}`);
    this.targetText.setText(`reply exactly:\n${exactReply}`);
    this.statusText.setText("type while driving");
    this.setTypedValue("");
  }

  public setTypedValue(value: string): void {
    this.typedText.setText(value.length > 0 ? value : "_");
  }

  public setStatus(message: string, color: string = UiTheme.colors.muted): void {
    this.statusText.setText(message);
    this.statusText.setColor(color);
  }

  public vibrate(durationSeconds: number): void {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.vibrationOverlay);

    this.scene.tweens.add({
      targets: this.container,
      x: { from: -5, to: 5 },
      duration: 40,
      yoyo: true,
      repeat: Math.floor((durationSeconds * 1000) / 40),
      onComplete: () => {
        this.container.x = 0;
      }
    });

    this.scene.tweens.add({
      targets: this.vibrationOverlay,
      alpha: { from: 0.18, to: 0 },
      duration: 72,
      yoyo: true,
      repeat: Math.floor((durationSeconds * 1000) / 72)
    });
  }
}
