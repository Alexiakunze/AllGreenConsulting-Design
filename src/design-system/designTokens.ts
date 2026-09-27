/**
 * All Green Consulting — Design Tokens
 *
 * The single source of truth for the carousels' visual identity.
 * Base colors were extracted from the official logo files
 * (Drive › Identidade Visual › PNG, "[agc] logo-horizontal-*.png"):
 *   - #12403C  deep green (logo on a light background)
 *   - #C04E01  burnt orange (symbol in the colored version)
 *   - #EDEAE6  warm off-white (wordmark in the negative version)
 *   - "CONSULTING" in the negative version = off-white at 40% over the green.
 * Derived colors (dark, sand, muted) are marked as such.
 *
 * NEVER use hex codes outside this file. Elements store
 * references like "token:primary" that are resolved at render time.
 */

export const ALL_GREEN_COLORS = {
  /** Institutional deep green — official logo */
  primary: '#12403C',
  /** Burnt orange — official symbol. Use sparingly: highlights, numbers, arches. */
  secondary: '#C04E01',
  /** Deeper green for backgrounds with more contrast (derived from the primary) */
  dark: '#0C2E2B',
  /** Warm off-white — official background / negative wordmark */
  light: '#EDEAE6',
  /** Pure white for maximum contrast */
  white: '#FFFFFF',
  /** Accent = the symbol's orange (alias used by templates) */
  accent: '#C04E01',
  /** Default text on light backgrounds */
  text: '#12403C',
  /** Secondary text — off-white at 40% over the green (as in "CONSULTING") */
  muted: '#698480',
  /** Warm sand for panels on the light background (derived) */
  sand: '#DCD6CE',
} as const;

export type ColorToken = keyof typeof ALL_GREEN_COLORS;
export type BrandPalette = Record<ColorToken, string>;

export const COLOR_LABELS: Record<ColorToken, string> = {
  primary: 'Verde institucional',
  secondary: 'Laranja (símbolo)',
  dark: 'Verde profundo',
  light: 'Off-white',
  white: 'Branco',
  accent: 'Destaque',
  text: 'Texto',
  muted: 'Texto secundário',
  sand: 'Areia',
};

/** Official canvas: Instagram 4:5 */
export const CANVAS = {
  width: 1080,
  height: 1350,
} as const;

export const FONTS = {
  primary: 'Space Grotesk',
  fallback: 'Helvetica Neue, Arial, sans-serif',
  weights: { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

/** Typographic hierarchy (px at 1080×1350). letterSpacing in em. */
export const TYPE_SCALE = {
  display: { fontSize: 128, fontWeight: 700, lineHeight: 1.0, letterSpacing: -0.035 },
  headline: { fontSize: 88, fontWeight: 600, lineHeight: 1.04, letterSpacing: -0.03 },
  headlineSm: { fontSize: 68, fontWeight: 600, lineHeight: 1.08, letterSpacing: -0.025 },
  subheadline: { fontSize: 44, fontWeight: 500, lineHeight: 1.2, letterSpacing: -0.01 },
  body: { fontSize: 36, fontWeight: 400, lineHeight: 1.38, letterSpacing: 0 },
  bodySm: { fontSize: 30, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0 },
  eyebrow: { fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: 0.14 },
  caption: { fontSize: 22, fontWeight: 500, lineHeight: 1.3, letterSpacing: 0.04 },
  number: { fontSize: 300, fontWeight: 700, lineHeight: 0.9, letterSpacing: -0.05 },
  numberSm: { fontSize: 96, fontWeight: 700, lineHeight: 1, letterSpacing: -0.03 },
} as const;

export type TypeStyle = keyof typeof TYPE_SCALE;

/** 8px spacing scale */
export const SPACING = {
  xxs: 8,
  xs: 16,
  sm: 24,
  md: 40,
  lg: 64,
  xl: 96,
  xxl: 144,
} as const;

/** Safe margin and editorial grid */
export const LAYOUT = {
  safeMargin: 80,
  /** Top area for the editorial header (eyebrow/counter) */
  headerY: 80,
  /** Footer baseline (handle / swipe cue) */
  footerY: 1350 - 80 - 24,
  columns: 6,
  gutter: 24,
  snapThreshold: 8,
} as const;

export const RADIUS = {
  none: 0,
  sm: 8,
  md: 20,
  lg: 40,
  pill: 999,
} as const;

export const SHADOWS = {
  none: { color: '#000000', blur: 0, offsetX: 0, offsetY: 0, opacity: 0 },
  soft: { color: '#000000', blur: 40, offsetX: 0, offsetY: 16, opacity: 0.18 },
  strong: { color: '#000000', blur: 60, offsetX: 0, offsetY: 24, opacity: 0.3 },
} as const;

export const BRAND_INFO = {
  name: 'All Green Consulting',
  handle: '@allgreenconsulting',
  site: 'allgreenconsulting.com',
} as const;

/** Content width inside the margins */
export const CONTENT_WIDTH = CANVAS.width - LAYOUT.safeMargin * 2;

/** Converts an em value into Konva letterSpacing px */
export const emToPx = (em: number, fontSize: number) => Math.round(em * fontSize * 100) / 100;

/** Resolves "token:primary" | "#hex" | "transparent" into a final color */
export function resolveColor(value: string | undefined, palette: BrandPalette): string {
  if (!value) return 'transparent';
  if (value.startsWith('token:')) {
    const key = value.slice(6) as ColorToken;
    return palette[key] ?? ALL_GREEN_COLORS[key] ?? '#000000';
  }
  return value;
}

export const tok = (key: ColorToken) => `token:${key}`;
