import Phaser from "phaser";
import { UiTheme } from "./UiTheme";

export type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonOptions = {
  width?: number;
  height?: number;
  backgroundColor?: number;
  labelColor?: string;
  strokeColor?: number;
  /** When set, fills in colors unless overridden above. */
  variant?: ButtonVariant;
  /** Overrides default label font size (e.g. smaller nav). */
  labelFontSize?: string;
  /** Full CSS font shorthand for label (overrides labelFontSize + labelFontFamily). */
  labelFont?: string;
  /** Overrides `UiTheme.fontFamily` when `labelFont` is not set. */
  labelFontFamily?: string;
  /** Pixels; applied when supported. */
  labelLetterSpacing?: number;
  /** Rectangle stroke width (default 1). */
  buttonStrokeWidth?: number;
  /** When set, assigns depth to bg and bg+1 to label (menu layering). */
  buttonDepth?: number;
};

type ResolvedButtonStyle = {
  width: number;
  height: number;
  backgroundColor: number;
  labelColor: string;
  strokeColor: number;
  fillAlpha: number;
  hoverAlpha: number;
};

function resolveButtonStyle(options?: ButtonOptions): ResolvedButtonStyle {
  const variant = options?.variant ?? "primary";
  const width = options?.width ?? 240;
  const height = options?.height ?? 52;
  const b = UiTheme.buttons;

  let backgroundColor = options?.backgroundColor;
  let strokeColor = options?.strokeColor;
  let labelColor = options?.labelColor;
  let fillAlpha = 0.95;
  let hoverAlpha = 1;

  if (backgroundColor === undefined) {
    if (variant === "primary") {
      backgroundColor = b.primaryFill;
      strokeColor = strokeColor ?? b.primaryStroke;
      labelColor = labelColor ?? "#eff6ff";
    } else if (variant === "secondary") {
      backgroundColor = b.secondaryFill;
      strokeColor = strokeColor ?? b.secondaryStroke;
      labelColor = labelColor ?? UiTheme.colors.title;
    } else {
      backgroundColor = b.ghostFill;
      strokeColor = strokeColor ?? b.ghostStroke;
      labelColor = labelColor ?? UiTheme.colors.body;
      fillAlpha = 0.58;
      hoverAlpha = 0.88;
    }
  }
  backgroundColor = backgroundColor ?? b.primaryFill;
  strokeColor = strokeColor ?? b.primaryStroke;
  labelColor = labelColor ?? "#eff6ff";

  return {
    width,
    height,
    backgroundColor,
    labelColor,
    strokeColor,
    fillAlpha,
    hoverAlpha
  };
}

function addLabelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  s: ResolvedButtonStyle,
  options?: ButtonOptions
): Phaser.GameObjects.Text {
  const letterSpacing = options?.labelLetterSpacing;
  let text: Phaser.GameObjects.Text;
  if (options?.labelFont) {
    text = scene.add
      .text(x, y, label, {
        font: options.labelFont,
        color: s.labelColor
      })
      .setOrigin(0.5);
  } else {
    const fontSize = options?.labelFontSize ?? UiTheme.sizes.buttonDefault;
    const fontFamily = options?.labelFontFamily ?? UiTheme.fontFamily;
    text = scene.add
      .text(x, y, label, {
        fontFamily,
        fontSize,
        color: s.labelColor
      })
      .setOrigin(0.5);
  }
  if (letterSpacing !== undefined && typeof (text as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing === "function") {
    (text as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing(letterSpacing);
  }
  return text;
}

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
    const s = resolveButtonStyle(options);

    const bg = scene.add.rectangle(x, y, s.width, s.height, s.backgroundColor, s.fillAlpha);
    bg.setStrokeStyle(options?.buttonStrokeWidth ?? 1, s.strokeColor, 0.9);
    bg.setInteractive({ useHandCursor: true });

    const text = addLabelText(scene, x, y, label, s, options);
    const depthBase = options?.buttonDepth;
    if (depthBase !== undefined) {
      bg.setDepth(depthBase);
      text.setDepth(depthBase + 1);
    } else {
      text.setDepth(bg.depth + 1);
    }

    bg.once("destroy", () => {
      if (text.active) {
        text.destroy();
      }
    });

    bg.on("pointerover", () => {
      bg.setScale(1.02);
      text.setScale(1.02);
      bg.setFillStyle(s.backgroundColor, s.hoverAlpha);
    });
    bg.on("pointerout", () => {
      bg.setScale(1);
      text.setScale(1);
      bg.setFillStyle(s.backgroundColor, s.fillAlpha);
    });
    bg.on("pointerdown", () => {
      bg.setScale(0.98);
      text.setScale(0.98);
    });
    bg.on("pointerup", () => {
      bg.setScale(1.02);
      text.setScale(1.02);
      onClick();
    });

    return bg;
  }

  /**
   * Same as createButton but parents bg + label to a container (reliable teardown with phase roots).
   */
  public static createButtonInContainer(
    container: Phaser.GameObjects.Container,
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    options?: ButtonOptions
  ): Phaser.GameObjects.Rectangle {
    const s = resolveButtonStyle(options);

    const bg = scene.add.rectangle(x, y, s.width, s.height, s.backgroundColor, s.fillAlpha);
    bg.setStrokeStyle(options?.buttonStrokeWidth ?? 1, s.strokeColor, 0.9);
    bg.setInteractive({ useHandCursor: true });

    const text = addLabelText(scene, x, y, label, s, {
      ...options,
      labelFontSize: options?.labelFontSize ?? UiTheme.sizes.resultButton
    });
    const depthBase = options?.buttonDepth;
    if (depthBase !== undefined) {
      bg.setDepth(depthBase);
      text.setDepth(depthBase + 1);
    } else {
      text.setDepth(bg.depth + 1);
    }

    container.add([bg, text]);

    bg.once("destroy", () => {
      if (text.active) {
        text.destroy();
      }
    });

    bg.on("pointerover", () => {
      bg.setScale(1.02);
      text.setScale(1.02);
      bg.setFillStyle(s.backgroundColor, s.hoverAlpha);
    });
    bg.on("pointerout", () => {
      bg.setScale(1);
      text.setScale(1);
      bg.setFillStyle(s.backgroundColor, s.fillAlpha);
    });
    bg.on("pointerdown", () => {
      bg.setScale(0.98);
      text.setScale(0.98);
    });
    bg.on("pointerup", () => {
      bg.setScale(1.02);
      text.setScale(1.02);
      onClick();
    });

    return bg;
  }
}
