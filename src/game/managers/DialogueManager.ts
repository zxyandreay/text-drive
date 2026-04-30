import type { DialogueBlock, DialoguePrompt } from "../types/LevelTypes";

type DialogueData = Record<string, DialogueBlock>;

export class DialogueManager {
  private readonly dialogueData: DialogueData;

  constructor(dialogueData: DialogueData) {
    this.dialogueData = dialogueData;
  }

  public getOutro(levelId: string): string {
    return this.getBlock(levelId).outro;
  }

  public getOutcomeLines(levelId: string, outcome: "success" | "failure"): string[] {
    return this.getBlock(levelId).outcome[outcome];
  }

  public getPrompts(levelId: string): DialoguePrompt[] {
    return this.getBlock(levelId).prompts;
  }

  private getBlock(levelId: string): DialogueBlock {
    const block = this.dialogueData[levelId];
    if (!block) {
      throw new Error(`Missing dialogue block for level '${levelId}'.`);
    }
    return block;
  }
}
