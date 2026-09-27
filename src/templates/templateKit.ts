import { CANVAS, CONTENT_WIDTH, LAYOUT, TYPE_SCALE, tok } from '../design-system/designTokens';
import type { CarouselElement, CarouselSettings, ContentKey, SlideContent, SlideTheme, TemplateId } from '../types/carouselTypes';
import { pad2 } from '../utils/id';
import { fitFontSize } from '../utils/textLayout';
import { bindText, makeShape, makeText } from './elementFactory';

/** Shared template toolkit (themes, stacking, text fitting, recurring elements) */

export interface TemplateContext {
  index: number;
  total: number;
  theme: SlideTheme;
  settings: CarouselSettings;
}

export interface ThemeColors {
  bg: string;
  text: string;
  muted: string;
  mutedOpacity: number;
  accent: string;
  card: string;
  cardText: string;
  rule: string;
}

export const THEMES: Record<SlideTheme, ThemeColors> = {
  dark: {
    bg: tok('primary'),
    text: tok('light'),
    muted: tok('muted'),
    mutedOpacity: 1,
    accent: tok('secondary'),
    card: tok('dark'),
    cardText: tok('light'),
    rule: tok('muted'),
  },
  light: {
    bg: tok('light'),
    text: tok('primary'),
    muted: tok('muted'),
    mutedOpacity: 1,
    accent: tok('secondary'),
    card: tok('sand'),
    cardText: tok('primary'),
    rule: tok('primary'),
  },
  accent: {
    bg: tok('secondary'),
    text: tok('light'),
    muted: tok('light'),
    mutedOpacity: 0.75,
    accent: tok('primary'),
    card: tok('primary'),
    cardText: tok('light'),
    rule: tok('light'),
  },
};

export interface TemplateDef {
  id: TemplateId;
  number: string;
  name: string;
  description: string;
  defaultTheme: SlideTheme;
  /** Fields the template shows directly */
  uses: ContentKey[];
  build: (c: SlideContent, ctx: TemplateContext) => CarouselElement[];
}

export const M = LAYOUT.safeMargin;
export const BOTTOM = CANVAS.height - M; // 1270
export const CONTENT_BOTTOM = 1170; // above the footer

// ────────────────────────────────────────────── helpers

export function chrome(ctx: TemplateContext, opts: { header?: boolean; footer?: boolean; arrow?: boolean; counter?: boolean } = {}) {
  const t = THEMES[ctx.theme];
  const els: CarouselElement[] = [];
  const { settings } = ctx;
  const header = opts.header ?? true;
  const footer = opts.footer ?? true;
  if (header && settings.showHeader) {
    els.push(
      makeText(settings.eyebrowDefault, {
        name: 'Cabeçalho',
        role: 'chrome',
        style: 'caption',
        uppercase: true,
        letterSpacing: 0.16,
        fontWeight: 600,
        color: t.muted,
        opacity: t.mutedOpacity,
        x: M,
        y: M,
        width: 640,
      }),
    );
  }
  if (header && settings.showCounter && (opts.counter ?? true)) {
    els.push(
      makeText(`${pad2(ctx.index + 1)} / ${pad2(ctx.total)}`, {
        name: 'Contador',
        role: 'counter',
        style: 'caption',
        fontWeight: 600,
        letterSpacing: 0.1,
        align: 'right',
        color: t.muted,
        opacity: t.mutedOpacity,
        x: CANVAS.width - M - 240,
        y: M,
        width: 240,
      }),
    );
  }
  if (footer && settings.showFooter) {
    els.push(
      makeText(settings.handle, {
        name: 'Handle',
        role: 'chrome',
        style: 'caption',
        fontWeight: 500,
        color: t.muted,
        opacity: t.mutedOpacity,
        x: M,
        y: BOTTOM - 26,
        width: 600,
      }),
    );
    if (opts.arrow ?? ctx.index < ctx.total - 1) {
      els.push(
        makeShape('arrow', {
          name: 'Seta (arraste)',
          role: 'chrome',
          x: CANVAS.width - M - 72,
          y: BOTTOM - 26,
          width: 72,
          height: 26,
          fill: t.text,
          stroke: t.text,
          strokeWidth: 3,
        }),
      );
    }
  }
  return els;
}

