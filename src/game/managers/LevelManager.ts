import type { LevelConfig } from "../types/LevelTypes";

export class LevelManager {
  private readonly levels: LevelConfig[];
  private currentIndex = 0;

  constructor(levels: LevelConfig[]) {
    this.levels = levels;
  }

  public getCurrentLevel(): LevelConfig {
    return this.levels[this.currentIndex];
  }

  public getCurrentLevelNumber(): number {
    return this.currentIndex + 1;
  }

  public getTotalLevels(): number {
    return this.levels.length;
  }

  public hasNextLevel(): boolean {
    return this.currentIndex < this.levels.length - 1;
  }

  public advanceLevel(): boolean {
    if (!this.hasNextLevel()) {
      return false;
    }

    this.currentIndex += 1;
    return true;
  }
}
