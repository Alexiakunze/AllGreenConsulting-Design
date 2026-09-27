import { CANVAS, CONTENT_WIDTH, tok, type TypeStyle } from '../design-system/designTokens';
import type { CarouselElement, ContentKey, SlideContent, TemplateId, TextElement } from '../types/carouselTypes';
import { pad2 } from '../utils/id';
import { bindText, logoHeightFor, makeLogo, makeShape, makeText } from './elementFactory';
import {
  anchorBottom,
  BOTTOM,
  centerIn,
  extraBlock,
  fitted,
  M,
  stack,
  THEMES,
  type TemplateContext,
  type ThemeColors,
} from './templateKit';

/**
 * "MOVIMENTO" STYLE — visual language inspired by Dunamis Movement / Big Wave Media,
 * translated to the All Green palette:
 *  - GIANT uppercase headlines, tight (Space Grotesk 700, line-height 0.9,
 *    negative tracking), filling the column width
 *  - Poster frame: thin rules with small-caps metadata at the top and bottom
 *    ("ALL GREEN CONSULTING ………… (03/08)")
 *  - Film grain over the whole slide; photos in high-contrast black & white
 *  - Full-bleed photography with a scrim in the background color
 *  - Orange as a highlight, and the arch from the symbol as a large tone-on-tone mass
 */

const MEGA = { fontWeight: 700, lineHeight: 0.96, letterSpacing: -0.035, uppercase: true } as const;
const SMALLCAPS = { fontSize: 20, fontWeight: 600, letterSpacing: 0.14, lineHeight: 1.2, uppercase: true } as const;
const TOP_RULE_Y = M + 44;
const BOTTOM_RULE_Y = BOTTOM - 52;
const CONTENT_TOP = TOP_RULE_Y + 76;
const CONTENT_END = BOTTOM_RULE_Y - 56;

export const counterText = (index: number, total: number) => `(${pad2(index + 1)}/${pad2(total)})`;

/** Tone-on-tone color for large masses (arch, photo placeholder) */
function tone(ctx: TemplateContext) {
  return ctx.theme === 'dark' ? tok('dark') : ctx.theme === 'light' ? tok('sand') : tok('primary');
}

function mega(
  text: string,
  bind: ContentKey,
  t: ThemeColors,
  limits: { max: number; min: number; maxHeight?: number; maxLines?: number },
  opts: Partial<TextElement> & { width?: number; style?: TypeStyle } = {},
) {
  const width = opts.width ?? CONTENT_WIDTH;
  // 3% safety margin: large glyphs overshoot the metric width slightly
  const size = fitted(text || ' ', 'display', width * 0.97, limits, MEGA.fontWeight, { ...MEGA, lineHeight: opts.lineHeight ?? MEGA.lineHeight, letterSpacing: opts.letterSpacing ?? MEGA.letterSpacing });
  return bindText(bind, text, {
    name: 'Headline',
    role: 'headline',
    style: 'display',
    ...MEGA,
    fontSize: size,
    color: t.text,
    highlightColor: t.accent,
    width,
    ...opts,
  });
}

function smallcaps(text: string, color: string, opts: Partial<TextElement> = {}) {
  return makeText(text, { name: 'Rótulo', role: 'decor', style: 'caption', ...SMALLCAPS, color, width: 600, ...opts });
}

function body(text: string, bind: ContentKey, t: ThemeColors, opts: Partial<TextElement> = {}) {
  return bindText(bind, text, {
    name: 'Texto',
    role: 'body',
    style: 'body',
    fontSize: 32,
    fontWeight: 500,
    lineHeight: 1.32,
    color: t.text,
    opacity: 0.78,
    highlightColor: t.accent,
    ...opts,
  });
}

