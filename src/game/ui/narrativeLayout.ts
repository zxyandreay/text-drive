import Phaser from "phaser";

/** Comfortable reading width on the 900px-wide layout; column never exceeds this. */
export const NARRATIVE_MAX_WIDTH = 420;

const MEASURE_X = -10000;
const MEASURE_Y = -10000;
const WIDTH_EPS = 1;
const ORPHAN_MAX_CHARS = 8;
const ORPHAN_PREV_MIN_CHARS = 28;

/**
 * Caps line length for narrative prose: min 240px, max {@link NARRATIVE_MAX_WIDTH}, within `usablePx`.
 */
export function getNarrativeColumnWidth(usablePx: number): number {
  const u = Math.max(0, usablePx);
  return Math.min(NARRATIVE_MAX_WIDTH, u);
}

function measureLineWidth(probe: Phaser.GameObjects.Text, line: string): number {
  probe.setText(line);
  return probe.width;
}

/** Greedy character break for a single token wider than `maxWidthPx`. */
function hardWrapLongWord(probe: Phaser.GameObjects.Text, word: string, maxWidthPx: number): string[] {
  if (word.length === 0) {
    return [];
  }
  if (measureLineWidth(probe, word) <= maxWidthPx + WIDTH_EPS) {
    return [word];
  }
  const out: string[] = [];
  let rest = word;
  while (rest.length > 0) {
    let lo = 1;
    let hi = rest.length;
    let best = 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const w = measureLineWidth(probe, rest.slice(0, mid));
      if (w <= maxWidthPx + WIDTH_EPS) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (best < 1) {
      best = 1;
    }
    out.push(rest.slice(0, best));
    rest = rest.slice(best);
  }
  return out;
}

/** Pull one word from the penultimate line onto a too-short last line when both still fit. */
function balanceOrphanLastLine(
  probe: Phaser.GameObjects.Text,
  lines: string[],
  maxWidthPx: number
): void {
  if (lines.length < 2) {
    return;
  }
  const lastIdx = lines.length - 1;
  const last = lines[lastIdx];
  const prev = lines[lastIdx - 1];
  if (last.length >= ORPHAN_MAX_CHARS || prev.length < ORPHAN_PREV_MIN_CHARS) {
    return;
  }
  const prevWords = prev.split(/\s+/).filter(Boolean);
  if (prevWords.length < 2) {
    return;
  }
  const move = prevWords.pop()!;
  const newPrev = prevWords.join(" ");
  const newLast = `${move} ${last}`.trim();
  if (
    measureLineWidth(probe, newPrev) <= maxWidthPx + WIDTH_EPS &&
    measureLineWidth(probe, newLast) <= maxWidthPx + WIDTH_EPS
  ) {
    lines[lastIdx - 1] = newPrev;
    lines[lastIdx] = newLast;
  }
}

/**
 * Word-based wrap using live Phaser text metrics (matches browser font rendering).
 * Does not use Phaser `wordWrap` (greedy character breaks).
 */
export function wrapParagraphToLines(
  probe: Phaser.GameObjects.Text,
  paragraph: string,
  maxWidthPx: number
): string[] {
  const words = paragraph.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }
  const lines: string[] = [];
  let current = "";

  const pushCurrent = (): void => {
    if (current.length > 0) {
      lines.push(current);
      current = "";
    }
  };

  for (const word of words) {
    const trial = current.length > 0 ? `${current} ${word}` : word;
    if (measureLineWidth(probe, trial) <= maxWidthPx + WIDTH_EPS) {
      current = trial;
      continue;
    }
    pushCurrent();
    if (measureLineWidth(probe, word) <= maxWidthPx + WIDTH_EPS) {
      current = word;
    } else {
      const chunks = hardWrapLongWord(probe, word, maxWidthPx);
      for (let i = 0; i < chunks.length - 1; i++) {
        lines.push(chunks[i]);
      }
      current = chunks[chunks.length - 1] ?? "";
    }
  }
  pushCurrent();

  balanceOrphanLastLine(probe, lines, maxWidthPx);
  return lines;
}

/** Build probe style: no wordWrap (we inject newlines ourselves). */
function probeStyleFrom(style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.Types.GameObjects.Text.TextStyle {
  const { wordWrap: _w, ...rest } = style as Phaser.Types.GameObjects.Text.TextStyle & { wordWrap?: unknown };
  return rest;
}

/**
 * Each string in `paragraphs` is one paragraph (e.g. one JSON array entry). Paragraphs are
 * word-wrapped to `maxWidthPx`, separated by blank lines in the returned string.
 */
export function formatNarrativeBody(
  scene: Phaser.Scene,
  paragraphs: string[],
  style: Phaser.Types.GameObjects.Text.TextStyle,
  maxWidthPx: number
): string {
  const probe = scene.add.text(MEASURE_X, MEASURE_Y, "", probeStyleFrom(style));
  try {
    const parts = paragraphs.map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length === 0) {
      return "";
    }
    return parts
      .map((p) => wrapParagraphToLines(probe, p, maxWidthPx).join("\n"))
      .join("\n\n");
  } finally {
    probe.destroy();
  }
}
