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
 * Wrap monospace cells into lines, then emit positioned segments for Phaser Text objects.
 * `charWidth` should match the monospace font used for the typed line.
 */
export function layoutCellsAsPlacedSegments(
  cells: CharCell[],
  charWidth: number,
  lineHeight: number,
  contentWidth: number
): PlacedSegment[] {
  if (cells.length === 0 || contentWidth <= 0 || charWidth <= 0) {
    return [];
  }

  const lines: CharCell[][] = [];
  let line: CharCell[] = [];
  let rowWidth = 0;

  for (const c of cells) {
    const w = charWidth;
    if (rowWidth + w > contentWidth + 1e-6 && line.length > 0) {
      lines.push(line);
      line = [];
      rowWidth = 0;
    }
    line.push(c);
    rowWidth += w;
  }
  if (line.length > 0) {
    lines.push(line);
  }

  const placed: PlacedSegment[] = [];
  for (let row = 0; row < lines.length; row++) {
    const y = row * lineHeight;
    const segments = mergeCellsToSegments(lines[row]);
    let x = 0;
    for (const seg of segments) {
      placed.push({ x, y, text: seg.text, color: seg.color });
      x += seg.text.length * charWidth;
    }
  }
  return placed;
}
