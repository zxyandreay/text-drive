import Phaser from "phaser";
import { formatNarrativeBody, getNarrativeColumnWidth } from "./narrativeLayout";
import { UiTheme } from "./UiTheme";

export type LevelIntroOverlayOptions = {
  title: string;
  lines: string[];
  onComplete: () => void;
  onBack?: () => void;
};

const H_MARGIN = 56;
const TITLE_TOP_FRAC = 0.16;
const GAP_TITLE_BODY = 22;
const GAP_BODY_HINT = 40;

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

    const usableW = width - H_MARGIN * 2;
    const maxCol = getNarrativeColumnWidth(usableW);

    const bodyStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: UiTheme.fontFamily,
      fontSize: UiTheme.sizes.resultBody,
      color: UiTheme.colors.body,
      align: "center",
      lineSpacing: UiTheme.narrative.introLineSpacing
    };

    const bodyString = formatNarrativeBody(scene, options.lines, bodyStyle, maxCol);

    let y = height * TITLE_TOP_FRAC;

    const titleText = scene.add
      .text(width / 2, y, options.title, {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.titleLg,
        color: UiTheme.colors.title
      })
      .setOrigin(0.5, 0);
    y += titleText.height + GAP_TITLE_BODY;

    const bodyText = scene.add.text(width / 2, y, bodyString, bodyStyle).setOrigin(0.5, 0);
    y += bodyText.height + GAP_BODY_HINT;

    const hintText = scene.add
      .text(width / 2, y, "space / enter / click to continue", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.body,
        color: UiTheme.colors.muted
      })
      .setOrigin(0.5, 0);

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
          fontFamily: UiTheme.fontFamily,
          fontSize: UiTheme.sizes.titleMd,
          color: UiTheme.colors.title
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
