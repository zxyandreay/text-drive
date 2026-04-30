export type LevelConfig = {
  id: string;
  title: string;
  tone: string;
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
  intro: string;
  outro: string;
  prompts: DialoguePrompt[];
};
