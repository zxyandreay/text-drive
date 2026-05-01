import Phaser from "phaser";
import { UiTheme } from "./UiTheme";

const INNER_PAD = 10;
const ROW_TAIL_GAP = 6;
const BUBBLE_MAX_FRAC = 0.76;
const CORNER_RADIUS = 10;

export type BubbleRowResult = {
  container: Phaser.GameObjects.Container;
  height: number;
};

function normalizeChatBody(body: string): string {
  return body.trim().toLowerCase();
}

/**
 * Rounded rect via filled circles + rects (no Rex plugin).
 */
function addRoundRectBg(
  scene: Phaser.Scene,
  w: number,
  h: number,
  fill: number,
  stroke: number,
  strokeAlpha: number
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const r = Math.min(CORNER_RADIUS, w * 0.5, h * 0.5);
  g.fillStyle(fill, 0.95);
  g.lineStyle(1, stroke, strokeAlpha);
  g.beginPath();
  g.moveTo(r, 0);
  g.lineTo(w - r, 0);
  g.arc(w - r, r, r, -Math.PI / 2, 0, false);
  g.lineTo(w, h - r);
  g.arc(w - r, h - r, r, 0, Math.PI / 2, false);
  g.lineTo(r, h);
  g.arc(r, h - r, r, Math.PI / 2, Math.PI, false);
  g.lineTo(0, r);
  g.arc(r, r, r, Math.PI, -Math.PI / 2, false);
  g.closePath();
  g.fillPath();
  g.strokePath();
  return g;
}

export function createPartnerBubbleRow(
  scene: Phaser.Scene,
  body: string,
  threadWidth: number
): BubbleRowResult {
  const textBody = normalizeChatBody(body);
  const maxBubble = Math.max(80, threadWidth * BUBBLE_MAX_FRAC);
  const innerW = maxBubble - INNER_PAD * 2;

  const label = scene.add
    .text(INNER_PAD, INNER_PAD, textBody, {
      fontFamily: UiTheme.fontFamily,
      fontSize: UiTheme.sizes.phoneBody,
      color: UiTheme.colors.body,
      wordWrap: { width: innerW }
    })
    .setOrigin(0, 0);

  const bw = Math.min(maxBubble, Math.ceil(label.width + INNER_PAD * 2));
  const bh = Math.ceil(label.height + INNER_PAD * 2);

  const bg = addRoundRectBg(scene, bw, bh, 0x1e293b, 0x475569, 0.85);
  const row = scene.add.container(0, 0, [bg, label]);
  const height = bh + ROW_TAIL_GAP;
  return { container: row, height };
}

export function createPlayerBubbleRow(
  scene: Phaser.Scene,
  body: string,
  threadWidth: number
): BubbleRowResult {
  const textBody = normalizeChatBody(body);
  const maxBubble = Math.max(80, threadWidth * BUBBLE_MAX_FRAC);
  const innerW = maxBubble - INNER_PAD * 2;

  const label = scene.add
    .text(0, INNER_PAD, textBody, {
      fontFamily: UiTheme.fontFamily,
      fontSize: UiTheme.sizes.phoneBody,
      color: "#eff6ff",
      wordWrap: { width: innerW }
    })
    .setOrigin(0, 0);

  const bw = Math.min(maxBubble, Math.ceil(label.width + INNER_PAD * 2));
  const bh = Math.ceil(label.height + INNER_PAD * 2);

  const bg = addRoundRectBg(scene, bw, bh, 0x1d4ed8, 0x60a5fa, 0.75);
  const bubble = scene.add.container(0, 0, [bg, label]);
  label.setPosition(INNER_PAD, INNER_PAD);

  const row = scene.add.container(0, 0, [bubble]);
  bubble.setPosition(threadWidth - bw, 0);

  const height = bh + ROW_TAIL_GAP;
  return { container: row, height };
}

export function createTypingRow(scene: Phaser.Scene, _threadWidth: number): BubbleRowResult {
  const label = scene.add
    .text(0, 0, "typing…", {
      fontFamily: UiTheme.fontFamily,
      fontSize: UiTheme.sizes.hint,
      color: UiTheme.colors.muted,
      fontStyle: "italic"
    })
    .setOrigin(0, 0);

  const row = scene.add.container(0, 0, [label]);
  const height = Math.ceil(label.height) + ROW_TAIL_GAP + 4;
  return { container: row, height };
}
