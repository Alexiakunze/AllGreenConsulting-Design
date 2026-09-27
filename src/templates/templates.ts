import { CANVAS, CONTENT_WIDTH, LAYOUT, TYPE_SCALE, tok, type ColorToken } from '../design-system/designTokens';
import type {
  CarouselElement,
  CarouselSettings,
  ContentKey,
  ImageElement,
  Slide,
  SlideContent,
  SlideTheme,
  TemplateId,
  TextElement,
} from '../types/carouselTypes';
import { pad2 } from '../utils/id';
import { fitFontSize } from '../utils/textLayout';
import { bindText, logoHeightFor, makeLogo, makeShape, makeTag, makeText } from './elementFactory';

/**
 * ALL GREEN TEMPLATE SYSTEM
 *
 * Each template is a function (content, context) → elements.
 * Shared rules that create brand recognition:
 *  - 80px safe margin and a single left axis (x = 80)
 *  - Editorial header: section (left) + counter "03 / 08" (right)
 *  - Footer: handle + swipe arrow
 *  - The ARCH (from the logo symbol) as the only graphic motif
 *  - Orange used sparingly: highlight, number, arch
 *  - Tight Space Grotesk headlines (negative tracking), airy body text
 */

export interface TemplateContext {
  index: number;
  total: number;
  theme: SlideTheme;
  settings: CarouselSettings;
}

