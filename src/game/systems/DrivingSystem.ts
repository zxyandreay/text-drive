import Phaser from "phaser";

export type RoadBounds = {
  left: number;
  right: number;
};

/** Arcade lateral steering — tune here only. */
const STEERING = {
  /** Ignore mouse error within this many px (reduces micro-jitter). */
  mouseDeadZonePx: 4,
  /** Lateral acceleration from position error (px/s² per px of error), before cap. */
  lateralAccelPerPx: 44,
  /** Absolute cap on lateral acceleration (px/s²). */
  maxLateralAccel: 880,
  /** Hard cap on lateral speed (px/s). */
  maxLateralSpeed: 720,
  /** Velocity decay per second (exponential); higher = heavier / settles faster when coasting. */
  lateralDragPerSec: 5.5,
  /** Extra drag multiplier while stress steering delay is active (gain and accel cap scaled by this). */
  stressAccelMultiplier: 0.78,
  /** Distance from lane clamp where outward velocity gets extra drag. */
  edgeSoftMarginPx: 40,
  /** Added to lateralDragPerSec at the lane edge when moving outward (0–1 blend in margin). */
  edgeOutwardDragPerSec: 14,
} as const;

export class DrivingSystem {
  private readonly scene: Phaser.Scene;
  private roadBounds: RoadBounds;
  private readonly laneMarkers: Phaser.GameObjects.Rectangle[] = [];
  private readonly markerSpacing = 90;
  private readonly markerHeight = 56;
  private readonly markerWidth = 10;
  private static readonly depthRoad = 0;
  private static readonly depthLaneMarkers = 1;
  private static readonly depthCar = 3;
  private static readonly carLaneInset = 28;

  private roadFill!: Phaser.GameObjects.Rectangle;
  private leftEdge!: Phaser.GameObjects.Rectangle;
  private rightEdge!: Phaser.GameObjects.Rectangle;
  private car!: Phaser.GameObjects.Rectangle;
  private roadSpeed = 250;
  private lateralVelocity = 0;
  private steeringDelayTimer = 0;
  private delayedTargetX = 0;
  private delayedTargetSampleTimer = 0;
  private readonly delayedSampleInterval = 0.12;

  constructor(scene: Phaser.Scene, roadBounds: RoadBounds) {
    this.scene = scene;
    this.roadBounds = roadBounds;
  }

  public create(): void {
    const { height } = this.scene.scale;
    const roadCenterX = (this.roadBounds.left + this.roadBounds.right) * 0.5;
    const roadW = this.roadBounds.right - this.roadBounds.left;

    this.roadFill = this.scene.add.rectangle(roadCenterX, height * 0.5, roadW, height, 0x1f2937);
    this.roadFill.setDepth(DrivingSystem.depthRoad);

    this.leftEdge = this.scene.add.rectangle(this.roadBounds.left, height * 0.5, 6, height, 0xf8fafc);
    this.rightEdge = this.scene.add.rectangle(this.roadBounds.right, height * 0.5, 6, height, 0xf8fafc);
    this.leftEdge.setDepth(DrivingSystem.depthRoad);
    this.rightEdge.setDepth(DrivingSystem.depthRoad);

    for (let y = -this.markerSpacing; y < height + this.markerSpacing; y += this.markerSpacing) {
      const marker = this.scene.add.rectangle(
        roadCenterX,
        y,
        this.markerWidth,
        this.markerHeight,
        0xe2e8f0
      );
      marker.setDepth(DrivingSystem.depthLaneMarkers);
      this.laneMarkers.push(marker);
    }

    this.car = this.scene.add.rectangle(roadCenterX, height - 72, 52, 92, 0x38bdf8);
    this.car.setDepth(DrivingSystem.depthCar);
    this.lateralVelocity = 0;
    this.delayedTargetX = roadCenterX;
  }

  /** Reposition road visuals after resize or layout change. */
  public relayout(): void {
    const { height } = this.scene.scale;
    const roadCenterX = (this.roadBounds.left + this.roadBounds.right) * 0.5;
    const roadW = this.roadBounds.right - this.roadBounds.left;

    this.roadFill.setPosition(roadCenterX, height * 0.5);
    this.roadFill.width = roadW;
    this.roadFill.height = height;

    this.leftEdge.setPosition(this.roadBounds.left, height * 0.5);
    this.leftEdge.height = height;
    this.rightEdge.setPosition(this.roadBounds.right, height * 0.5);
    this.rightEdge.height = height;

    for (const marker of this.laneMarkers) {
      marker.x = roadCenterX;
    }

    const minX = this.roadBounds.left + DrivingSystem.carLaneInset;
    const maxX = this.roadBounds.right - DrivingSystem.carLaneInset;
    this.car.x = Phaser.Math.Clamp(this.car.x, minX, maxX);
    this.car.y = height - 72;
    this.lateralVelocity = 0;
    this.delayedTargetX = this.car.x;
  }

