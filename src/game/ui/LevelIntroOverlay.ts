import Phaser from "phaser";

export type LevelIntroOverlayOptions = {
  title: string;
  lines: string[];
  onComplete: () => void;
  onBack?: () => void;
};

/**
 * Full-screen narration before gameplay: fade in, wait for key or click, fade out, destroy.
 */
export class LevelIntroOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly onComplete: () => void;
  private readonly onBack?: () => void;
  private phase: "entering" | "ready" | "dismissing" = "entering";
  private minDismissAt = 0;

  constructor(scene: Phaser.Scene, options: LevelIntroOverlayOptions) {
    this.onComplete = options.onComplete;
    this.onBack = options.onBack;

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
      .text(width / 2, height * 0.78, "space / enter / click to continue", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#94a3b8"
      })
      .setOrigin(0.5, 0.5);

    const children: Phaser.GameObjects.GameObject[] = [backdrop, titleText, bodyText, hintText];

    const fadeOutAnd = (then: () => void): void => {
      scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 280,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.container.destroy(true);
          then();
        }
      });
    };

    const detachInput = (): void => {
      scene.input.keyboard?.off("keydown", onKey);
      backdrop.off("pointerup", dismiss);
    };

    const dismiss = (): void => {
      if (this.phase !== "ready" || scene.time.now < this.minDismissAt) {
        return;
      }
      this.phase = "dismissing";
      detachInput();
      fadeOutAnd(() => {
        this.onComplete();
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

    if (this.onBack) {
      const bx = 24 + 56;
      const by = 28 + 22;
      const backBg = scene.add.rectangle(bx, by, 112, 40, 0x334155, 0.95);
      backBg.setStrokeStyle(1, 0x64748b, 0.9);
      backBg.setInteractive({ useHandCursor: true });
      const backLabel = scene.add
        .text(bx, by, "← levels", {
          fontFamily: "Arial",
          fontSize: "16px",
          color: "#e2e8f0"
        })
        .setOrigin(0.5);
      backBg.on("pointerup", () => {
        if (this.phase !== "ready" || scene.time.now < this.minDismissAt) {
          return;
        }
        this.phase = "dismissing";
        detachInput();
        fadeOutAnd(() => {
          this.onBack?.();
        });
      });
      children.push(backBg, backLabel);
    }

    this.container = scene.add.container(0, 0, children);
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

    this.minDismissAt = scene.time.now + 150;
    scene.input.keyboard?.on("keydown", onKey);
    backdrop.on("pointerup", dismiss);
  }
}
