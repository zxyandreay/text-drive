export type LevelConfig = {
  id: string;
  title: string;
  tone: string;
  introNarration: string[];
  roadSpeed: number;
  obstacleSpeed: number;
  obstacleSpawnMs: number;
  maxStress: number;
  storyTimeSeconds: number;
};

export type DialoguePrompt = {
  incoming: string;
  reply: string;
};

export type DialogueBlock = {
  outro: string;
  outcome: {
    success: string;
    failure: string;
  };
  prompts: DialoguePrompt[];
};