interface ThemeColors {
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

const M = LAYOUT.safeMargin;
const BOTTOM = CANVAS.height - M; // 1270
const CONTENT_BOTTOM = 1170; // above the footer

// ────────────────────────────────────────────── helpers

function chrome(ctx: TemplateContext, opts: { header?: boolean; footer?: boolean; arrow?: boolean; counter?: boolean } = {}) {
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
function stack(items: Array<CarouselElement | number | null | undefined | false>, startY: number) {
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
function centerIn(els: CarouselElement[], top: number, bottom: number, bias = 0.45) {
  if (!els.length) return els;
  const minY = Math.min(...els.map((e) => e.y));
  const maxY = Math.max(...els.map((e) => e.y + e.height));
  const h = maxY - minY;
  const target = Math.max(top, top + (bottom - top - h) * bias);
  const dy = target - minY;
  els.forEach((e) => (e.y = Math.round(e.y + dy)));
  return els;
}

function anchorBottom(els: CarouselElement[], bottom: number) {
  if (!els.length) return els;
  const maxY = Math.max(...els.map((e) => e.y + e.height));
  const dy = bottom - maxY;
  els.forEach((e) => (e.y = Math.round(e.y + dy)));
  return els;
}

function fitted(
  text: string,
  style: keyof typeof TYPE_SCALE,
  width: number,
  limits: { max?: number; min: number; maxHeight?: number; maxLines?: number },
  weight?: number,
) {
  const s = TYPE_SCALE[style];
  return fitFontSize(
    { text, fontWeight: weight ?? s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, width, align: 'left' },
    limits.max ?? s.fontSize,
    limits.min,
    { maxHeight: limits.maxHeight, maxLines: limits.maxLines, singleLineWidth: true },
  );
}

/** Fields the template does not show → an extra block so no content is lost */
function leftovers(c: SlideContent, uses: ContentKey[]): string {
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

function extraBlock(c: SlideContent, uses: ContentKey[], t: ThemeColors, width = CONTENT_WIDTH) {
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

const accentRule = (t: ThemeColors, w = 72, h = 8) =>
  makeShape('rect', { name: 'Régua de destaque', role: 'decor', x: M, width: w, height: h, fill: t.accent });

const eyebrowText = (text: string, t: ThemeColors) =>
  bindText('eyebrow', text, {
    name: 'Eyebrow',
    role: 'eyebrow',
    style: 'eyebrow',
    uppercase: true,
    color: t.accent,
  });

// ────────────────────────────────────────────── templates

const cover: TemplateDef = {
  id: 'cover',
  number: '01',
  name: 'Capa',
  description: 'Headline grande, eyebrow, arco All Green e logo.',
  defaultTheme: 'dark',
  uses: ['eyebrow', 'headline', 'body'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const arch = makeShape('arch', {
      name: 'Arco All Green',
      role: 'photoSlot',
      x: 640,
      y: 170,
      width: 360,
      height: 420,
      fill: t.accent,
    });
    const headlineText = c.headline ?? '';
    const size = fitted(headlineText, 'display', CONTENT_WIDTH, { max: 124, min: 68, maxHeight: 470 });
    const headline = bindText('headline', headlineText, {
      name: 'Headline',
      role: 'headline',
      style: 'display',
      fontSize: size,
      color: t.text,
      highlightColor: t.accent,
    });
    const tag = c.eyebrow
      ? makeTag(c.eyebrow, { name: 'Eyebrow', role: 'eyebrow', bind: 'eyebrow', stroke: t.accent, color: t.accent })
      : null;
    const body = c.body
      ? bindText('body', c.body, { name: 'Subheadline', role: 'body', style: 'subheadline', fontSize: 38, color: t.muted, opacity: t.mutedOpacity, width: 820 })
      : null;
    const extra = extraBlock(c, this.uses, t);
    const { els } = stack([tag, tag && 36, headline, body && 36, body, extra && 28, extra], 0);
    anchorBottom(els, 1110);

    // The arch occupies the free space above the text (never overlaps the headline)
    const blockTop = Math.min(...els.map((e) => e.y));
    const archBottom = Math.min(590, blockTop - 56);
    const archH = archBottom - arch.y;
    const archEls: CarouselElement[] = [];
    if (archH >= 150) {
      arch.height = archH;
      arch.width = Math.min(360, Math.round(archH * 0.86));
      arch.x = CANVAS.width - M - arch.width;
      archEls.push(arch);
    }

    const logo = makeLogo(ctx.theme === 'light' ? 'horizontal' : 'horizontalNegative', {
      role: 'logo',
      x: M,
      width: 240,
    });
    logo.height = logoHeightFor(logo.variant, 240);
    logo.y = BOTTOM - logo.height + 6;

    const swipe = makeText('Arraste', {
      name: 'Arraste',
      role: 'chrome',
      style: 'caption',
      uppercase: true,
      letterSpacing: 0.16,
      fontWeight: 600,
      align: 'right',
      color: t.text,
      x: CANVAS.width - M - 72 - 24 - 200,
      width: 200,
    });
    swipe.y = BOTTOM - 26;
    const arrow = makeShape('arrow', {
      name: 'Seta (arraste)',
      role: 'chrome',
      x: CANVAS.width - M - 72,
      y: BOTTOM - 26,
      width: 72,
      height: 26,
      fill: t.text,
      stroke: t.text,
      strokeWidth: 3,
    });

    return [...archEls, ...chrome(ctx, { footer: false }), ...els, logo, ...(ctx.total > 1 ? [swipe, arrow] : [])];
  },
};

const text: TemplateDef = {
  id: 'text',
  number: '02',
  name: 'Texto + Destaque',
  description: 'Headline, texto complementar e *palavra-chave* destacada.',
  defaultTheme: 'light',
  uses: ['eyebrow', 'headline', 'body'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const h = c.headline ?? '';
    const bodyLen = (c.body ?? '').length;
    const size = fitted(h, 'headline', CONTENT_WIDTH, { max: bodyLen > 160 ? 72 : 84, min: 48, maxHeight: bodyLen ? 460 : 720 });
    const eyebrow = c.eyebrow ? eyebrowText(c.eyebrow, t) : null;
    const headline = bindText('headline', h, { name: 'Headline', role: 'headline', style: 'headline', fontSize: size, color: t.text, highlightColor: t.accent });
    const bodySize = bodyLen > 380 ? 30 : 36;
    const body = c.body
      ? bindText('body', c.body, { name: 'Texto', role: 'body', style: 'body', fontSize: bodySize, color: t.text, opacity: 0.86, highlightColor: t.accent, width: 860 })
      : null;
    const extra = extraBlock(c, this.uses, t);
    const { els } = stack([eyebrow, eyebrow && 28, accentRule(t), 44, headline, body && 44, body, extra && 32, extra], 0);
    centerIn(els, 220, CONTENT_BOTTOM);
    return [...chrome(ctx), ...els];
  },
};

const data: TemplateDef = {
  id: 'data',
  number: '03',
  name: 'Dado / Número',
  description: 'Número extremamente grande, contexto e fonte.',
  defaultTheme: 'dark',
  uses: ['eyebrow', 'number', 'headline', 'body', 'source'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const num = c.number ?? '—';
    const numSize = fitted(num, 'number', CONTENT_WIDTH, { max: 320, min: 120, maxLines: 1 });
    const eyebrow = c.eyebrow ? eyebrowText(c.eyebrow, t) : null;
    const number = bindText('number', num, { name: 'Número', role: 'number', style: 'number', fontSize: numSize, color: t.accent, highlightColor: t.text });
    const rule = makeShape('rect', { name: 'Divisor', role: 'decor', x: M, width: CONTENT_WIDTH, height: 2, fill: t.text, opacity: 0.25 });
    const headline = c.headline
      ? bindText('headline', c.headline, {
          name: 'Contexto',
          role: 'headline',
          style: 'subheadline',
          fontSize: fitted(c.headline, 'subheadline', 880, { max: 52, min: 34, maxHeight: 330 }),
          fontWeight: 500,
          color: t.text,
          highlightColor: t.accent,
          width: 880,
        })
      : null;
    const body = c.body ? bindText('body', c.body, { name: 'Texto', role: 'body', style: 'bodySm', color: t.muted, opacity: t.mutedOpacity, width: 820 }) : null;
    const extra = extraBlock(c, this.uses, t);
    const { els } = stack([eyebrow, eyebrow && 20, number, 40, rule, 44, headline, body && 28, body, extra && 28, extra], 0);
    centerIn(els, 200, c.source ? 1040 : CONTENT_BOTTOM, 0.4);
    const src: CarouselElement[] = [];
    if (c.source) {
      const label = makeText('Fonte', { name: 'Rótulo fonte', role: 'decor', style: 'caption', uppercase: true, letterSpacing: 0.16, fontWeight: 600, color: t.accent, x: M, width: 200 });
      const value = bindText('source', c.source, { name: 'Fonte', role: 'source', style: 'caption', fontWeight: 400, color: t.muted, opacity: t.mutedOpacity, x: M + 110, width: CONTENT_WIDTH - 110 });
      value.y = 1150 - value.height + 26;
      label.y = value.y;
      src.push(label, value);
    }
    return [...chrome(ctx), ...els, ...src];
  },
};

const list: TemplateDef = {
  id: 'list',
  number: '04',
  name: 'Lista',
  description: 'Número, título e lista numerada com divisores.',
  defaultTheme: 'light',
  uses: ['eyebrow', 'number', 'headline', 'items', 'body'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const items = c.items?.length ? c.items : [];
    const top: Array<CarouselElement | number | null> = [];
    if (c.number) {
      top.push(bindText('number', c.number, { name: 'Número', role: 'number', style: 'numberSm', color: t.accent }), 16);
    } else if (c.eyebrow) {
      top.push(eyebrowText(c.eyebrow, t), 24);
    }
    if (c.headline) {
      const size = fitted(c.headline, 'headlineSm', CONTENT_WIDTH, { max: 64, min: 42, maxHeight: 250 });
      top.push(bindText('headline', c.headline, { name: 'Título', role: 'headline', style: 'headlineSm', fontSize: size, color: t.text, highlightColor: t.accent }), 48);
    }
    const head = stack(top, 200);

    // Picks the largest item size that fits the available height
    const available = CONTENT_BOTTOM - head.bottom - (c.body ? 120 : 0);
    const textW = CONTENT_WIDTH - 96;
    let fontSize = 40;
    let rows: CarouselElement[] = [];
    for (; fontSize >= 22; fontSize -= 2) {
      rows = [];
      let y = head.bottom;
      const pad = Math.round(fontSize * 0.75);
      items.forEach((it, i) => {
        const rule = makeShape('rect', { name: `Divisor ${i + 1}`, role: 'decor', x: M, y, width: CONTENT_WIDTH, height: 2, fill: t.text, opacity: 0.16 });
        const idx = makeText(pad2(i + 1), { name: `Índice ${i + 1}`, role: 'decor', style: 'caption', fontSize: Math.round(fontSize * 0.8), fontWeight: 700, color: t.accent, x: M, y: y + pad + 4, width: 80 });
        const txt = bindText('items', it, { name: `Item ${i + 1}`, role: 'item', bindIndex: i, style: 'body', fontSize, lineHeight: 1.3, fontWeight: 500, color: t.text, highlightColor: t.accent, x: M + 96, y: y + pad, width: textW });
        rows.push(rule, idx, txt);
        y += txt.height + pad * 2;
      });
      if (y - head.bottom <= available) break;
    }
    const tail: CarouselElement[] = [];
    const lastY = rows.length ? Math.max(...rows.map((r) => r.y + r.height)) + Math.round(fontSize * 0.75) : head.bottom;
    if (c.body) {
      const body = bindText('body', c.body, { name: 'Texto', role: 'body', style: 'bodySm', color: t.text, opacity: 0.75, y: lastY + 32 });
      tail.push(body);
    }
    const extra = extraBlock(c, this.uses, t);
    if (extra) {
      extra.y = (tail.length ? tail[0].y + tail[0].height : lastY) + 24;
      tail.push(extra);
    }
    const block = [...head.els, ...rows, ...tail];
    centerIn(block, 200, CONTENT_BOTTOM, 0.4);
    return [...chrome(ctx), ...block];
  },
};

const quote: TemplateDef = {
  id: 'quote',
  number: '05',
  name: 'Quote',
  description: 'Aspas, frase principal e autor/fonte.',
  defaultTheme: 'dark',
  uses: ['quote', 'author', 'source'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const key: ContentKey = c.quote ? 'quote' : 'headline';
    const q = c.quote ?? c.headline ?? '';
    const marks = makeText('“', { name: 'Aspas', role: 'decor', fontSize: 260, fontWeight: 700, lineHeight: 0.8, letterSpacing: 0, color: t.accent, width: 200 });
    const size = fitted(q, 'headlineSm', CONTENT_WIDTH, { max: 66, min: 38, maxHeight: 560 }, 500);
    const phrase = bindText(key, q, { name: 'Citação', role: 'quote', style: 'headlineSm', fontSize: size, fontWeight: 500, color: t.text, highlightColor: t.accent });
    const rule = c.author || c.source ? accentRule(t, 48, 4) : null;
    const author = c.author
      ? bindText('author', c.author, { name: 'Autor', role: 'author', style: 'eyebrow', fontSize: 24, uppercase: true, color: t.text })
      : null;
    const source = c.source ? bindText('source', c.source, { name: 'Fonte', role: 'source', style: 'caption', color: t.muted, opacity: t.mutedOpacity }) : null;
    const uses: ContentKey[] = key === 'headline' ? ['headline', 'author', 'source'] : this.uses;
    const extra = extraBlock(c, uses, t);
    const { els } = stack([marks, 8, phrase, rule && 48, rule, rule && 24, author, source && 10, source, extra && 32, extra], 0);
    centerIn(els, 200, CONTENT_BOTTOM, 0.42);
    return [...chrome(ctx), ...els];
  },
};

const comparison: TemplateDef = {
  id: 'comparison',
  number: '06',
  name: 'Comparação',
  description: 'Dois blocos (antes/depois, A/B) com hierarquia clara.',
  defaultTheme: 'light',
  uses: ['eyebrow', 'headline', 'leftTitle', 'leftBody', 'rightTitle', 'rightBody'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const top: Array<CarouselElement | number | null> = [];
    if (c.eyebrow) top.push(eyebrowText(c.eyebrow, t), 24);
    if (c.headline) {
      const size = fitted(c.headline, 'headlineSm', CONTENT_WIDTH, { max: 64, min: 40, maxHeight: 260 });
      top.push(bindText('headline', c.headline, { name: 'Headline', role: 'headline', style: 'headlineSm', fontSize: size, color: t.text, highlightColor: t.accent }));
    }
    const head = stack(top, 200);
    const cardTop = (top.length ? head.bottom : 170) + 56;
    const gap = LAYOUT.gutter;
    const cardW = (CONTENT_WIDTH - gap) / 2;
    const maxCardH = CONTENT_BOTTOM - cardTop;
    const inner = cardW - 80;

    const leftText = c.leftBody ?? (c.body && !c.rightBody ? c.body : '');
    const rightText = c.rightBody ?? '';
    const fitSide = (s: string) => fitted(s || ' ', 'body', inner, { max: 40, min: 22, maxHeight: maxCardH - 160 }, 500);
    const bodySize = Math.min(fitSide(leftText), fitSide(rightText));
    const sideH = (s: string) => makeText(s || ' ', { style: 'body', fontSize: bodySize, fontWeight: 500, width: inner }).height;
    const cardH = Math.min(maxCardH, Math.max(420, Math.max(sideH(leftText), sideH(rightText)) + 110 + 64));

    const card = (side: 'left' | 'right') => {
      const x = side === 'left' ? M : M + cardW + gap;
      const emphasized = side === 'right';
      const bg = makeShape('rect', {
        name: side === 'left' ? 'Bloco A' : 'Bloco B',
        role: 'card',
        x,
        y: cardTop,
        width: cardW,
        height: cardH,
        cornerRadius: 24,
        fill: emphasized ? (ctx.theme === 'dark' ? tok('light') : tok('primary')) : t.card,
      });
      const fg = emphasized ? (ctx.theme === 'dark' ? tok('primary') : tok('light')) : t.cardText;
      const title = makeText((side === 'left' ? c.leftTitle : c.rightTitle) ?? (side === 'left' ? 'Antes' : 'Depois'), {
        name: side === 'left' ? 'Título A' : 'Título B',
        role: 'cardTitle',
        bind: side === 'left' ? 'leftTitle' : 'rightTitle',
        style: 'eyebrow',
        uppercase: true,
        color: emphasized ? tok('secondary') : fg,
        opacity: emphasized ? 1 : 0.7,
        x: x + 40,
        y: cardTop + 44,
        width: inner,
      });
      const bodyEl = makeText(side === 'left' ? leftText : rightText, {
        name: side === 'left' ? 'Texto A' : 'Texto B',
        role: 'cardBody',
        bind: side === 'left' ? (c.leftBody !== undefined ? 'leftBody' : 'body') : 'rightBody',
        style: 'body',
        fontSize: bodySize,
        fontWeight: emphasized ? 500 : 400,
        color: fg,
        highlightColor: tok('secondary'),
        x: x + 40,
        y: cardTop + 110,
        width: inner,
      });
      return [bg, title, bodyEl];
    };
    const usesHere: ContentKey[] = [...this.uses, ...(c.leftBody === undefined && c.body ? (['body'] as ContentKey[]) : [])];
    const extra = extraBlock(c, usesHere, t);
    const block = [...head.els, ...card('left'), ...card('right')];
    if (extra) {
      extra.y = cardTop + cardH + 32;
      block.push(extra);
    }
    centerIn(block, 200, CONTENT_BOTTOM, 0.42);
    return [...chrome(ctx), ...block];
  },
};

const cta: TemplateDef = {
  id: 'cta',
  number: '07',
  name: 'CTA',
  description: 'Headline, texto curto, botão de ação e @/URL.',
  defaultTheme: 'dark',
  uses: ['eyebrow', 'headline', 'body', 'cta', 'handle'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const eyebrow = c.eyebrow ? eyebrowText(c.eyebrow, t) : null;
    const h = c.headline ?? '';
    const size = fitted(h, 'headline', CONTENT_WIDTH, { max: 92, min: 52, maxHeight: 460 });
    const headline = bindText('headline', h, { name: 'Headline', role: 'headline', style: 'headline', fontSize: size, color: t.text, highlightColor: t.accent });
    const body = c.body ? bindText('body', c.body, { name: 'Texto', role: 'body', style: 'body', color: t.text, opacity: 0.8, width: 820 }) : null;
    const button = c.cta
      ? makeTag(c.cta, {
          name: 'Botão CTA',
          role: 'cta',
          bind: 'cta',
          uppercase: false,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: -0.005,
          paddingX: 48,
          height: 96,
          fill: ctx.theme === 'accent' ? tok('primary') : tok('secondary'),
          stroke: 'transparent',
          strokeWidth: 0,
          color: tok('light'),
        })
      : null;
    const handle = c.handle
      ? bindText('handle', c.handle, { name: '@ / URL', role: 'handle', style: 'caption', fontSize: 26, fontWeight: 500, color: t.text, opacity: 0.8 })
      : null;
    const extra = extraBlock(c, this.uses, t);
    const { els } = stack([eyebrow, eyebrow && 28, headline, body && 36, body, button && 56, button, handle && 28, handle, extra && 24, extra], 0);
    centerIn(els, 200, CONTENT_BOTTOM, 0.5);
    const arch = makeShape('archOutline', { name: 'Arco (contorno)', role: 'decor', x: 760, y: 1010, width: 240, height: 420, fill: 'transparent', stroke: t.accent, strokeWidth: 3, opacity: 0.9 });
    return [arch, ...chrome(ctx, { arrow: false, footer: false }), ...els];
  },
};

const news: TemplateDef = {
  id: 'news',
  number: '08',
  name: 'Notícia',
  description: 'Tag "NOTÍCIA", headline, data/fonte e régua editorial.',
  defaultTheme: 'light',
  uses: ['tag', 'headline', 'body', 'date', 'source'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const tag = makeTag(c.tag ?? 'Notícia', {
      name: 'Tag notícia',
      role: 'tag',
      bind: 'tag',
      fill: tok('secondary'),
      stroke: 'transparent',
      strokeWidth: 0,
      color: tok('light'),
      fontSize: 22,
      x: M,
      y: 200,
    });
    const els: CarouselElement[] = [tag];
    const meta = [c.date, c.source].filter(Boolean).join('  ·  ');
    if (meta) {
      const m = makeText(meta, {
        name: 'Data / fonte',
        role: 'meta',
        bind: c.date && !c.source ? 'date' : c.source && !c.date ? 'source' : undefined,
        style: 'caption',
        fontWeight: 500,
        color: t.text,
        opacity: 0.7,
        x: M + tag.width + 24,
        width: CONTENT_WIDTH - tag.width - 24,
      });
      m.y = tag.y + (tag.height - m.height) / 2;
      els.push(m);
    }
    const rule = makeShape('rect', { name: 'Régua editorial', role: 'decor', x: M, width: CONTENT_WIDTH, height: 6, fill: t.text });
    const h = c.headline ?? '';
    const size = fitted(h, 'headline', CONTENT_WIDTH, { max: 84, min: 48, maxHeight: c.body ? 440 : 700 });
    const headline = bindText('headline', h, { name: 'Headline', role: 'headline', style: 'headline', fontSize: size, color: t.text, highlightColor: t.accent });
    const body = c.body
      ? bindText('body', c.body, { name: 'Texto', role: 'body', style: 'bodySm', color: t.text, opacity: 0.85, x: M + 40, width: CONTENT_WIDTH - 40 })
      : null;
    const s = stack([rule, 48, headline, body && 44, body], tag.y + tag.height + 44);
    const bar = body ? makeShape('rect', { name: 'Barra editorial', role: 'decor', x: M, y: body.y, width: 6, height: body.height, fill: t.accent }) : null;
    const extra = extraBlock(c, [...this.uses], t);
    if (extra) extra.y = s.bottom + 32;
    return [...chrome(ctx), ...els, ...s.els, ...(bar ? [bar] : []), ...(extra ? [extra] : [])];
  },
};

const story: TemplateDef = {
  id: 'story',
  number: '09',
  name: 'História / Case',
  description: 'Nome, headline, texto curto e espaço para fotografia (arco).',
  defaultTheme: 'dark',
  uses: ['name', 'headline', 'body'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const photo = makeShape('arch', {
      name: 'Espaço para foto',
      role: 'photoSlot',
      x: M,
      y: 180,
      width: 440,
      height: 540,
      fill: t.accent,
    });
    const name = c.name ? bindText('name', c.name, { name: 'Nome', role: 'name', style: 'eyebrow', uppercase: true, color: t.accent }) : null;
    const h = c.headline ?? '';
    const size = fitted(h, 'headlineSm', CONTENT_WIDTH, { max: 60, min: 38, maxHeight: 250 });
    const headline = bindText('headline', h, { name: 'Headline', role: 'headline', style: 'headlineSm', fontSize: size, color: t.text, highlightColor: t.accent });
    const body = c.body ? bindText('body', c.body, { name: 'Texto', role: 'body', style: 'bodySm', color: t.muted, opacity: t.mutedOpacity, width: 860 }) : null;
    const extra = extraBlock(c, this.uses, t);
    const { els } = stack([name, name && 20, headline, body && 24, body, extra && 20, extra], 780);
    return [photo, ...chrome(ctx), ...els];
  },
};

const closing: TemplateDef = {
  id: 'closing',
  number: '10',
  name: 'Encerramento',
  description: 'Frase forte, CTA e logo All Green.',
  defaultTheme: 'dark',
  uses: ['headline', 'body', 'cta', 'handle'],
  build(c, ctx) {
    const t = THEMES[ctx.theme];
    const logo = makeLogo(ctx.theme === 'light' ? 'horizontal' : 'horizontalNegative', { role: 'logo', width: 320 });
    logo.height = logoHeightFor(logo.variant, 320);
    logo.x = (CANVAS.width - logo.width) / 2;
    logo.y = 190;
    const h = c.headline ?? '';
    const size = fitted(h, 'headline', CONTENT_WIDTH, { max: 88, min: 50, maxHeight: 420 });
    const headline = bindText('headline', h, { name: 'Frase', role: 'headline', style: 'headline', fontSize: size, align: 'center', color: t.text, highlightColor: t.accent });
    const body = c.body ? bindText('body', c.body, { name: 'Texto', role: 'body', style: 'body', align: 'center', color: t.text, opacity: 0.8, x: 130, width: 820 }) : null;
    const button = c.cta
      ? makeTag(c.cta, {
          name: 'Botão CTA',
          role: 'cta',
          bind: 'cta',
          uppercase: false,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: 0,
          paddingX: 44,
          height: 92,
          fill: ctx.theme === 'accent' ? tok('primary') : tok('secondary'),
          stroke: 'transparent',
          strokeWidth: 0,
          color: tok('light'),
        })
      : null;
    if (button) button.x = (CANVAS.width - button.width) / 2;
    const handle = c.handle
      ? bindText('handle', c.handle, { name: '@ / URL', role: 'handle', style: 'caption', fontSize: 26, fontWeight: 500, align: 'center', color: t.text, opacity: 0.8 })
      : null;
    const extra = extraBlock(c, this.uses, t);
    if (extra) extra.align = 'center';
    const { els } = stack([headline, body && 32, body, button && 56, button, handle && 28, handle, extra && 24, extra], 0);
    centerIn(els, 360, 1040, 0.5);
    const arch = makeShape('archOutline', {
      name: 'Arco (contorno)',
      role: 'decor',
      x: (CANVAS.width - 420) / 2,
      y: 1110,
      width: 420,
      height: 520,
      fill: 'transparent',
      stroke: t.accent,
      strokeWidth: 3,
    });
    return [arch, logo, ...els];
  },
};

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
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

export const TEMPLATE_LIST: TemplateDef[] = Object.values(TEMPLATES);

export const themeBackground = (theme: SlideTheme) => THEMES[theme].bg;

export const THEME_LABELS: Record<SlideTheme, string> = {
  dark: 'Verde',
  light: 'Off-white',
  accent: 'Laranja',
};

/**
 * Applies a template to a slide (without touching the content).
 * - Template-owned elements are regenerated.
 * - Elements added by the user are kept.
 * - The first user photo is placed into the template's photo slot (if any).
 */
export function applyTemplate(slide: Slide, template: TemplateId, ctx: Omit<TemplateContext, 'theme'> & { theme?: SlideTheme }): Slide {
  const theme = ctx.theme ?? slide.theme;
  const def = TEMPLATES[template];
  const generated = def.build(slide.content, { ...ctx, theme });
  const userEls = slide.elements.filter((e) => !e.templateOwned);
  const slotIdx = generated.findIndex((e) => e.role === 'photoSlot');
  const photo = userEls.find((e): e is ImageElement => e.type === 'image' && e.role !== 'free');

  let elements: CarouselElement[];
  if (slotIdx >= 0 && photo) {
    const slot = generated[slotIdx];
    const placed: ImageElement = {
      ...photo,
      x: slot.x,
      y: slot.y,
      width: slot.width,
      height: slot.height,
      rotation: 0,
      mask: 'arch',
      role: 'photo',
    };
    elements = [...generated.slice(0, slotIdx), placed, ...generated.slice(slotIdx + 1), ...userEls.filter((e) => e.id !== photo.id)];
  } else {
    elements = [...generated, ...userEls];
  }
  return { ...slide, template, theme, background: themeBackground(theme), elements };
}

/** Updates the counters ("03 / 08") after slides are reordered/added/removed */
export function refreshCounters(slides: Slide[]): Slide[] {
  return slides.map((s, i) => ({
    ...s,
    elements: s.elements.map((e) => {
      if (e.type === 'text' && e.role === 'counter') {
        return { ...e, text: `${pad2(i + 1)} / ${pad2(slides.length)}` };
      }
      return e;
    }),
  }));
}

export const isTextLike = (e: CarouselElement): e is TextElement => e.type === 'text';

export const THEME_TOKENS: Record<SlideTheme, ColorToken> = { dark: 'primary', light: 'light', accent: 'secondary' };
