import { FONTS } from '../design-system/designTokens';

/**
 * Text layout engine (word wrap + *highlight*).
 * Used both for rendering in Konva and by the templates to compute heights.
 * Words between *asterisks* get the highlight color; the asterisks
 * are markup and are never rendered.
 */

export interface TextRun {
  text: string;
  highlight: boolean;
  x: number;
  width: number;
}

export interface TextLine {
  runs: TextRun[];
  width: number;
  y: number;
}

export interface TextLayoutInput {
  text: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  /** letterSpacing in em */
  letterSpacing: number;
  width: number;
  align: 'left' | 'center' | 'right';
  uppercase?: boolean;
}

export interface TextLayoutResult {
  lines: TextLine[];
  height: number;
  maxLineWidth: number;
}

let ctx: CanvasRenderingContext2D | null = null;
function getCtx(): CanvasRenderingContext2D | null {
  if (ctx) return ctx;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  ctx = c.getContext('2d');
  return ctx;
}

export function fontString(fontSize: number, fontWeight: number) {
  return `${fontWeight} ${fontSize}px "${FONTS.primary}", ${FONTS.fallback}`;
}

const cache = new Map<string, number>();
export function measureWidth(text: string, fontSize: number, fontWeight: number, letterSpacingPx: number): number {
  const key = `${fontWeight}|${fontSize}|${letterSpacingPx}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const c = getCtx();
  let w: number;
  if (c) {
    c.font = fontString(fontSize, fontWeight);
    w = c.measureText(text).width + letterSpacingPx * text.length;
  } else {
    // Approximation for environments without canvas (tests)
    w = text.length * fontSize * 0.56 + letterSpacingPx * text.length;
  }
  if (cache.size > 5000) cache.clear();
  cache.set(key, w);
  return w;
}

/** Clears the cache after fonts load (the metrics change) */
export function resetMeasureCache() {
  cache.clear();
}

interface Token {
  text: string;
  highlight: boolean;
  space: boolean;
}

function tokenize(paragraph: string, startHighlight: boolean): { tokens: Token[]; endHighlight: boolean } {
  const tokens: Token[] = [];
  let highlight = startHighlight;
  let buf = '';
  const flush = () => {
    if (buf) {
      tokens.push({ text: buf, highlight, space: false });
      buf = '';
    }
  };
  for (const ch of paragraph) {
    if (ch === '*') {
      flush();
      highlight = !highlight;
      continue;
    }
    if (ch === ' ') {
      flush();
      tokens.push({ text: ' ', highlight, space: true });
      continue;
    }
    buf += ch;
  }
  flush();
  return { tokens, endHighlight: highlight };
}

/** Removes the highlight markup (for plain display) */
export const stripMarkup = (s: string) => s.replace(/\*/g, '');

export function layoutText(input: TextLayoutInput): TextLayoutResult {
  const { fontSize, fontWeight, lineHeight, width, align } = input;
  const ls = input.letterSpacing * fontSize;
  const text = input.uppercase ? input.text.toUpperCase() : input.text;
  const lineH = fontSize * lineHeight;
  const spaceW = measureWidth(' ', fontSize, fontWeight, ls);

  const lines: TextLine[] = [];
  let highlight = false;

  for (const paragraph of text.split('\n')) {
    const { tokens, endHighlight } = tokenize(paragraph, highlight);
    highlight = endHighlight;

    // Groups tokens into words (a word may mix highlighted and plain segments)
    type Word = { parts: Token[]; width: number };
    const words: Word[] = [];
    let cur: Word | null = null;
    for (const t of tokens) {
      if (t.space) {
        cur = null;
        continue;
      }
      if (!cur) {
        cur = { parts: [], width: 0 };
        words.push(cur);
      }
      cur.parts.push(t);
      cur.width += measureWidth(t.text, fontSize, fontWeight, ls);
    }

    let lineWords: Word[] = [];
    let lineWidth = 0;
    const pushLine = () => {
      lines.push(buildLine(lineWords));
      lineWords = [];
      lineWidth = 0;
    };
    const buildLine = (ws: Word[]): TextLine => {
      // Merges consecutive parts with the same highlight into runs
      const merged: { text: string; highlight: boolean }[] = [];
      const push = (text: string, hl: boolean) => {
        const last = merged[merged.length - 1];
        if (last && last.highlight === hl) last.text += text;
        else merged.push({ text, highlight: hl });
      };
      ws.forEach((w, wi) => {
        if (wi > 0) push(' ', merged[merged.length - 1].highlight);
        w.parts.forEach((p) => push(p.text, p.highlight));
      });
      let x = 0;
      const runs: TextRun[] = merged.map((m) => {
        const w = measureWidth(m.text, fontSize, fontWeight, ls);
        const run = { text: m.text, highlight: m.highlight, x, width: w };
        x += w;
        return run;
      });
      // Konva adds letterSpacing after the last character too; the visual width drops it
      const total = Math.max(0, x - (runs.length ? ls : 0));
      return { runs, width: total, y: 0 };
    };

    if (words.length === 0) {
      lines.push({ runs: [], width: 0, y: 0 });
      continue;
    }

    for (const w of words) {
      const add = lineWords.length ? spaceW + w.width : w.width;
      if (lineWords.length && lineWidth + add > width + 0.5) {
        pushLine();
        lineWords.push(w);
        lineWidth = w.width;
      } else {
        lineWords.push(w);
        lineWidth += add;
      }
    }
    if (lineWords.length) pushLine();
  }

  let maxLineWidth = 0;
  lines.forEach((l, i) => {
    l.y = i * lineH;
    maxLineWidth = Math.max(maxLineWidth, l.width);
    const offset = align === 'center' ? (width - l.width) / 2 : align === 'right' ? width - l.width : 0;
    l.runs.forEach((r) => (r.x += offset));
  });

  return { lines, height: Math.max(lineH, lines.length * lineH), maxLineWidth };
}

/** Largest font size (≤ max) that keeps the text within maxLines/maxHeight */
export function fitFontSize(
  base: Omit<TextLayoutInput, 'fontSize'>,
  max: number,
  min: number,
  limits: { maxHeight?: number; maxLines?: number; singleLineWidth?: boolean },
): number {
  for (let size = max; size >= min; size -= 2) {
    const r = layoutText({ ...base, fontSize: size });
    const okH = limits.maxHeight === undefined || r.height <= limits.maxHeight;
    const okL = limits.maxLines === undefined || r.lines.length <= limits.maxLines;
    const okW = !limits.singleLineWidth || r.maxLineWidth <= base.width;
    if (okH && okL && okW) return size;
  }
  return min;
}
