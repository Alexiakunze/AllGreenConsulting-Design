import {
  CONTENT_WIDTH,
  LAYOUT,
  TYPE_SCALE,
  tok,
  type ColorToken,
  type TypeStyle,
} from '../design-system/designTokens';
import type {
  ContentKey,
  ImageElement,
  LogoElement,
  LogoVariant,
  ShapeElement,
  ShapeKind,
  TagElement,
  TextElement,
} from '../types/carouselTypes';
import { uid } from '../utils/id';
import { layoutText } from '../utils/textLayout';

type TextOpts = Partial<Omit<TextElement, 'type' | 'id'>> & { style?: TypeStyle };

/** Creates a text element in the brand's typographic hierarchy and computes its height */
export function makeText(text: string, opts: TextOpts = {}): TextElement {
  const style = TYPE_SCALE[opts.style ?? 'body'];
  const el: TextElement = {
    id: uid('txt'),
    type: 'text',
    name: opts.name ?? 'Texto',
    x: LAYOUT.safeMargin,
    y: LAYOUT.safeMargin,
    width: CONTENT_WIDTH,
    height: 0,
    rotation: 0,
    opacity: 1,
    text,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    align: 'left',
    color: tok('text'),
    highlightColor: tok('secondary'),
    templateOwned: true,
    ...opts,
  };
  delete (el as TextOpts).style;
  el.height = measureTextElement(el);
  return el;
}

export function measureTextElement(el: Pick<TextElement, 'text' | 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing' | 'width' | 'align' | 'uppercase' | 'padding'>) {
  const pad = el.padding ?? 0;
  const r = layoutText({
    text: el.text,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing,
    width: Math.max(10, el.width - pad * 2),
    align: el.align,
    uppercase: el.uppercase,
  });
  return Math.ceil(r.height + pad * 2);
}

export function makeShape(shape: ShapeKind, opts: Partial<Omit<ShapeElement, 'type' | 'id' | 'shape'>> = {}): ShapeElement {
  return {
    id: uid('shp'),
    type: 'shape',
    shape,
    name: opts.name ?? shapeName(shape),
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 1,
    fill: tok('secondary'),
    stroke: 'transparent',
    strokeWidth: 0,
    cornerRadius: 0,
    templateOwned: true,
    ...opts,
  };
}

function shapeName(s: ShapeKind) {
  return (
    {
      rect: 'Retângulo',
      ellipse: 'Círculo',
      line: 'Linha',
      arrow: 'Seta',
      arch: 'Arco All Green',
      archOutline: 'Arco (contorno)',
    } as const
  )[s];
}

export function makeTag(text: string, opts: Partial<Omit<TagElement, 'type' | 'id'>> = {}): TagElement {
  const fontSize = opts.fontSize ?? 22;
  const paddingX = opts.paddingX ?? 22;
  const fontWeight = opts.fontWeight ?? 600;
  const letterSpacing = opts.letterSpacing ?? 0.12;
  const uppercase = opts.uppercase ?? true;
  const w = layoutText({
    text: uppercase ? text.toUpperCase() : text,
    fontSize,
    fontWeight,
    lineHeight: 1,
    letterSpacing,
    width: 5000,
    align: 'left',
  }).maxLineWidth;
  return {
    id: uid('tag'),
    type: 'tag',
    name: opts.name ?? 'Etiqueta',
    x: LAYOUT.safeMargin,
    y: LAYOUT.safeMargin,
    width: Math.ceil(w + paddingX * 2),
    height: Math.round(fontSize * 2.1),
    rotation: 0,
    opacity: 1,
    text,
    fill: 'transparent',
    stroke: tok('secondary'),
    strokeWidth: 2,
    color: tok('secondary'),
    fontSize,
    fontWeight,
    letterSpacing,
    cornerRadius: 999,
    paddingX,
    uppercase,
    templateOwned: true,
    ...opts,
  };
}

/** Recomputes a tag's width after its text changes */
export function fitTagWidth(tag: TagElement): number {
  const w = layoutText({
    text: tag.uppercase ? tag.text.toUpperCase() : tag.text,
    fontSize: tag.fontSize,
    fontWeight: tag.fontWeight,
    lineHeight: 1,
    letterSpacing: tag.letterSpacing,
    width: 5000,
    align: 'left',
  }).maxLineWidth;
  return Math.ceil(w + tag.paddingX * 2);
}

export function makeLogo(variant: LogoVariant, opts: Partial<Omit<LogoElement, 'type' | 'id'>> = {}): LogoElement {
  return {
    id: uid('logo'),
    type: 'logo',
    name: 'Logo All Green',
    variant,
    x: LAYOUT.safeMargin,
    y: LAYOUT.safeMargin,
    width: 260,
    height: logoHeightFor(variant, 260),
    rotation: 0,
    opacity: 1,
    templateOwned: true,
    ...opts,
  };
}

/** Official proportions (from the @2x PNG files) */
export const LOGO_RATIOS: Record<LogoVariant, number> = {
  horizontal: 1000 / 216,
  horizontalNegative: 1000 / 216,
  compact: 1000 / 186,
  compactNegative: 1000 / 186,
  symbol: 1,
  symbolNegative: 1,
};

export const logoHeightFor = (v: LogoVariant, width: number) => Math.round(width / LOGO_RATIOS[v]);

export function makeImage(assetId: string, opts: Partial<Omit<ImageElement, 'type' | 'id'>> = {}): ImageElement {
  return {
    id: uid('img'),
    type: 'image',
    name: 'Imagem',
    assetId,
    x: LAYOUT.safeMargin,
    y: LAYOUT.safeMargin,
    width: 600,
    height: 600,
    rotation: 0,
    opacity: 1,
    mask: 'rect',
    cornerRadius: 0,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    treatment: 'none',
    stroke: 'transparent',
    strokeWidth: 0,
    ...opts,
  };
}

export const bindText = (bind: ContentKey, text: string, opts: TextOpts = {}) => makeText(text, { ...opts, bind });

export const colorTok = (k: ColorToken) => tok(k);
