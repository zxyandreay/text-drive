import Phaser from "phaser";
import { UiFactory } from "./UiFactory";
import { UiTheme } from "./UiTheme";

const PAUSE_DEPTH = 200;
const H_MARGIN = 40;
const PANEL_MAX_W = 312;
const PANEL_PAD_Y = 22;
const TITLE_TO_BUTTONS = 16;
const BTN_W = 232;
const BTN_H = 44;
const BTN_GAP = 10;

export type GameplayPauseOverlayOptions = {
  onResume: () => void;
  onLevelSelect: () => void;
  onMainMenu: () => void;
};

/**
 * Minimal pause interrupt: dim backdrop, compact panel, "paused" + essential navigation only.
 */
export class GameplayPauseOverlay {
  private readonly root: Phaser.GameObjects.Container;

  public constructor(scene: Phaser.Scene, options: GameplayPauseOverlayOptions) {
    const { width: w, height: h } = scene.scale;
    this.root = scene.add.container(0, 0);
    this.root.setDepth(PAUSE_DEPTH);

    const backdrop = scene.add.rectangle(w / 2, h / 2, w, h, 0x020617, 0.82);
    backdrop.setStrokeStyle(2, 0x334155, 0.75);
    backdrop.setInteractive({ useHandCursor: false });
    backdrop.on("pointerup", () => {
      /* consume pointer so nothing behind receives it */
    });

    const cx = w / 2;
    const cy = h / 2;

    const pausedText = scene.add
      .text(cx, 0, "paused", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.titleMd,
        color: UiTheme.colors.title
      })
      .setOrigin(0.5, 0);

    const panelW = Math.min(PANEL_MAX_W, w - H_MARGIN * 2);
    const buttonsH = BTN_H * 3 + BTN_GAP * 2;
    const panelH = PANEL_PAD_Y * 2 + pausedText.height + TITLE_TO_BUTTONS + buttonsH;

    const panel = UiFactory.createPanel(scene, cx, cy, panelW, panelH, 0.94);

    let yTop = cy - panelH / 2 + PANEL_PAD_Y;
    pausedText.setY(yTop);
    yTop += pausedText.height + TITLE_TO_BUTTONS;

    const btnLocalYStart = yTop - cy + BTN_H / 2;
    const uiRoot = scene.add.container(cx, cy);

    let by = btnLocalYStart;
    UiFactory.createButtonInContainer(uiRoot, scene, 0, by, "resume", options.onResume, {
      variant: "primary",
      width: BTN_W,
      height: BTN_H
    });
    by += BTN_H + BTN_GAP;
    UiFactory.createButtonInContainer(uiRoot, scene, 0, by, "level select", options.onLevelSelect, {
      variant: "secondary",
      width: BTN_W,
      height: BTN_H
    });
    by += BTN_H + BTN_GAP;
    UiFactory.createButtonInContainer(uiRoot, scene, 0, by, "main menu", options.onMainMenu, {
      variant: "ghost",
      width: BTN_W,
      height: BTN_H
    });

    this.root.add([backdrop, panel, pausedText, uiRoot]);
  }

  public destroy(): void {
    this.root.destroy(true);
  }
}
