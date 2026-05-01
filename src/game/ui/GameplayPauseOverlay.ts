import Phaser from "phaser";
import { formatNarrativeBody, getNarrativeColumnWidth } from "./narrativeLayout";
import { UiFactory } from "./UiFactory";
import { UiTheme } from "./UiTheme";

const PAUSE_DEPTH = 200;
const H_MARGIN = 40;
const PANEL_MAX_W = 460;
const PANEL_PAD_X = 28;
const PANEL_PAD_Y = 22;
const GAP_SM = 10;
const GAP_MD = 16;
const GAP_LG = 22;
const BTN_W = 248;
const BTN_H = 46;
const BTN_GAP = 12;

export type GameplayPauseOverlayOptions = {
  levelTitle: string;
  introLines: string[];
  onResume: () => void;
  onLevelSelect: () => void;
  onMainMenu: () => void;
  onRestart: () => void;
};

/**
 * Full-screen pause menu: level context from {@link LevelConfig.introNarration} and navigation actions.
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

    const panelW = Math.min(PANEL_MAX_W, w - H_MARGIN * 2);
    const usableInner = panelW - PANEL_PAD_X * 2;
    const colW = getNarrativeColumnWidth(usableInner);

    const bodyStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: UiTheme.fontFamily,
      fontSize: UiTheme.sizes.resultBody,
      color: UiTheme.colors.body,
      align: "center",
      lineSpacing: UiTheme.narrative.introLineSpacing
    };
    const bodyString = formatNarrativeBody(scene, options.introLines, bodyStyle, colW);

    const cx = w / 2;
    const cy = h / 2;

    const pausedText = scene.add
      .text(cx, 0, "paused", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.titleLg,
        color: UiTheme.colors.title
      })
      .setOrigin(0.5, 0);

    const levelTitleText = scene.add
      .text(cx, 0, options.levelTitle, {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.titleMd,
        color: UiTheme.colors.accent
      })
      .setOrigin(0.5, 0);

    const bodyText = scene.add
      .text(cx, 0, bodyString, {
        ...bodyStyle,
        wordWrap: { width: colW }
      })
      .setOrigin(0.5, 0);

    const topBlockH =
      PANEL_PAD_Y + pausedText.height + GAP_SM + levelTitleText.height + GAP_MD + bodyText.height + GAP_LG;
    const buttonsH = BTN_H * 4 + BTN_GAP * 3;
    const panelH = Math.min(topBlockH + buttonsH + PANEL_PAD_Y, h - H_MARGIN * 2);

    const panel = UiFactory.createPanel(scene, cx, cy, panelW, panelH, 0.94);

    let yTop = cy - panelH / 2 + PANEL_PAD_Y;
    pausedText.setY(yTop);
    yTop += pausedText.height + GAP_SM;
    levelTitleText.setY(yTop);
    yTop += levelTitleText.height + GAP_MD;
    bodyText.setY(yTop);
    yTop += bodyText.height + GAP_LG;

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
    by += BTN_H + BTN_GAP;
    UiFactory.createButtonInContainer(uiRoot, scene, 0, by, "restart level", options.onRestart, {
      variant: "secondary",
      width: BTN_W,
      height: BTN_H
    });

    this.root.add([backdrop, panel, pausedText, levelTitleText, bodyText, uiRoot]);
  }

  public destroy(): void {
    this.root.destroy(true);
  }
}
