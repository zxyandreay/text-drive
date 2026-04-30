import Phaser from "phaser";

type ButtonOptions = {
  width?: number;
  height?: number;
  backgroundColor?: number;
  labelColor?: string;
};

export class UiFactory {
  public static createPanel(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    alpha = 0.88
  ): Phaser.GameObjects.Rectangle {
    const panel = scene.add.rectangle(x, y, width, height, 0x0f172a, alpha);
    panel.setStrokeStyle(2, 0x334155, 0.9);
    return panel;
  }

  /**
   * Interactive button: hitbox matches the visible rectangle (world x,y center).
   * Text is a separate object on top to avoid container hit-area issues under scale.
   */
  public static createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    options?: ButtonOptions
  ): Phaser.GameObjects.Rectangle {
    const width = options?.width ?? 240;
    const height = options?.height ?? 52;
    const backgroundColor = options?.backgroundColor ?? 0x1d4ed8;
    const labelColor = options?.labelColor ?? "#eff6ff";

    const bg = scene.add.rectangle(x, y, width, height, backgroundColor, 0.95);
    bg.setStrokeStyle(1, 0x93c5fd, 0.85);
    bg.setInteractive({ useHandCursor: true });

    const text = scene.add
      .text(x, y, label, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: labelColor
      })
      .setOrigin(0.5);
    text.setDepth(bg.depth + 1);

    bg.once("destroy", () => {
      if (text.active) {
        text.destroy();
      }
    });

    bg.on("pointerover", () => {
      bg.setScale(1.02);
      bg.setFillStyle(backgroundColor, 1);
    });
    bg.on("pointerout", () => {
      bg.setScale(1);
      bg.setFillStyle(backgroundColor, 0.95);
    });
    bg.on("pointerdown", () => {
      bg.setScale(0.98);
    });
    bg.on("pointerup", () => {
      bg.setScale(1.02);
      onClick();
    });

    return bg;
  }
}
