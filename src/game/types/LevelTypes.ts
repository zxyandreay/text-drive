export type LevelConfig = {
  id: string;
  title: string;
  tone: string;
  roadSpeed: number;
  obstacleSpeed: number;
  obstacleSpawnMs: number;
  maxStress: number;
};

export type DialoguePrompt = {
  incoming: string;
  reply: string;
  timeLimitSeconds: number;
};

export type DialogueBlock = {
  intro: string;
  outro: string;
  prompts: DialoguePrompt[];
};
