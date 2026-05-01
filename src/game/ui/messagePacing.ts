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
    incomingDelayMs: 450,
    hintDelayMs: 600,
    sendBeatMs: 210,
    nextIncomingMs: 980,
    typingIndicatorMs: 400
  },
  marriage: {
    incomingDelayMs: 520,
    hintDelayMs: 640,
    sendBeatMs: 240,
    nextIncomingMs: 1050,
    typingIndicatorMs: 420
  },
  hospital: {
    incomingDelayMs: 300,
    hintDelayMs: 400,
    sendBeatMs: 170,
    nextIncomingMs: 720,
    typingIndicatorMs: 280
  }
};

export function getMessagePacing(levelId: string): MessagePacing {
  return BY_LEVEL[levelId] ?? DEFAULT;
}
