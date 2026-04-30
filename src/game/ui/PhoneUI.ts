import Phaser from "phaser";

export class PhoneUI {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly incomingText: Phaser.GameObjects.Text;
  private readonly targetText: Phaser.GameObjects.Text;
  private readonly typedText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly vibrationOverlay: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const phoneX = 690;
    const phoneY = 300;
    const phoneWidth = 390;
    const phoneHeight = 470;

    const frame = scene.add.rectangle(phoneX, phoneY, phoneWidth, phoneHeight, 0x0b1220, 0.95);
    frame.setStrokeStyle(2, 0x334155);

    const header = scene.add.rectangle(phoneX, phoneY - 202, phoneWidth - 14, 46, 0x111827, 1);
    const headerText = scene.add
      .text(phoneX - 178, phoneY - 216, "Messages", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#e2e8f0"
      })
      .setOrigin(0, 0);

    this.incomingText = scene.add
      .text(phoneX - 178, phoneY - 168, "", {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#bfdbfe",
        wordWrap: { width: 350 }
      })
      .setOrigin(0, 0);

    this.targetText = scene.add
      .text(phoneX - 178, phoneY - 95, "", {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#f8fafc",
        wordWrap: { width: 350 }
      })
      .setOrigin(0, 0);

    const inputPanel = scene.add.rectangle(phoneX, phoneY + 123, phoneWidth - 24, 170, 0x1e293b, 0.95);
    inputPanel.setStrokeStyle(1, 0x475569);
    this.vibrationOverlay = scene.add.rectangle(phoneX, phoneY, phoneWidth - 12, phoneHeight - 12, 0xf8fafc, 0);

    this.typedText = scene.add
      .text(phoneX - 170, phoneY + 66, "", {
        fontFamily: "Consolas, monospace",
        fontSize: "20px",
        color: "#f8fafc",
        wordWrap: { width: 340 }
      })
      .setOrigin(0, 0);

    this.statusText = scene.add
      .text(phoneX - 170, phoneY + 156, "", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#94a3b8"
      })
      .setOrigin(0, 0);

    this.timerText = scene.add
      .text(phoneX + 170, phoneY + 156, "", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#fca5a5"
      })
      .setOrigin(1, 0);

    this.container = scene.add.container(0, 0, [
      frame,
      header,
      headerText,
      this.incomingText,
      this.targetText,
      inputPanel,
      this.vibrationOverlay,
      this.typedText,
      this.statusText,
      this.timerText
    ]);
    this.container.setDepth(20);
  }

  public setPrompt(incoming: string, exactReply: string): void {
    this.incomingText.setText(`Incoming: ${incoming}`);
    this.targetText.setText(`Reply exactly:\n"${exactReply}"`);
    this.statusText.setText("Type while driving");
    this.setTypedValue("");
  }

  public setTypedValue(value: string): void {
    this.typedText.setText(value.length > 0 ? value : "_");
  }

  public setStatus(message: string, color = "#94a3b8"): void {
    this.statusText.setText(message);
    this.statusText.setColor(color);
  }

  public setTimer(secondsRemaining: number): void {
    this.timerText.setText(`Time: ${secondsRemaining.toFixed(1)}s`);
    if (secondsRemaining <= 2.5) {
      this.timerText.setColor("#f87171");
    } else if (secondsRemaining <= 4) {
      this.timerText.setColor("#fb923c");
    } else {
      this.timerText.setColor("#fca5a5");
    }
  }

  public vibrate(durationSeconds: number): void {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.vibrationOverlay);

    this.scene.tweens.add({
      targets: this.container,
      x: { from: -7, to: 7 },
      duration: 44,
      yoyo: true,
      repeat: Math.floor((durationSeconds * 1000) / 44),
      onComplete: () => {
        this.container.x = 0;
      }
    });

    this.scene.tweens.add({
      targets: this.vibrationOverlay,
      alpha: { from: 0.22, to: 0 },
      duration: 80,
      yoyo: true,
      repeat: Math.floor((durationSeconds * 1000) / 80)
    });
  }
}