/** Poster frame: top rule + metadata, bottom rule + handle / swipe */
function frame(ctx: TemplateContext, opts: { footer?: boolean; logoFooter?: boolean } = {}) {
  const t = THEMES[ctx.theme];
  const s = ctx.settings;
  const els: CarouselElement[] = [];
  const rule = (y: number, name: string) =>
    makeShape('rect', { name, role: 'chrome', x: M, y, width: CONTENT_WIDTH, height: 2, fill: t.text, opacity: 0.22 });
  if (s.showHeader) {
    els.push(smallcaps(s.eyebrowDefault, t.text, { name: 'Cabeçalho', role: 'chrome', x: M, y: M, opacity: 0.75 }));
    if (s.showCounter) {
      els.push(
        smallcaps(counterText(ctx.index, ctx.total), t.text, { name: 'Contador', role: 'counter', align: 'right', x: CANVAS.width - M - 240, y: M, width: 240, opacity: 0.75 }),
      );
    }
    els.push(rule(TOP_RULE_Y, 'Régua superior'));
  }
  if ((opts.footer ?? true) && s.showFooter) {
    els.push(rule(BOTTOM_RULE_Y, 'Régua inferior'));
    if (opts.logoFooter) {
      const logo = makeLogo(ctx.theme === 'light' ? 'horizontal' : 'horizontalNegative', { role: 'logo', x: M, width: 190 });
      logo.height = logoHeightFor(logo.variant, 190);
      logo.y = BOTTOM - logo.height + 8;
      els.push(logo);
    } else {
      els.push(smallcaps(s.handle, t.text, { name: 'Handle', role: 'chrome', x: M, y: BOTTOM - 22, uppercase: false, letterSpacing: 0.04, opacity: 0.75 }));
    }
    if (ctx.index < ctx.total - 1) {
      els.push(smallcaps('Arraste', t.text, { name: 'Arraste', role: 'chrome', align: 'right', x: CANVAS.width - M - 72 - 20 - 200, y: BOTTOM - 22, width: 200 }));
      els.push(
        makeShape('arrow', { name: 'Seta (arraste)', role: 'chrome', x: CANVAS.width - M - 72, y: BOTTOM - 24, width: 72, height: 24, fill: t.text, stroke: t.text, strokeWidth: 3 }),
      );
    }
  }
  return els;
}

/** Full-width action bar (replaces the rounded button) */
function ctaBar(text: string, t: ThemeColors, ctx: TemplateContext) {
  const fill = ctx.theme === 'accent' ? tok('primary') : tok('secondary');
  const bar = makeShape('rect', { name: 'Barra CTA', role: 'cta', x: M, width: CONTENT_WIDTH, height: 116, fill });
  const label = bindText('cta', text, {
    name: 'CTA',
    role: 'cta',
    style: 'subheadline',
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.01,
    lineHeight: 1,
    uppercase: true,
    color: tok('light'),
    highlightColor: tok('light'),
    x: M + 40,
    width: CONTENT_WIDTH - 180,
  });
  const arrow = makeShape('arrow', { name: 'Seta CTA', role: 'cta', x: M + CONTENT_WIDTH - 40 - 80, width: 80, height: 30, fill: tok('light'), stroke: tok('light'), strokeWidth: 4 });
  // Positions relative to the bar (adjusted by place())
  const place = (y: number) => {
    bar.y = y;
    label.y = Math.round(y + (bar.height - label.height) / 2);
    arrow.y = Math.round(y + (bar.height - arrow.height) / 2);
  };
  return { bar, label, arrow, place, height: bar.height, t };
}

type Builder = (c: SlideContent, ctx: TemplateContext, uses: ContentKey[]) => CarouselElement[];

const cover: Builder = (c, ctx, uses) => {
  const t = THEMES[ctx.theme];
  const arch = makeShape('arch', { name: 'Arco (massa)', role: 'decor', x: 520, y: 150, width: 700, height: 1400, fill: tone(ctx), opacity: ctx.theme === 'accent' ? 0.35 : 1 });
  const slot = makeShape('rect', { name: 'Espaço para foto (capa)', role: 'photoSlot', x: 0, y: 0, width: CANVAS.width, height: CANVAS.height, fill: t.bg, opacity: 0 });
  const scrim = makeShape('scrim', { name: 'Degradê', role: 'decor', x: 0, y: 420, width: CANVAS.width, height: CANVAS.height - 420, fill: t.bg, opacity: 0.96 });
  const eyebrow = c.eyebrow ? smallcaps(c.eyebrow, t.accent, { name: 'Eyebrow', role: 'eyebrow', bind: 'eyebrow', fontSize: 24 }) : null;
  const headline = mega(c.headline ?? '', 'headline', t, { max: 200, min: 80, maxHeight: 640 });
  const sub = c.body ? body(c.body, 'body', t, { name: 'Subheadline', width: 760 }) : null;
  const extra = extraBlock(c, uses, t);
  const { els } = stack([eyebrow, eyebrow && 28, headline, sub && 36, sub, extra && 24, extra], 0);
  anchorBottom(els, CONTENT_END);
  return [arch, slot, scrim, ...frame(ctx, { logoFooter: true }), ...els];
};

