import Phaser from "phaser";
import { DrivingSystem } from "./DrivingSystem";
import { ObstacleSystem } from "./ObstacleSystem";
import { PhoneUI } from "../ui/PhoneUI";
import type { TypingFailureReason } from "./TypingSystem";

export type StressIncidentReason = TypingFailureReason | "crash";

export class StressSystem {
  private readonly scene: Phaser.Scene;
  private readonly drivingSystem: DrivingSystem;
  private readonly obstacleSystem: ObstacleSystem;
  private readonly phoneUI: PhoneUI;
  private maxStress = 4;
  private stress = 0;

  constructor(
    scene: Phaser.Scene,
    drivingSystem: DrivingSystem,
    obstacleSystem: ObstacleSystem,
    phoneUI: PhoneUI
  ) {
    this.scene = scene;
    this.drivingSystem = drivingSystem;
    this.obstacleSystem = obstacleSystem;
    this.phoneUI = phoneUI;
  }

  public getStress(): number {
    return this.stress;
  }

  public getMaxStress(): number {
    return this.maxStress;
  }

  public configureLevel(maxStress: number): void {
    this.maxStress = maxStress;
  }

  public reset(): void {
    this.stress = 0;
  }

  public applyIncident(reason: StressIncidentReason): void {
    this.stress += 1;

    this.drivingSystem.applySteeringDelay(0.95);
    this.obstacleSystem.applyTemporarySpeedIncrease(1.2, 1.14);
    this.phoneUI.vibrate(0.55);
    this.scene.cameras.main.shake(170, 0.0038);

    if (reason === "timeout") {
      this.phoneUI.setStatus("Too slow. Focus now.", "#fca5a5");
    } else if (reason === "wrong_input") {
      this.phoneUI.setStatus("Wrong text. Panic rising.", "#fca5a5");
    } else {
      this.phoneUI.setStatus("Near miss crash. Keep control.", "#fca5a5");
    }
  }

  public isOverloaded(): boolean {
    return this.stress >= this.maxStress;
  }
}
