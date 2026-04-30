import Phaser from "phaser";

export type LevelIntroOverlayOptions = {
  title: string;
  lines: string[];
  onComplete: () => void;
};

/**
 * Full-screen narration before gameplay: fade in, wait for key or click, fade out, destroy.
 */
export class LevelIntroOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly onComplete: () => void;
  private phase: "entering" | "ready" | "dismissing" = "entering";
  private minDismissAt = 0;

  constructor(scene: Phaser.Scene, options: LevelIntroOverlayOptions) {
    this.onComplete = options.onComplete;

    const { width, height } = scene.scale;
    const backdrop = scene.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.92);
    backdrop.setStrokeStyle(2, 0x334155, 0.85);
    backdrop.setInteractive({ useHandCursor: true });

    const titleText = scene.add
      .text(width / 2, height * 0.28, options.title, {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5, 0.5);

    const body = options.lines.join("\n\n");
    const bodyText = scene.add
      .text(width / 2, height * 0.48, body, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#cbd5e1",
        align: "center",
        wordWrap: { width: Math.min(520, width - 80) }
      })
      .setOrigin(0.5, 0.5);

    const hintText = scene.add
      .text(width / 2, height * 0.78, "press space or enter or click to continue", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#94a3b8"
      })
      .setOrigin(0.5, 0.5);

    this.container = scene.add.container(0, 0, [backdrop, titleText, bodyText, hintText]);
    this.container.setDepth(120);
    this.container.setAlpha(0);

    scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 420,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.phase = "ready";
      }
    });

    const dismiss = (): void => {
      if (this.phase !== "ready" || scene.time.now < this.minDismissAt) {
        return;
      }
      this.phase = "dismissing";
      scene.input.keyboard?.off("keydown", onKey, this);
      backdrop.off("pointerup", dismiss, this);

      scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 320,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.container.destroy(true);
          this.onComplete();
        }
      });
    };

    const onKey = (event: KeyboardEvent): void => {
      if (this.phase !== "ready" || scene.time.now < this.minDismissAt) {
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        dismiss();
      }
    };

    this.minDismissAt = scene.time.now + 150;
    scene.input.keyboard?.on("keydown", onKey, this);
    backdrop.on("pointerup", dismiss, this);
  }
}