const text: Builder = (c, ctx, uses) => {
  const t = THEMES[ctx.theme];
  const long = (c.body ?? '').length > 260;
  const eyebrow = c.eyebrow ? smallcaps(c.eyebrow, t.accent, { name: 'Eyebrow', role: 'eyebrow', bind: 'eyebrow', fontSize: 22 }) : null;
  const headline = mega(c.headline ?? '', 'headline', t, { max: 150, min: 60, maxHeight: c.body ? (long ? 430 : 560) : 820 });
  const top = stack([eyebrow, eyebrow && 24, headline], CONTENT_TOP);
  const bottom: CarouselElement[] = [];
  if (c.body) {
    const x = long ? M : 460;
    const w = long ? CONTENT_WIDTH : CANVAS.width - M - 460;
    const rule = makeShape('rect', { name: 'Régua de destaque', role: 'decor', x, width: 56, height: 6, fill: t.accent });
    const b = body(c.body, 'body', t, { x, width: w, fontSize: long ? 28 : 32 });
    const s = stack([rule, 28, b], 0);
    anchorBottom(s.els, CONTENT_END);
    bottom.push(...s.els);
  }
  const extra = extraBlock(c, uses, t);
  if (extra) {
    extra.y = top.bottom + 32;
    bottom.push(extra);
  }
  return [...frame(ctx), ...top.els, ...bottom];
};

const data: Builder = (c, ctx, uses) => {
  const t = THEMES[ctx.theme];
  const num = c.number ?? '—';
  const eyebrow = c.eyebrow ? smallcaps(c.eyebrow, t.accent, { name: 'Eyebrow', role: 'eyebrow', bind: 'eyebrow' }) : null;
  const number = mega(num, 'number', t, { max: 460, min: 140, maxLines: 1 }, { name: 'Número', role: 'number', color: t.accent, highlightColor: t.text, lineHeight: 0.86 });
  const context = c.headline
    ? mega(c.headline, 'headline', t, { max: 68, min: 34, maxHeight: 330 }, { name: 'Contexto', letterSpacing: -0.02, lineHeight: 1.02 })
    : null;
  const b = c.body ? body(c.body, 'body', t, { width: 820, fontSize: 28 }) : null;
  const extra = extraBlock(c, uses, t);
  const { els } = stack([eyebrow, eyebrow && 16, number, 36, context, b && 28, b, extra && 24, extra], 0);
  centerIn(els, CONTENT_TOP, c.source ? CONTENT_END - 60 : CONTENT_END, 0.42);
  const src: CarouselElement[] = [];
  if (c.source) {
    const label = smallcaps('Fonte', t.accent, { x: M, width: 120 });
    const value = bindText('source', c.source, { name: 'Fonte', role: 'source', style: 'caption', fontSize: 20, fontWeight: 500, color: t.text, opacity: 0.7, x: M + 100, width: CONTENT_WIDTH - 100 });
    value.y = CONTENT_END - value.height + 10;
    label.y = value.y;
    src.push(label, value);
  }
  return [...frame(ctx), ...els, ...src];
};

