import Phaser from "phaser";

type RoadBounds = {
  left: number;
  right: number;
};

export class DrivingSystem {
  private readonly scene: Phaser.Scene;
  private readonly roadBounds: RoadBounds;
  private readonly laneMarkers: Phaser.GameObjects.Rectangle[] = [];
  private readonly markerSpacing = 90;
  private readonly markerHeight = 56;
  private readonly markerWidth = 10;

  private car!: Phaser.GameObjects.Rectangle;
  private roadSpeed = 250;
  private steeringLerp = 0.18;
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

    this.scene.add.rectangle(
      roadCenterX,
      height * 0.5,
      this.roadBounds.right - this.roadBounds.left,
      height,
      0x1f2937
    );

    this.scene.add.rectangle(this.roadBounds.left, height * 0.5, 6, height, 0xf8fafc);
    this.scene.add.rectangle(this.roadBounds.right, height * 0.5, 6, height, 0xf8fafc);

    for (let y = -this.markerSpacing; y < height + this.markerSpacing; y += this.markerSpacing) {
      const marker = this.scene.add.rectangle(
        roadCenterX,
        y,
        this.markerWidth,
        this.markerHeight,
        0xe2e8f0
      );
      this.laneMarkers.push(marker);
    }

    this.car = this.scene.add.rectangle(roadCenterX, height - 72, 52, 92, 0x38bdf8);
    this.delayedTargetX = roadCenterX;
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
    const targetX = Phaser.Math.Clamp(pointerX, this.roadBounds.left + 28, this.roadBounds.right - 28);

    if (this.steeringDelayTimer > 0) {
      this.delayedTargetSampleTimer += deltaSeconds;
      if (this.delayedTargetSampleTimer >= this.delayedSampleInterval) {
        this.delayedTargetSampleTimer = 0;
        this.delayedTargetX = targetX;
      }
      this.car.x = Phaser.Math.Linear(this.car.x, this.delayedTargetX, this.steeringLerp * 0.8);
      return;
    }

    this.delayedTargetSampleTimer = 0;
    this.delayedTargetX = targetX;
    this.car.x = Phaser.Math.Linear(this.car.x, targetX, this.steeringLerp);
  }
}
