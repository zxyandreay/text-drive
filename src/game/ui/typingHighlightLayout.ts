export type CharCell = { ch: string; color: string };

export type PlacedSegment = {
  x: number;
  y: number;
  text: string;
  color: string;
};

/** Per-index comparison: case-insensitive; past end of expected is wrong. */
export function charsMatchForHighlight(typed: string, expected: string, index: number): boolean {
  if (index < 0 || index >= typed.length) {
    return false;
  }
  if (index >= expected.length) {
    return false;
  }
  return typed[index].toLowerCase() === expected[index].toLowerCase();
}

/** One cell per typed character with highlight color. */
export function buildCharCells(typed: string, expected: string, colors: { ok: string; bad: string }): CharCell[] {
  const cells: CharCell[] = [];
  for (let i = 0; i < typed.length; i++) {
    const ok = charsMatchForHighlight(typed, expected, i);
    cells.push({ ch: typed[i], color: ok ? colors.ok : colors.bad });
  }
  return cells;
}

/** Run-length merge of adjacent cells with the same color (same string order). */
export function mergeCellsToSegments(cells: CharCell[]): { text: string; color: string }[] {
  if (cells.length === 0) {
    return [];
  }
  const out: { text: string; color: string }[] = [];
  let run = cells[0].ch;
  let color = cells[0].color;
  for (let i = 1; i < cells.length; i++) {
    if (cells[i].color === color) {
      run += cells[i].ch;
    } else {
      out.push({ text: run, color });
      run = cells[i].ch;
      color = cells[i].color;
    }
  }
  out.push({ text: run, color });
  return out;
}

/**
 * Greedy monospace wrap: one column per UTF-16 code unit, fixed char width.
 * Same rules as the legacy cell wrap — single source of truth for hint + typed alignment.
 */
export function wrapMonospaceStringToLines(text: string, charWidth: number, maxWidthPx: number): string[] {
  if (text.length === 0) {
    return [];
  }
  if (maxWidthPx <= 0 || charWidth <= 0) {
    return [text];
  }

  const lines: string[] = [];
  let current = "";
  let rowWidth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const w = charWidth;
    if (rowWidth + w > maxWidthPx + 1e-6 && current.length > 0) {
      lines.push(current);
      current = "";
      rowWidth = 0;
    }
    current += ch;
    rowWidth += w;
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

/** Top-left position of the character at `index` in `text` laid out as `lines`. */
export function positionForStringIndex(
  lines: string[],
  index: number,
  charWidth: number,
  lineHeight: number
): { x: number; y: number } {
  let offset = 0;
  for (let r = 0; r < lines.length; r++) {
    const line = lines[r];
    const len = line.length;
    if (index < offset + len) {
      const col = index - offset;
      return { x: col * charWidth, y: r * lineHeight };
    }
    offset += len;
  }
  throw new Error(`positionForStringIndex: index ${index} out of range for wrapped lines`);
}

/**
 * Top-left where the next character would go after the last character of `expected`
 * (same wrap as `wrapMonospaceStringToLines(expected, ...)`).
 */
export function positionAfterExpected(
  lines: string[],
  charWidth: number,
  lineHeight: number,
  maxWidthPx: number,
  expectedLength: number
): { x: number; y: number } {
  if (expectedLength === 0 || lines.length === 0) {
    return { x: 0, y: 0 };
  }

  const lastLine = lines[lines.length - 1];
  const c = lastLine.length - 1;
  const r = lines.length - 1;
  let x = (c + 1) * charWidth;
  let y = r * lineHeight;
  if (x + charWidth > maxWidthPx + 1e-6) {
    x = 0;
    y += lineHeight;
  }
  return { x, y };
}

type PositionedCell = { ch: string; color: string; x: number; y: number };

function mergePositionedCells(cells: PositionedCell[], charWidth: number): PlacedSegment[] {
  if (cells.length === 0) {
    return [];
  }
  const out: PlacedSegment[] = [];
  let run = cells[0].ch;
  let color = cells[0].color;
  let x = cells[0].x;
  let y = cells[0].y;
  let endX = x + charWidth;

  for (let i = 1; i < cells.length; i++) {
    const c = cells[i];
    if (c.color === color && c.y === y && c.x === endX) {
      run += c.ch;
      endX += charWidth;
    } else {
      out.push({ x, y, text: run, color });
      run = c.ch;
      color = c.color;
      x = c.x;
      y = c.y;
      endX = x + charWidth;
    }
  }
  out.push({ x, y, text: run, color });
  return out;
}

/**
 * Positions each typed character using the same line breaks as `expected` (hint geometry),
 * then continues with the same greedy wrap for characters past `expected.length`.
 */
export function layoutTypedCellsWithExpectedGeometry(
  typed: string,
  expected: string,
  colors: { ok: string; bad: string },
  charWidth: number,
  lineHeight: number,
  maxWidthPx: number
): PlacedSegment[] {
  if (typed.length === 0 || charWidth <= 0 || maxWidthPx <= 0) {
    return [];
  }

  const hintLines = wrapMonospaceStringToLines(expected, charWidth, maxWidthPx);
  const expLen = expected.length;
  const cells: PositionedCell[] = [];

  let ox = 0;
  let oy = 0;
  let overflowInitialized = false;

  for (let k = 0; k < typed.length; k++) {
    const color = charsMatchForHighlight(typed, expected, k) ? colors.ok : colors.bad;

    if (k < expLen) {
      const { x, y } = positionForStringIndex(hintLines, k, charWidth, lineHeight);
      cells.push({ ch: typed[k], color, x, y });
    } else {
      if (!overflowInitialized) {
        const p = positionAfterExpected(hintLines, charWidth, lineHeight, maxWidthPx, expLen);
        ox = p.x;
        oy = p.y;
        overflowInitialized = true;
      }
      if (ox + charWidth > maxWidthPx + 1e-6 && ox > 0) {
        ox = 0;
        oy += lineHeight;
      }
      cells.push({ ch: typed[k], color, x: ox, y: oy });
      ox += charWidth;
    }
  }

  return mergePositionedCells(cells, charWidth);
}

/**
 * Layout from pre-built cells using typed-only line breaks (expected === typed string geometry).
 */
export function layoutCellsAsPlacedSegments(
  cells: CharCell[],
  charWidth: number,
  lineHeight: number,
  contentWidth: number
): PlacedSegment[] {
  if (cells.length === 0 || charWidth <= 0 || contentWidth <= 0) {
    return [];
  }
  const typed = cells.map((c) => c.ch).join("");
  const lines = wrapMonospaceStringToLines(typed, charWidth, contentWidth);
  const positioned: PositionedCell[] = [];
  for (let k = 0; k < cells.length; k++) {
    const { x, y } = positionForStringIndex(lines, k, charWidth, lineHeight);
    positioned.push({ ch: cells[k].ch, color: cells[k].color, x, y });
  }
  return mergePositionedCells(positioned, charWidth);
}