const list: Builder = (c, ctx, uses) => {
  const t = THEMES[ctx.theme];
  const items = c.items ?? [];
  const top: Array<CarouselElement | number | null> = [];
  if (c.eyebrow || c.number) top.push(smallcaps(c.number ?? c.eyebrow ?? '', t.accent, { name: 'Eyebrow', role: 'eyebrow', bind: c.number ? 'number' : 'eyebrow', fontSize: 22 }), 24);
  if (c.headline) top.push(mega(c.headline, 'headline', t, { max: 120, min: 52, maxHeight: 330 }), 48);
  const head = stack(top, CONTENT_TOP);
  const available = CONTENT_END - head.bottom - (c.body ? 110 : 0);
  let fontSize = 42;
  let rows: CarouselElement[] = [];
  for (; fontSize >= 22; fontSize -= 2) {
    rows = [];
    let y = head.bottom;
    const pad = Math.round(fontSize * 0.62);
    items.forEach((it, i) => {
      rows.push(makeShape('rect', { name: `Divisor ${i + 1}`, role: 'decor', x: M, y, width: CONTENT_WIDTH, height: 2, fill: t.text, opacity: 0.22 }));
      rows.push(makeText(pad2(i + 1), { name: `Índice ${i + 1}`, role: 'decor', style: 'display', fontSize: Math.round(fontSize * 1.05), fontWeight: 700, lineHeight: 1, letterSpacing: -0.03, color: t.accent, x: M, y: y + pad, width: 110 }));
      const txt = bindText('items', it, { name: `Item ${i + 1}`, role: 'item', bindIndex: i, style: 'body', fontSize, fontWeight: 600, lineHeight: 1.18, letterSpacing: -0.01, color: t.text, highlightColor: t.accent, x: M + 120, y: y + pad, width: CONTENT_WIDTH - 120 });
      rows.push(txt);
      y += txt.height + pad * 2;
    });
    if (y - head.bottom <= available) break;
  }
  const tail: CarouselElement[] = [];
  const lastY = rows.length ? Math.max(...rows.map((r) => r.y + r.height)) + Math.round(fontSize * 0.62) : head.bottom;
  if (c.body) tail.push(body(c.body, 'body', t, { y: lastY + 32, fontSize: 28 }));
  const extra = extraBlock(c, uses, t);
  if (extra) {
    extra.y = (tail[0] ? tail[0].y + tail[0].height : lastY) + 24;
    tail.push(extra);
  }
  const block = [...head.els, ...rows, ...tail];
  centerIn(block, CONTENT_TOP, CONTENT_END, 0.25);
  return [...frame(ctx), ...block];
};

const quote: Builder = (c, ctx) => {
  const t = THEMES[ctx.theme];
  const key: ContentKey = c.quote ? 'quote' : 'headline';
  const q = c.quote ?? c.headline ?? '';
  const marks = makeText('“', { name: 'Aspas', role: 'decor', fontSize: 300, fontWeight: 700, lineHeight: 0.62, letterSpacing: 0, color: t.accent, width: 220 });
  const phrase = mega(q, key, t, { max: 116, min: 46, maxHeight: 640 }, { name: 'Citação', role: 'quote', lineHeight: 1 });
  const rule = c.author || c.source ? makeShape('rect', { name: 'Régua', role: 'decor', x: M, width: 56, height: 6, fill: t.accent }) : null;
  const author = c.author ? smallcaps(c.author, t.text, { name: 'Autor', role: 'author', bind: 'author', fontSize: 24 }) : null;
  const source = c.source ? smallcaps(c.source, t.text, { name: 'Fonte', role: 'source', bind: 'source', opacity: 0.6, uppercase: false, letterSpacing: 0.02 }) : null;
  const extra = extraBlock(c, key === 'headline' ? ['headline', 'author', 'source'] : ['quote', 'author', 'source'], t);
  const { els } = stack([marks, 24, phrase, rule && 48, rule, rule && 24, author, source && 10, source, extra && 28, extra], 0);
  centerIn(els, CONTENT_TOP, CONTENT_END, 0.4);
  return [...frame(ctx), ...els];
};

