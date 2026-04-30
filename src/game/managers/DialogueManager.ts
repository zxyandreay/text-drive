import type { DialogueBlock, DialoguePrompt } from "../types/LevelTypes";

type DialogueData = Record<string, DialogueBlock>;

export class DialogueManager {
  private readonly dialogueData: DialogueData;

  constructor(dialogueData: DialogueData) {
    this.dialogueData = dialogueData;
  }

  public getIntro(levelId: string): string {
    return this.getBlock(levelId).intro;
  }

  public getOutro(levelId: string): string {
    return this.getBlock(levelId).outro;
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
