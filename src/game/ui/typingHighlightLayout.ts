export type CharCell = { ch: string; color: string };

export type PlacedSegment = {
  x: number;
  y: number;
  text: string;
  color: string;
};

const W_EPS = 1e-6;

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
 * Greedy character wrap for a single token when it cannot fit as a whole word/space run.
 * First chunk uses `firstChunkBudgetPx`; further chunks use full-line `continuationBudgetPx`.
 */
function hardWrapTokenToFitBudget(
  token: string,
  charWidth: number,
  firstChunkBudgetPx: number,
  continuationBudgetPx: number
): string[] {
  if (token.length === 0 || charWidth <= 0) {
    return token.length > 0 ? [token] : [];
  }
  const chunks: string[] = [];
  let rest = token;
  while (rest.length > 0) {
    let line = "";
    let rowWidth = 0;
    const lineBudget =
      chunks.length === 0
        ? Math.max(firstChunkBudgetPx, charWidth)
        : Math.max(continuationBudgetPx, charWidth);
    for (let i = 0; i < rest.length; i++) {
      const w = charWidth;
      if (rowWidth + w > lineBudget + W_EPS && line.length > 0) {
        break;
      }
      line += rest[i];
      rowWidth += w;
    }
    if (line.length === 0) {
      line = rest[0];
    }
    chunks.push(line);
    rest = rest.slice(line.length);
  }
  return chunks;
}

type WrapState = {
  lines: string[];
  current: string;
  rowWidth: number;
  budget: number;
  maxWidthPx: number;
  charWidth: number;
};

function flushLine(state: WrapState): void {
  if (state.current.length === 0) {
    return;
  }
  state.lines.push(state.current);
  state.current = "";
  state.rowWidth = 0;
  state.budget = state.maxWidthPx;
}

function appendWhitespaceRun(state: WrapState, ws: string): void {
  const w = ws.length * state.charWidth;
  if (state.rowWidth + w <= state.budget + W_EPS) {
    state.current += ws;
    state.rowWidth += w;
    return;
  }
  if (state.current.length > 0) {
    flushLine(state);
  }
  const chunks = hardWrapTokenToFitBudget(ws, state.charWidth, state.budget, state.maxWidthPx);
  for (let ci = 0; ci < chunks.length; ci++) {
    const ch = chunks[ci];
    if (state.current.length > 0) {
      flushLine(state);
    }
    state.current = ch;
    state.rowWidth = ch.length * state.charWidth;
    if (ci < chunks.length - 1) {
      flushLine(state);
    }
  }
}

function appendWord(state: WrapState, word: string): void {
  let rest = word;
  while (rest.length > 0) {
    const wordWidth = rest.length * state.charWidth;
    if (state.rowWidth + wordWidth <= state.budget + W_EPS) {
      state.current += rest;
      state.rowWidth += wordWidth;
      return;
    }
    if (state.current.length > 0) {
      flushLine(state);
      continue;
    }
    const chunks = hardWrapTokenToFitBudget(rest, state.charWidth, state.budget, state.maxWidthPx);
    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci];
      if (state.current.length > 0) {
        flushLine(state);
      }
      state.current = chunk;
      state.rowWidth = chunk.length * state.charWidth;
      if (ci < chunks.length - 1) {
        flushLine(state);
      }
    }
    return;
  }
}

/**
 * Word-aware monospace wrap: breaks at whitespace when possible; splits mid-token only when
 * a single word exceeds the line budget. Lines concatenate back to `text` exactly.
 *
 * @param firstLineBudgetPx max pixel width for the first output line (defaults to `maxWidthPx`).
 *        Use `maxWidthPx - startX` when continuing on a row that already has content.
 */
export function wrapMonospaceStringToLines(
  text: string,
  charWidth: number,
  maxWidthPx: number,
  firstLineBudgetPx: number = maxWidthPx
): string[] {
  if (text.length === 0) {
    return [];
  }
  if (maxWidthPx <= 0 || charWidth <= 0) {
    return [text];
  }

  const tokens = text.match(/\S+|\s+/g);
  if (!tokens) {
    return [text];
  }

  const budget0 = Math.min(firstLineBudgetPx, maxWidthPx);
  const state: WrapState = {
    lines: [],
    current: "",
    rowWidth: 0,
    budget: Math.max(budget0, charWidth),
    maxWidthPx,
    charWidth
  };

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      appendWhitespaceRun(state, token);
    } else {
      appendWord(state, token);
    }
  }
  if (state.current.length > 0) {
    state.lines.push(state.current);
  }
  return state.lines;
}

/** Per-character positions for `text` wrapped with optional first-line pixel budget. */
function monospacePixelPositions(
  text: string,
  charWidth: number,
  lineHeight: number,
  maxWidthPx: number,
  firstLineBudgetPx: number,
  originX: number,
  originY: number
): { x: number; y: number }[] {
  if (text.length === 0) {
    return [];
  }
  const lines = wrapMonospaceStringToLines(text, charWidth, maxWidthPx, firstLineBudgetPx);
  const pos: { x: number; y: number }[] = [];
  for (let r = 0; r < lines.length; r++) {
    const line = lines[r];
    const baseX = r === 0 ? originX : 0;
    const y = originY + r * lineHeight;
    for (let c = 0; c < line.length; c++) {
      pos.push({ x: baseX + c * charWidth, y });
    }
  }
  return pos;
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
  if (x + charWidth > maxWidthPx + W_EPS) {
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
 * then word-aware wrap for characters past `expected.length` with correct first-row remainder.
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

  for (let k = 0; k < typed.length; k++) {
    const color = charsMatchForHighlight(typed, expected, k) ? colors.ok : colors.bad;

    if (k < expLen) {
      const { x, y } = positionForStringIndex(hintLines, k, charWidth, lineHeight);
      cells.push({ ch: typed[k], color, x, y });
    }
  }

  if (typed.length > expLen) {
    const suffix = typed.slice(expLen);
    const start = positionAfterExpected(hintLines, charWidth, lineHeight, maxWidthPx, expLen);
    const firstBudget = Math.max(maxWidthPx - start.x, charWidth);
    const overflowPos = monospacePixelPositions(
      suffix,
      charWidth,
      lineHeight,
      maxWidthPx,
      firstBudget,
      start.x,
      start.y
    );
    for (let i = 0; i < suffix.length; i++) {
      const color = charsMatchForHighlight(typed, expected, expLen + i) ? colors.ok : colors.bad;
      const p = overflowPos[i];
      cells.push({ ch: suffix[i], color, x: p.x, y: p.y });
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
