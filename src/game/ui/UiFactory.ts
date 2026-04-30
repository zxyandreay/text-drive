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

  public static createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    options?: ButtonOptions
  ): Phaser.GameObjects.Container {
    const width = options?.width ?? 240;
    const height = options?.height ?? 52;
    const backgroundColor = options?.backgroundColor ?? 0x1d4ed8;
    const labelColor = options?.labelColor ?? "#eff6ff";

    const bg = scene.add.rectangle(0, 0, width, height, backgroundColor, 0.95);
    bg.setStrokeStyle(1, 0x93c5fd, 0.85);

    const text = scene.add
      .text(0, 0, label, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: labelColor
      })
      .setOrigin(0.5);

    const button = scene.add.container(x, y, [bg, text]);
    button.setSize(width, height);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    button.on("pointerover", () => {
      bg.setScale(1.02);
      bg.setFillStyle(backgroundColor, 1);
    });
    button.on("pointerout", () => {
      bg.setScale(1);
      bg.setFillStyle(backgroundColor, 0.95);
    });
    button.on("pointerdown", () => {
      bg.setScale(0.98);
    });
    button.on("pointerup", () => {
      bg.setScale(1.02);
      onClick();
    });

    return button;
  }
}
