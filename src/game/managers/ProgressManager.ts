import type { LevelConfig } from "../types/LevelTypes";

type ProgressState = {
  unlocked: string[];
  completed: string[];
};

const STORAGE_KEY = "text-drive-progress-v1";

export class ProgressManager {
  private readonly levelOrder: string[];

  constructor(levels: LevelConfig[]) {
    this.levelOrder = levels.map((level) => level.id);
  }

  public load(): ProgressState {
    const fallback: ProgressState = { unlocked: [this.levelOrder[0]], completed: [] };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as ProgressState;
      const unlocked = parsed.unlocked.filter((id) => this.levelOrder.includes(id));
      const completed = parsed.completed.filter((id) => this.levelOrder.includes(id));
      return {
        unlocked: unlocked.length > 0 ? unlocked : [this.levelOrder[0]],
        completed
      };
    } catch {
      return fallback;
    }
  }

  public save(state: ProgressState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  public markCompleted(levelId: string): ProgressState {
    const current = this.load();
    const completedSet = new Set(current.completed);
    const unlockedSet = new Set(current.unlocked);
    completedSet.add(levelId);
    unlockedSet.add(levelId);

    const levelIndex = this.levelOrder.indexOf(levelId);
    const nextLevel = this.levelOrder[levelIndex + 1];
    if (nextLevel) {
      unlockedSet.add(nextLevel);
    }

    const nextState: ProgressState = {
      unlocked: this.levelOrder.filter((id) => unlockedSet.has(id)),
      completed: this.levelOrder.filter((id) => completedSet.has(id))
    };
    this.save(nextState);
    return nextState;
  }

  public getFirstUnlockedLevelId(): string {
    const state = this.load();
    for (const levelId of this.levelOrder) {
      if (state.unlocked.includes(levelId)) {
        return levelId;
      }
    }
    return this.levelOrder[0];
  }

  public getPreferredPlayLevelId(): string {
    const state = this.load();
    for (const levelId of this.levelOrder) {
      if (state.unlocked.includes(levelId) && !state.completed.includes(levelId)) {
        return levelId;
      }
    }

    for (let index = this.levelOrder.length - 1; index >= 0; index -= 1) {
      const levelId = this.levelOrder[index];
      if (state.unlocked.includes(levelId)) {
        return levelId;
      }
    }

    return this.levelOrder[0];
  }

  public isUnlocked(levelId: string): boolean {
    return this.load().unlocked.includes(levelId);
  }

  public isCompleted(levelId: string): boolean {
    return this.load().completed.includes(levelId);
  }
}
