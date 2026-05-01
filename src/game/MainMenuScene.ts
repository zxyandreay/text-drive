import Phaser from "phaser";
import { UiFactory } from "./ui/UiFactory";
import { UiTheme } from "./ui/UiTheme";

const MARGIN = 24;
const STRIP_MAX_W = 520;
const STRIP_PAD_X = 28;
const STRIP_PAD_Y = 22;
const TAGLINE_MAX_W = 400;
const GAP_TAG_CTA = 20;
const BTN_W = 300;
const BTN_H = 58;
const BACKDROP_STEPS = 28;
const TITLE_Y_FRAC = 0.26;
const STRIP_CENTER_Y_FRAC = 0.68;

/** Accent color as hex for Graphics APIs. */
const ACCENT_LINE = 0x93c5fd;

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
    const titleY = height * TITLE_Y_FRAC;

    const titleFont = `700 ${UiTheme.sizes.menuTitle} ${UiTheme.fontDisplay}`;
    const titleGlow = this.add
      .text(cx, titleY + 2, "TEXT DRIVE", {
        font: titleFont,
        color: UiTheme.colors.accent
      })
      .setOrigin(0.5, 0);
    titleGlow.setAlpha(0.14);
    titleGlow.setDepth(3);

    const title = this.add
      .text(cx, titleY, "TEXT DRIVE", {
        font: titleFont,
        color: UiTheme.colors.title
      })
      .setOrigin(0.5, 0);
    if (typeof (title as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing === "function") {
      (title as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing(8);
    }
    title.setDepth(4);

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
      labelFont: `600 ${UiTheme.sizes.menuCta} ${UiTheme.fontFamily}`,
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
    const y0 = h * 0.44;
    const y1 = h * 0.92;
    const dash = 12;
    const gap = 10;
    const speed = 22;
    const phase = ((this.time.now / 1000) * speed) % (dash + gap);

    g.clear();
    g.lineStyle(2, ACCENT_LINE, 0.13);
    let y = y0 - phase;
    while (y < y1) {
      const segStart = Math.max(y0, y);
      const segEnd = Math.min(y + dash, y1);
      if (segEnd > segStart) {
        g.beginPath();
        g.moveTo(x, segStart);
        g.lineTo(x, segEnd);
        g.strokePath();
      }
      y += dash + gap;
    }
  }

  /** Night road: gradient, vignette, lane language, perspective — depth 0. */
  private drawBackdrop(w: number, h: number): void {
    const g = this.add.graphics();

    const top = Phaser.Display.Color.ValueToColor(0x0f172a);
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

    g.fillStyle(0x000000, 0.38);
    g.fillCircle(0, 0, w * 0.55);
    g.fillCircle(w, 0, w * 0.55);
    g.fillStyle(0x000000, 0.32);
    g.fillCircle(0, h, w * 0.52);
    g.fillCircle(w, h, w * 0.52);
    g.fillStyle(0x020617, 0.45);
    g.fillRect(0, 0, w, h * 0.14);
    g.fillRect(0, h * 0.86, w, h * 0.14);

    const vanishY = h * 0.4;
    const vanishX = w * 0.5;
    g.lineStyle(1, 0x334155, 0.1);
    g.beginPath();
    g.moveTo(-w * 0.05, h * 0.92);
    g.lineTo(vanishX, vanishY);
    g.strokePath();
    g.beginPath();
    g.moveTo(w * 1.05, h * 0.92);
    g.lineTo(vanishX, vanishY);
    g.strokePath();

    g.lineStyle(1, 0x475569, 0.12);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const y = h * (0.42 + t * 0.32);
      const inset = 40 + i * 16;
      g.beginPath();
      g.moveTo(inset, y);
      g.lineTo(w - inset, y);
      g.strokePath();
    }

    g.setDepth(0);
  }
}
