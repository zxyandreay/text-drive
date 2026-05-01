import Phaser from "phaser";
import { UiFactory } from "./ui/UiFactory";
import { UiTheme } from "./ui/UiTheme";

const MARGIN = 24;
const PANEL_H = 308;
const PANEL_MAX_W = 472;
const PANEL_ALPHA = 0.86;
const INNER_PAD = 20;
const GAP_TITLE_TAG = 16;
const GAP_TAG_CTA = 36;
const BTN_W = 292;
const BTN_H = 54;
const BACKDROP_STEPS = 28;

export class MainMenuScene extends Phaser.Scene {
  private navLocked = false;

  constructor() {
    super("MainMenuScene");
  }

  init(): void {
    this.navLocked = false;
  }

  create(): void {
    this.navLocked = false;
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(UiTheme.colors.bg);

    this.drawBackdrop(width, height);

    const cx = width / 2;
    const cy = height / 2;
    const panelW = Math.min(PANEL_MAX_W, width - MARGIN * 2);

    const panel = UiFactory.createPanel(this, cx, cy, panelW, PANEL_H, PANEL_ALPHA);
    panel.setDepth(1);

    const rim = this.add.graphics();
    rim.lineStyle(1, 0x475569, 0.35);
    rim.strokeRoundedRect(
      cx - panelW / 2 + INNER_PAD,
      cy - PANEL_H / 2 + INNER_PAD,
      panelW - INNER_PAD * 2,
      PANEL_H - INNER_PAD * 2,
      6
    );
    rim.setDepth(2);

    const menuRoot = this.add.container(cx, cy);
    menuRoot.setDepth(3);

    let y = -PANEL_H / 2 + INNER_PAD + 36;

    const title = this.add
      .text(0, y, "text drive", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.menuTitle,
        color: UiTheme.colors.title,
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0);
    if (typeof (title as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing === "function") {
      (title as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing(5);
    }
    y += title.height + GAP_TITLE_TAG;

    const tagline = this.add
      .text(0, y, "drive and type. the road does not wait.", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.menuTagline,
        color: UiTheme.colors.menuTagline,
        align: "center",
        wordWrap: { width: panelW - INNER_PAD * 4 },
        lineSpacing: 4
      })
      .setOrigin(0.5, 0);
    y += tagline.height + GAP_TAG_CTA;

    menuRoot.add([title, tagline]);

    const btnCy = y + BTN_H / 2;
    UiFactory.createButtonInContainer(menuRoot, this, 0, btnCy, "start", () => {
      if (this.navLocked) {
        return;
      }
      this.navLocked = true;
      this.scene.start("LevelSelectScene");
    }, {
      variant: "primary",
      width: BTN_W,
      height: BTN_H,
      labelFontSize: UiTheme.sizes.menuCta
    });
  }

  /** Night gradient, soft vignette, faint lane marks — depth 0, below panel. */
  private drawBackdrop(w: number, h: number): void {
    const g = this.add.graphics();

    const top = Phaser.Display.Color.ValueToColor(0x111827);
    const bottom = Phaser.Display.Color.ValueToColor(0x020617);
    for (let i = 0; i < BACKDROP_STEPS; i++) {
      const t = i / (BACKDROP_STEPS - 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, 100, Math.round(t * 100));
      const cy = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
      const y = (h * i) / BACKDROP_STEPS;
      const bandH = Math.ceil(h / BACKDROP_STEPS) + 1;
      g.fillStyle(cy, 1);
      g.fillRect(0, y, w, bandH);
    }

    g.fillStyle(0x000000, 0.22);
    g.fillCircle(0, 0, w * 0.52);
    g.fillCircle(w, 0, w * 0.52);
    g.fillCircle(0, h, w * 0.48);
    g.fillCircle(w, h, w * 0.48);

    g.lineStyle(1, 0x475569, 0.14);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const y = h * (0.38 + t * 0.34);
      const inset = 36 + i * 14;
      g.beginPath();
      g.moveTo(inset, y);
      g.lineTo(w - inset, y);
      g.strokePath();
    }

    g.lineStyle(1, 0x334155, 0.08);
    g.beginPath();
    g.moveTo(w / 2, h * 0.36);
    g.lineTo(w / 2, h * 0.92);
    g.strokePath();

    g.setDepth(0);
  }
}