/** Stacks elements vertically starting at `y` with gaps */
export function stack(items: Array<CarouselElement | number | null | undefined | false>, startY: number) {
  let y = startY;
  const out: CarouselElement[] = [];
  for (const it of items) {
    if (it === null || it === undefined || it === false) continue;
    if (typeof it === 'number') {
      y += it;
      continue;
    }
    it.y = Math.round(y);
    y += it.height;
    out.push(it);
  }
  return { els: out, bottom: y };
}

/** Centers a group of elements vertically between top and bottom */
export function centerIn(els: CarouselElement[], top: number, bottom: number, bias = 0.45) {
  if (!els.length) return els;
  const minY = Math.min(...els.map((e) => e.y));
  const maxY = Math.max(...els.map((e) => e.y + e.height));
  const h = maxY - minY;
  const target = Math.max(top, top + (bottom - top - h) * bias);
  const dy = target - minY;
  els.forEach((e) => (e.y = Math.round(e.y + dy)));
  return els;
}

export function anchorBottom(els: CarouselElement[], bottom: number) {
  if (!els.length) return els;
  const maxY = Math.max(...els.map((e) => e.y + e.height));
  const dy = bottom - maxY;
  els.forEach((e) => (e.y = Math.round(e.y + dy)));
  return els;
}

export function fitted(
  text: string,
  style: keyof typeof TYPE_SCALE,
  width: number,
  limits: { max?: number; min: number; maxHeight?: number; maxLines?: number },
  weight?: number,
  over: { uppercase?: boolean; lineHeight?: number; letterSpacing?: number } = {},
) {
  const s = TYPE_SCALE[style];
  return fitFontSize(
    {
      text,
      fontWeight: weight ?? s.fontWeight,
      lineHeight: over.lineHeight ?? s.lineHeight,
      letterSpacing: over.letterSpacing ?? s.letterSpacing,
      uppercase: over.uppercase,
      width,
      align: 'left',
    },
    limits.max ?? s.fontSize,
    limits.min,
    { maxHeight: limits.maxHeight, maxLines: limits.maxLines, singleLineWidth: true },
  );
}

/** Fields the template does not show → an extra block so no content is lost */
export function leftovers(c: SlideContent, uses: ContentKey[]): string {
  const out: string[] = [];
  const has = (k: ContentKey) => uses.includes(k);
  if (c.headline && !has('headline')) out.push(c.headline);
  if (c.quote && !has('quote')) out.push(`“${c.quote}”`);
  if (c.number && !has('number')) out.push(c.number);
  if (c.body && !has('body')) out.push(c.body);
  if (c.items?.length && !has('items')) out.push(c.items.map((i) => `• ${i}`).join('\n'));
  if ((c.leftBody || c.leftTitle) && !has('leftBody')) out.push(`${c.leftTitle ?? 'A'}: ${c.leftBody ?? ''}`);
  if ((c.rightBody || c.rightTitle) && !has('rightBody')) out.push(`${c.rightTitle ?? 'B'}: ${c.rightBody ?? ''}`);
  if (c.cta && !has('cta')) out.push(c.cta);
  if (c.author && !has('author')) out.push(`— ${c.author}`);
  if (c.name && !has('name')) out.push(c.name);
  if (c.date && !has('date')) out.push(c.date);
  if (c.source && !has('source')) out.push(`Fonte: ${c.source}`);
  return out.join('\n');
}

export function extraBlock(c: SlideContent, uses: ContentKey[], t: ThemeColors, width = CONTENT_WIDTH) {
  const txt = leftovers(c, uses);
  if (!txt) return null;
  return makeText(txt, {
    name: 'Conteúdo extra',
    role: 'extra',
    style: 'bodySm',
    color: t.text,
    opacity: 0.8,
    width,
  });
}

export const accentRule = (t: ThemeColors, w = 72, h = 8) =>
  makeShape('rect', { name: 'Régua de destaque', role: 'decor', x: M, width: w, height: h, fill: t.accent });

export const eyebrowText = (text: string, t: ThemeColors) =>
  bindText('eyebrow', text, {
    name: 'Eyebrow',
    role: 'eyebrow',
    style: 'eyebrow',
    uppercase: true,
    color: t.accent,
  });