const comparison: Builder = (c, ctx, uses) => {
  const t = THEMES[ctx.theme];
  const head = stack(
    [
      c.eyebrow ? smallcaps(c.eyebrow, t.accent, { name: 'Eyebrow', role: 'eyebrow', bind: 'eyebrow' }) : null,
      c.eyebrow ? 24 : null,
      c.headline ? mega(c.headline, 'headline', t, { max: 110, min: 50, maxHeight: 300 }) : null,
    ],
    CONTENT_TOP,
  );
  const colTop = (c.headline || c.eyebrow ? head.bottom : CONTENT_TOP) + 64;
  const colW = (CONTENT_WIDTH - 80) / 2;
  const leftText = c.leftBody ?? (c.body && !c.rightBody ? c.body : '');
  const rightText = c.rightBody ?? '';
  const maxH = CONTENT_END - colTop - 70;
  const size = Math.min(
    fitted(leftText || ' ', 'body', colW, { max: 46, min: 24, maxHeight: maxH }, 600),
    fitted(rightText || ' ', 'body', colW, { max: 46, min: 24, maxHeight: maxH }, 600),
  );
  const col = (side: 'left' | 'right') => {
    const x = side === 'left' ? M : M + colW + 80;
    const strong = side === 'right';
    const label = smallcaps((side === 'left' ? c.leftTitle : c.rightTitle) ?? (side === 'left' ? 'Antes' : 'Depois'), strong ? t.accent : t.text, {
      name: side === 'left' ? 'Título A' : 'Título B',
      role: 'cardTitle',
      bind: side === 'left' ? 'leftTitle' : 'rightTitle',
      fontSize: 22,
      opacity: strong ? 1 : 0.6,
      x,
      y: colTop,
      width: colW,
    });
    const txt = makeText(side === 'left' ? leftText : rightText, {
      name: side === 'left' ? 'Texto A' : 'Texto B',
      role: 'cardBody',
      bind: side === 'left' ? (c.leftBody !== undefined ? 'leftBody' : 'body') : 'rightBody',
      style: 'body',
      fontSize: size,
      fontWeight: 600,
      lineHeight: 1.12,
      letterSpacing: -0.015,
      color: t.text,
      opacity: strong ? 1 : 0.5,
      highlightColor: t.accent,
      x,
      y: colTop + 56,
      width: colW,
    });
    return [label, txt];
  };
  const left = col('left');
  const right = col('right');
  const colBottom = Math.max(left[1].y + left[1].height, right[1].y + right[1].height);
  const divider = makeShape('rect', { name: 'Divisor vertical', role: 'decor', x: M + colW + 39, y: colTop, width: 2, height: colBottom - colTop, fill: t.text, opacity: 0.22 });
  const extra = extraBlock(c, [...uses, ...(c.leftBody === undefined && c.body ? (['body'] as ContentKey[]) : [])], t);
  const block = [...head.els, ...left, divider, ...right];
  if (extra) {
    extra.y = colBottom + 32;
    block.push(extra);
  }
  centerIn(block, CONTENT_TOP, CONTENT_END, 0.3);
  return [...frame(ctx), ...block];
};

const cta: Builder = (c, ctx, uses) => {
  const t = THEMES[ctx.theme];
  const eyebrow = c.eyebrow ? smallcaps(c.eyebrow, t.accent, { name: 'Eyebrow', role: 'eyebrow', bind: 'eyebrow' }) : null;
  const headline = mega(c.headline ?? '', 'headline', t, { max: 150, min: 60, maxHeight: 520 });
  const b = c.body ? body(c.body, 'body', t, { width: 820 }) : null;
  const bar = c.cta ? ctaBar(c.cta, t, ctx) : null;
  const handle = c.handle ? smallcaps(c.handle, t.text, { name: '@ / URL', role: 'handle', bind: 'handle', fontSize: 24, uppercase: false, letterSpacing: 0.02 }) : null;
  const extra = extraBlock(c, uses, t);
  const { els } = stack([eyebrow, eyebrow && 24, headline, b && 36, b, bar && 56, bar?.bar, handle && 28, handle, extra && 24, extra], 0);
  centerIn(els, CONTENT_TOP, CONTENT_END, 0.5);
  if (bar) bar.place(bar.bar.y);
  const arch = makeShape('arch', { name: 'Arco (massa)', role: 'decor', x: 640, y: 1010, width: 520, height: 700, fill: tone(ctx), opacity: ctx.theme === 'accent' ? 0.35 : 1 });
  return [arch, ...frame(ctx, { footer: false }), ...els, ...(bar ? [bar.label, bar.arrow] : [])];
};

