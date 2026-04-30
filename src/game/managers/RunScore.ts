const POINTS_CORRECT_REPLY = 100;
const POINTS_LEVEL_COMPLETE = 250;
const POINTS_TIME_PER_SECOND = 2;
const POINTS_NO_CRASH_BONUS = 120;
const PENALTY_WRONG_SUBMIT = 45;
const PENALTY_CRASH = 35;
const PENALTY_OVERLOAD = 50;

export class RunScore {
  private score = 0;

  public reset(): void {
    this.score = 0;
  }

  public getScore(): number {
    return this.score;
  }

  public addCorrectReply(): void {
    this.score += POINTS_CORRECT_REPLY;
  }

  public addLevelComplete(): void {
    this.score += POINTS_LEVEL_COMPLETE;
  }

  public addTimeBonus(remainingStorySeconds: number): void {
    this.score += Math.max(0, Math.floor(remainingStorySeconds * POINTS_TIME_PER_SECOND));
  }

  public addNoCrashBonus(): void {
    this.score += POINTS_NO_CRASH_BONUS;
  }

  public penalizeWrongSubmit(): void {
    this.score = Math.max(0, this.score - PENALTY_WRONG_SUBMIT);
  }

  public penalizeCrash(): void {
    this.score = Math.max(0, this.score - PENALTY_CRASH);
  }

  public penalizeOverload(): void {
    this.score = Math.max(0, this.score - PENALTY_OVERLOAD);
  }
}
