import Phaser from "phaser";

type RoadBounds = {
  left: number;
  right: number;
};

type Obstacle = Phaser.GameObjects.Rectangle;

export class ObstacleSystem {
  private readonly scene: Phaser.Scene;
  private readonly roadBounds: RoadBounds;
  private readonly obstacles: Obstacle[] = [];
  private spawnTimerMs = 950;

  private elapsedSinceSpawn = 0;
  private obstacleSpeed = 290;
  private crashed = false;
  private speedBoostTimer = 0;
  private speedBoostMultiplier = 1;
  private crashCooldownSeconds = 0;

  constructor(scene: Phaser.Scene, roadBounds: RoadBounds) {
    this.scene = scene;
    this.roadBounds = roadBounds;
  }

  public update(deltaSeconds: number, carBounds: Phaser.Geom.Rectangle, roadSpeed: number): void {
    this.speedBoostTimer = Math.max(0, this.speedBoostTimer - deltaSeconds);
    this.speedBoostMultiplier = this.speedBoostTimer > 0 ? this.speedBoostMultiplier : 1;
    this.crashCooldownSeconds = Math.max(0, this.crashCooldownSeconds - deltaSeconds);

    this.elapsedSinceSpawn += deltaSeconds * 1000;
    if (this.elapsedSinceSpawn >= this.spawnTimerMs) {
      this.elapsedSinceSpawn = 0;
      this.spawnObstacle();
    }

    for (const obstacle of this.obstacles) {
      obstacle.y += (this.obstacleSpeed * this.speedBoostMultiplier + roadSpeed) * deltaSeconds;
    }

    this.recycleOffscreenObstacles();

    if (this.crashCooldownSeconds > 0) {
      return;
    }

    const collidingObstacle = this.obstacles.find((obstacle) =>
      Phaser.Geom.Intersects.RectangleToRectangle(obstacle.getBounds(), carBounds)
    );

    if (collidingObstacle) {
      this.crashed = true;
      collidingObstacle.destroy();
      this.obstacles.splice(this.obstacles.indexOf(collidingObstacle), 1);
      this.crashCooldownSeconds = 0.8;
      this.scene.cameras.main.flash(220, 255, 70, 70);
    }
  }

  public isCrashed(): boolean {
    return this.crashed;
  }

  public consumeCrashEvent(): boolean {
    if (!this.crashed) {
      return false;
    }

    this.crashed = false;
    return true;
  }

  public applyTemporarySpeedIncrease(durationSeconds: number, multiplier = 1.18): void {
    this.speedBoostTimer = Math.max(this.speedBoostTimer, durationSeconds);
    this.speedBoostMultiplier = Math.max(this.speedBoostMultiplier, multiplier);
  }

  public configureLevel(obstacleSpeed: number, spawnTimerMs: number): void {
    this.obstacleSpeed = obstacleSpeed;
    this.spawnTimerMs = spawnTimerMs;
  }

  public resetForLevel(): void {
    this.elapsedSinceSpawn = 0;
    this.crashed = false;
    this.speedBoostTimer = 0;
    this.speedBoostMultiplier = 1;
    this.crashCooldownSeconds = 0;

    for (const obstacle of this.obstacles) {
      obstacle.destroy();
    }
    this.obstacles.length = 0;
  }

  private spawnObstacle(): void {
    const spawnX = Phaser.Math.Between(this.roadBounds.left + 30, this.roadBounds.right - 30);
    const obstacle = this.scene.add.rectangle(spawnX, -50, 42, 80, 0xf97316);
    obstacle.setDepth(2);
    this.obstacles.push(obstacle);
  }

  private recycleOffscreenObstacles(): void {
    const { height } = this.scene.scale;
    for (let index = this.obstacles.length - 1; index >= 0; index -= 1) {
      const obstacle = this.obstacles[index];
      if (obstacle.y > height + 80) {
        obstacle.destroy();
        this.obstacles.splice(index, 1);
      }
    }
  }
}
