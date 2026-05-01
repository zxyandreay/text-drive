import Phaser from "phaser";
import { UiFactory } from "./ui/UiFactory";
import { UiTheme } from "./ui/UiTheme";

const MARGIN = 24;
const STRIP_MAX_W = 520;
const STRIP_PAD_X = 28;
const STRIP_PAD_Y = 22;
const TAGLINE_MAX_W = 400;
const GAP_TAG_CTA = 20;
const BTN_W = 276;
const BTN_H = 52;
const STRIP_CENTER_Y_FRAC = 0.78;

/** Accent color as hex for Graphics APIs (same as animated center dashes). */
const ACCENT_LINE = 0x93c5fd;
/** Stroke alpha for faint road lines — aligned with animated dash pass (~0.13). */
const ROAD_LINE_ALPHA = 0.12;
/** Horizon / vanishing point Y and top of centerline strip (must match backdrop). */
const ROAD_VANISH_Y_FRAC = 0.36;
/** Where road meets bottom of frame. */
const ROAD_BOTTOM_Y_FRAC = 0.92;

/**
 * Teko bold "TEXT DRIVE" is very wide; cap by usable width so it does not clip the canvas edges.
 * Height caps keep the wordmark large but leave room for the HUD strip.
 */
function mainMenuTitlePx(width: number, height: number): number {
  const hPad = 56;
  const availW = Math.max(200, width - hPad * 2);
  const byWidth = Math.floor(availW / 5.75);
  const byHeight = Math.floor(height * 0.34);
  return Phaser.Math.Clamp(Math.min(byWidth, byHeight), 112, 168);
}

export class MainMenuScene extends Phaser.Scene {
  private navLocked = false;
  private centerDashGfx?: Phaser.GameObjects.Graphics;

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
    this.centerDashGfx = this.add.graphics();
    this.centerDashGfx.setDepth(1);

    const cx = width / 2;
    const titlePx = mainMenuTitlePx(width, height);
    const titleY = height * 0.1;
    const letterSpacing = Math.max(3, Math.round(titlePx * 0.02));
    const strokeThickness = Math.max(8, Math.round(titlePx / 20));

    /**
     * Do not use Phaser `font` shorthand: TextStyle#setFont splits on spaces and only keeps 3
     * tokens, so families like `Teko, sans-serif` break and weight/size can fail silently.
     */
    const title = this.add
      .text(cx, titleY, "TEXT DRIVE", {
        fontFamily: UiTheme.fontDisplay,
        fontSize: `${titlePx}px`,
        fontStyle: "bold",
        color: UiTheme.colors.title,
        stroke: "#000000",
        strokeThickness
      })
      .setOrigin(0.5, 0);
    if (typeof (title as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing === "function") {
      (title as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing(letterSpacing);
    }
    title.setDepth(3);

    const stripW = Math.min(STRIP_MAX_W, (width - MARGIN * 2) * 0.82);
    const taglineWrap = Math.min(TAGLINE_MAX_W, stripW - STRIP_PAD_X * 2);

    const tagline = this.add
      .text(cx, 0, "drive and type. the road does not wait.", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.menuTagline,
        color: UiTheme.colors.menuTagline,
        align: "center",
        wordWrap: { width: taglineWrap },
        lineSpacing: 3
      })
      .setOrigin(0.5, 0);

    const stripH = STRIP_PAD_Y * 2 + tagline.height + GAP_TAG_CTA + BTN_H;
    const stripCy = height * STRIP_CENTER_Y_FRAC;
    const stripTop = stripCy - stripH / 2;

    const stripBg = this.add.rectangle(cx, stripCy, stripW, stripH, 0x0f172a, 0.44);
    stripBg.setDepth(2);

    const accentTop = this.add.rectangle(cx, stripTop, stripW, 2, ACCENT_LINE, 0.55);
    accentTop.setDepth(2);

    tagline.setPosition(cx, stripTop + STRIP_PAD_Y);
    tagline.setDepth(5);

    const btnCy = stripTop + STRIP_PAD_Y + tagline.height + GAP_TAG_CTA + BTN_H / 2;
    UiFactory.createButton(this, cx, btnCy, "START", () => {
      if (this.navLocked) {
        return;
      }
      this.navLocked = true;
      this.scene.start("LevelSelectScene");
    }, {
      variant: "primary",
      width: BTN_W,
      height: BTN_H,
      /* 3 space-separated tokens only — see Teko title comment re: Phaser setFont */
      labelFont: `600 ${UiTheme.sizes.menuCta} Inter`,
      labelLetterSpacing: 3,
      buttonStrokeWidth: 2,
      buttonDepth: 6
    });
  }

  update(): void {
    const g = this.centerDashGfx;
    if (!g) {
      return;
    }
    const w = this.scale.width;
    const h = this.scale.height;
    const x = w * 0.5;
    const y0 = h * ROAD_VANISH_Y_FRAC;
    const y1 = h * ROAD_BOTTOM_Y_FRAC;
    const dash = 12;
    const gap = 10;
    const mod = dash + gap;
    /** Increasing scroll shifts dash starts downward = forward motion (stripes come from horizon toward you). */
    const scroll = ((this.time.now / 1000) * 22) % mod;

    g.clear();
    g.lineStyle(2, ACCENT_LINE, ROAD_LINE_ALPHA + 0.01);
    let y = y0 + scroll;
    while (y > y0 - mod) {
      y -= mod;
    }
    while (y < y1) {
      const segStart = Math.max(y0, y);
      const segEnd = Math.min(y + dash, y1);
      if (segEnd > segStart) {
        g.beginPath();
        g.moveTo(x, segStart);
        g.lineTo(x, segEnd);
        g.strokePath();
      }
      y += mod;
    }
  }

  /**
   * Flat background plus faint static horizon and road outline (same tint as center dashes).
   * Animated segment is drawn in update().
   */
  private drawBackdrop(w: number, h: number): void {
    const g = this.add.graphics();
    const bg = Phaser.Display.Color.HexStringToColor(UiTheme.colors.bg).color;
    g.fillStyle(bg, 1);
    g.fillRect(0, 0, w, h);

    const vanishX = w * 0.5;
    const vanishY = h * ROAD_VANISH_Y_FRAC;
    g.lineStyle(1, ACCENT_LINE, ROAD_LINE_ALPHA);

    g.beginPath();
    g.moveTo(w * 0.06, vanishY);
    g.lineTo(w * 0.94, vanishY);
    g.strokePath();

    g.beginPath();
    g.moveTo(-w * 0.04, h * 0.96);
    g.lineTo(vanishX, vanishY);
    g.strokePath();

    g.beginPath();
    g.moveTo(w * 1.04, h * 0.96);
    g.lineTo(vanishX, vanishY);
    g.strokePath();

    g.setDepth(0);
  }
}
