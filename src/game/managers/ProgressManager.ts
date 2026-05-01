import type { LevelConfig } from "../types/LevelTypes";

type ProgressStateV2 = {
  version: 2;
  completed: string[];
  bestScores: Record<string, number>;
};

type LegacyProgressState = {
  unlocked?: string[];
  completed: string[];
};

const STORAGE_KEY_V2 = "text-drive-progress-v2";
const STORAGE_KEY_V1 = "text-drive-progress-v1";

export class ProgressManager {
  private readonly levelOrder: string[];

  constructor(levels: LevelConfig[]) {
    this.levelOrder = levels.map((level) => level.id);
  }

  private deriveUnlocked(completed: string[]): string[] {
    const unlocked = new Set<string>();
    unlocked.add(this.levelOrder[0]);
    for (let i = 0; i < this.levelOrder.length - 1; i += 1) {
      if (completed.includes(this.levelOrder[i])) {
        unlocked.add(this.levelOrder[i + 1]);
      }
    }
    return this.levelOrder.filter((id) => unlocked.has(id));
  }

  private normalizeCompleted(completed: string[]): string[] {
    const valid = completed.filter((id) => this.levelOrder.includes(id));
    const ordered: string[] = [];
    for (const id of this.levelOrder) {
      if (valid.includes(id)) {
        ordered.push(id);
      }
    }
    return ordered;
  }

  /**
   * Only the first N levels in order may be completed (linear progression).
   * Drops out-of-order entries so a save cannot show level 2+ done without level 1, etc.
   */
  private coerceSequentialCompletions(completed: string[]): string[] {
    const ordered = this.normalizeCompleted(completed);
    const out: string[] = [];
    for (const id of this.levelOrder) {
      if (ordered.includes(id)) {
        out.push(id);
      } else {
        break;
      }
    }
    return out;
  }

  public load(): ProgressStateV2 {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      try {
        const parsed = JSON.parse(rawV2) as ProgressStateV2;
        if (parsed.version === 2 && Array.isArray(parsed.completed)) {
          const completed = this.normalizeCompleted(parsed.completed);
          const bestScores =
            parsed.bestScores && typeof parsed.bestScores === "object" ? { ...parsed.bestScores } : {};
          return {
            version: 2,
            completed,
            bestScores: this.sanitizeBestScores(bestScores)
          };
        }
      } catch {
        // fall through
      }
    }

    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      try {
        const parsed = JSON.parse(rawV1) as LegacyProgressState;
        const completed = this.coerceSequentialCompletions(parsed.completed ?? []);
        const state: ProgressStateV2 = {
          version: 2,
          completed,
          bestScores: {}
        };
        this.save(state);
        return state;
      } catch {
        // fall through
      }
    }

    return {
      version: 2,
      completed: [],
      bestScores: {}
    };
  }

  private sanitizeBestScores(scores: Record<string, number>): Record<string, number> {
    const out: Record<string, number> = {};
    for (const id of this.levelOrder) {
      const v = scores[id];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
        out[id] = Math.floor(v);
      }
    }
    return out;
  }

  public save(state: ProgressStateV2): void {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
  }

  public getUnlockedIds(): string[] {
    return this.deriveUnlocked(this.load().completed);
  }

  public isUnlocked(levelId: string): boolean {
    return this.getUnlockedIds().includes(levelId);
  }

  public isCompleted(levelId: string): boolean {
    return this.load().completed.includes(levelId);
  }

  public markCompleted(levelId: string): ProgressStateV2 {
    const current = this.load();
    const completedSet = new Set(current.completed);
    completedSet.add(levelId);
    const completed = this.coerceSequentialCompletions([...completedSet]);
    const next: ProgressStateV2 = {
      version: 2,
      completed,
      bestScores: { ...current.bestScores }
    };
    this.save(next);
    return next;
  }

  public getBestScore(levelId: string): number {
    return this.load().bestScores[levelId] ?? 0;
  }

  public recordBestIfBetter(levelId: string, score: number): number {
    const current = this.load();
    const prev = current.bestScores[levelId] ?? 0;
    const nextBest = Math.max(prev, Math.max(0, Math.floor(score)));
    if (nextBest !== prev) {
      const next: ProgressStateV2 = {
        ...current,
        bestScores: { ...current.bestScores, [levelId]: nextBest }
      };
      this.save(next);
    }
    return Math.max(prev, nextBest);
  }

  public getFirstUnlockedLevelId(): string {
    const unlocked = this.getUnlockedIds();
    return unlocked[0] ?? this.levelOrder[0];
  }

  public getPreferredPlayLevelId(): string {
    const unlocked = this.getUnlockedIds();
    const completed = this.load().completed;
    for (const levelId of this.levelOrder) {
      if (unlocked.includes(levelId) && !completed.includes(levelId)) {
        return levelId;
      }
    }
    for (let index = this.levelOrder.length - 1; index >= 0; index -= 1) {
      const levelId = this.levelOrder[index];
      if (unlocked.includes(levelId)) {
        return levelId;
      }
    }
    return this.levelOrder[0];
  }
}
