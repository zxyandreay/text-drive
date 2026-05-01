import Phaser from "phaser";
import type { RoadBounds } from "../systems/DrivingSystem";

export type { RoadBounds };

export type PhoneLayout = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export type GameplayLayoutMetrics = {
  width: number;
  height: number;
  marginX: number;
  marginY: number;
  topBarTop: number;
  topBarH: number;
  hintCard: { cx: number; cy: number; w: number; h: number };
  road: RoadBounds;
  phone: PhoneLayout;
  hudDepth: number;
  headerDepth: number;
  phoneDepth: number;
};

const HUD_DEPTH = 10;
const HEADER_DEPTH = 11;
const PHONE_DEPTH = 20;

/**
 * Computes road-centered three-zone layout: compact hint left, road middle, phone right.
 */
export function computeGameplayLayout(scale: Phaser.Scale.ScaleManager): GameplayLayoutMetrics {
  const width = scale.width;
  const height = scale.height;
  const marginX = Phaser.Math.Clamp(Math.round(width * 0.022), 8, 18);
  const marginY = Phaser.Math.Clamp(Math.round(height * 0.02), 8, 14);
  /** Includes a thin story/dialogue progress strip along the bottom of the top bar. */
  const topBarH = 56;
  const topBarTop = marginY;

  const hintW = Phaser.Math.Clamp(Math.round(width * 0.19), 118, 172);
  const phoneW = Phaser.Math.Clamp(Math.round(width * 0.3), 232, 288);
  const zoneGap = 10;

  let roadLeft = marginX + hintW + zoneGap;
  let roadRight = width - marginX - phoneW - zoneGap;
  const minRoad = 150;
  if (roadRight - roadLeft < minRoad) {
    const deficit = minRoad - (roadRight - roadLeft);
    roadLeft = Math.max(marginX + 72, roadLeft - deficit * 0.5);
    roadRight = Math.min(width - marginX - 72, roadRight + deficit * 0.5);
  }

  const contentTop = topBarTop + topBarH + marginY;
  const phoneH = Phaser.Math.Clamp(height - contentTop - marginY, 280, 420);
  const phoneCenterX = width - marginX - phoneW / 2;
  const phoneCenterY = contentTop + phoneH / 2;

  const hintCard = {
    cx: marginX + hintW / 2,
    cy: contentTop + 64,
    w: hintW,
    h: 102
  };

  return {
    width,
    height,
    marginX,
    marginY,
    topBarTop,
    topBarH,
    hintCard,
    road: { left: roadLeft, right: roadRight },
    phone: {
      centerX: phoneCenterX,
      centerY: phoneCenterY,
      width: phoneW,
      height: phoneH
    },
    hudDepth: HUD_DEPTH,
    headerDepth: HEADER_DEPTH,
    phoneDepth: PHONE_DEPTH
  };
}