  public update(deltaSeconds: number): void {
    this.updateRoad(deltaSeconds);
    this.updateSteering(deltaSeconds);
  }

  public applySteeringDelay(durationSeconds: number): void {
    this.steeringDelayTimer = Math.max(this.steeringDelayTimer, durationSeconds);
  }

  public getRoadSpeed(): number {
    return this.roadSpeed;
  }

  public setRoadSpeed(speed: number): void {
    this.roadSpeed = speed;
  }

  public getCarBounds(): Phaser.Geom.Rectangle {
    return this.car.getBounds();
  }

  private updateRoad(deltaSeconds: number): void {
    const resetY = -this.markerHeight;
    const { height } = this.scene.scale;

    for (const marker of this.laneMarkers) {
      marker.y += this.roadSpeed * deltaSeconds;
      if (marker.y > height + this.markerHeight) {
        marker.y = resetY;
      }
    }
  }

  private updateSteering(deltaSeconds: number): void {
    this.steeringDelayTimer = Math.max(0, this.steeringDelayTimer - deltaSeconds);
    const pointerX = this.scene.input.activePointer.x;
    const minX = this.roadBounds.left + DrivingSystem.carLaneInset;
    const maxX = this.roadBounds.right - DrivingSystem.carLaneInset;
    const targetX = Phaser.Math.Clamp(pointerX, minX, maxX);

    let steeringTargetX: number;
    if (this.steeringDelayTimer > 0) {
      this.delayedTargetSampleTimer += deltaSeconds;
      if (this.delayedTargetSampleTimer >= this.delayedSampleInterval) {
        this.delayedTargetSampleTimer = 0;
        this.delayedTargetX = targetX;
      }
      steeringTargetX = this.delayedTargetX;
    } else {
      this.delayedTargetSampleTimer = 0;
      this.delayedTargetX = targetX;
      steeringTargetX = targetX;
    }

    const stressMul =
      this.steeringDelayTimer > 0 ? STEERING.stressAccelMultiplier : 1;
    const accelGain = STEERING.lateralAccelPerPx * stressMul;
    const maxAccel = STEERING.maxLateralAccel * stressMul;

    let error = steeringTargetX - this.car.x;
    const dz = STEERING.mouseDeadZonePx;
    const absErr = Math.abs(error);
    if (absErr <= dz) {
      error = 0;
    } else {
      error = Math.sign(error) * (absErr - dz);
    }

    let accel = error * accelGain;
    accel = Phaser.Math.Clamp(accel, -maxAccel, maxAccel);
    this.lateralVelocity += accel * deltaSeconds;

    let drag = STEERING.lateralDragPerSec;
    const margin = STEERING.edgeSoftMarginPx;
    const distFromLeft = this.car.x - minX;
    const distFromRight = maxX - this.car.x;
    if (distFromLeft < margin && this.lateralVelocity < 0) {
      const f = 1 - distFromLeft / margin;
      drag += f * STEERING.edgeOutwardDragPerSec;
    }
    if (distFromRight < margin && this.lateralVelocity > 0) {
      const f = 1 - distFromRight / margin;
      drag += f * STEERING.edgeOutwardDragPerSec;
    }

    this.lateralVelocity *= Math.exp(-drag * deltaSeconds);
    this.lateralVelocity = Phaser.Math.Clamp(
      this.lateralVelocity,
      -STEERING.maxLateralSpeed,
      STEERING.maxLateralSpeed
    );

    this.car.x += this.lateralVelocity * deltaSeconds;
    this.car.x = Phaser.Math.Clamp(this.car.x, minX, maxX);
    if (this.car.x <= minX && this.lateralVelocity < 0) {
      this.lateralVelocity = 0;
    }
    if (this.car.x >= maxX && this.lateralVelocity > 0) {
      this.lateralVelocity = 0;
    }
  }
}
