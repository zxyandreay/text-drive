/** Delays for chat-thread rhythm (ms). Tuned per level mood; fallback for unknown ids. */

export type MessagePacing = {
  incomingDelayMs: number;
  hintDelayMs: number;
  sendBeatMs: number;
  nextIncomingMs: number;
  /** Show "typing…" row for this long after incomingDelay, before partner bubble. 0 = skip. */
  typingIndicatorMs: number;
};

const DEFAULT: MessagePacing = {
  incomingDelayMs: 520,
  hintDelayMs: 680,
  sendBeatMs: 240,
  nextIncomingMs: 1100,
  typingIndicatorMs: 420
};

const BY_LEVEL: Record<string, MessagePacing> = {
  "first-date": {
    incomingDelayMs: 420,
    hintDelayMs: 560,
    sendBeatMs: 200,
    nextIncomingMs: 920,
    typingIndicatorMs: 360
  },
  marriage: {
    incomingDelayMs: 580,
    hintDelayMs: 720,
    sendBeatMs: 260,
    nextIncomingMs: 1200,
    typingIndicatorMs: 480
  },
  "dying-wife": {
    incomingDelayMs: 720,
    hintDelayMs: 820,
    sendBeatMs: 280,
    nextIncomingMs: 1480,
    typingIndicatorMs: 520
  }
};

export function getMessagePacing(levelId: string): MessagePacing {
  return BY_LEVEL[levelId] ?? DEFAULT;
}