const news: Builder = (c, ctx, uses) => {
  const t = THEMES[ctx.theme];
  const tagText = c.tag ?? 'Notícia';
  const tagLabel = smallcaps(tagText, tok('light'), { name: 'Tag notícia', role: 'tag', bind: 'tag', fontSize: 22, width: 400 });
  const tagW = Math.ceil(tagText.length * 22 * 0.78 + 44);
  const tagBox = makeShape('rect', { name: 'Fundo da tag', role: 'tag', x: M, y: CONTENT_TOP, width: tagW, height: 48, fill: tok('secondary') });
  tagLabel.x = M + 22;
  tagLabel.y = CONTENT_TOP + (48 - tagLabel.height) / 2;
  const meta = [c.date, c.source].filter(Boolean).join('  ·  ');
  const metaEl = meta
    ? smallcaps(meta, t.text, { name: 'Data / fonte', role: 'meta', bind: c.date && !c.source ? 'date' : c.source && !c.date ? 'source' : undefined, align: 'right', x: M + tagW + 24, y: CONTENT_TOP + 14, width: CONTENT_WIDTH - tagW - 24, opacity: 0.7, uppercase: false, letterSpacing: 0.02 })
    : null;
  const headline = mega(c.headline ?? '', 'headline', t, { max: 132, min: 54, maxHeight: c.body ? 520 : 760 });
  const b = c.body ? body(c.body, 'body', t, { x: M + 36, width: CONTENT_WIDTH - 36, fontSize: 28 }) : null;
  const s = stack([headline, b && 48, b], CONTENT_TOP + 48 + 56);
  const bar = b ? makeShape('rect', { name: 'Barra editorial', role: 'decor', x: M, y: b.y, width: 6, height: b.height, fill: t.accent }) : null;
  const extra = extraBlock(c, uses, t);
  if (extra) extra.y = s.bottom + 28;
  return [...frame(ctx), tagBox, tagLabel, ...(metaEl ? [metaEl] : []), ...s.els, ...(bar ? [bar] : []), ...(extra ? [extra] : [])];
};

const story: Builder = (c, ctx, uses) => {
  const t = THEMES[ctx.theme];
  const photo = makeShape('rect', { name: 'Espaço para foto', role: 'photoSlot', x: 0, y: 0, width: CANVAS.width, height: 760, fill: tone(ctx), opacity: ctx.theme === 'accent' ? 0.35 : 1 });
  const scrim = makeShape('scrim', { name: 'Degradê', role: 'decor', x: 0, y: 460, width: CANVAS.width, height: 302, fill: t.bg });
  const name = c.name ? smallcaps(c.name, t.accent, { name: 'Nome', role: 'name', bind: 'name', fontSize: 24 }) : null;
  const headline = mega(c.headline ?? '', 'headline', t, { max: 112, min: 46, maxHeight: 290 });
  const b = c.body ? body(c.body, 'body', t, { width: 880, fontSize: 28 }) : null;
  const extra = extraBlock(c, uses, t);
  const { els } = stack([name, name && 20, headline, b && 28, b, extra && 20, extra], 0);
  anchorBottom(els, CONTENT_END);
  return [photo, scrim, ...frame(ctx), ...els];
};

const closing: Builder = (c, ctx, uses) => {
  const t = THEMES[ctx.theme];
  const arch = makeShape('arch', { name: 'Arco (massa)', role: 'decor', x: 190, y: 560, width: 700, height: 1000, fill: tone(ctx), opacity: ctx.theme === 'accent' ? 0.35 : 1 });
  const headline = mega(c.headline ?? '', 'headline', t, { max: 150, min: 60, maxHeight: 520 }, { align: 'center' });
  const b = c.body ? body(c.body, 'body', t, { align: 'center', x: 130, width: 820 }) : null;
  const bar = c.cta ? ctaBar(c.cta, t, ctx) : null;
  const handle = c.handle ? smallcaps(c.handle, t.text, { name: '@ / URL', role: 'handle', bind: 'handle', fontSize: 24, align: 'center', x: M, width: CONTENT_WIDTH, uppercase: false, letterSpacing: 0.02 }) : null;
  const extra = extraBlock(c, uses, t);
  if (extra) extra.align = 'center';
  const { els } = stack([headline, b && 32, b, bar && 56, bar?.bar, handle && 28, handle, extra && 24, extra], 0);
  centerIn(els, CONTENT_TOP, 1060, 0.45);
  if (bar) bar.place(bar.bar.y);
  const logo = makeLogo(ctx.theme === 'light' ? 'horizontal' : 'horizontalNegative', { role: 'logo', width: 260 });
  logo.height = logoHeightFor(logo.variant, 260);
  logo.x = (CANVAS.width - logo.width) / 2;
  logo.y = BOTTOM - logo.height;
  return [arch, ...frame(ctx, { footer: false }), ...els, ...(bar ? [bar.label, bar.arrow] : []), logo];
};

export const MOVEMENT_BUILDERS: Record<TemplateId, Builder> = {
  cover,
  text,
  data,
  list,
  quote,
  comparison,
  cta,
  news,
  story,
  closing,
};
