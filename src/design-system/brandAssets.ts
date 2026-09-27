import type { LogoVariant } from '../types/carouselTypes';

/**
 * Official brand files.
 * Copy the PNGs from the Drive folder "Identidade Visual › PNG" into /public/brand
 * (you can keep the original names). The app picks them up automatically;
 * otherwise, use "Identidade Visual › Logos" in the app to upload them.
 */
export const LOGO_CANDIDATES: Record<LogoVariant, string[]> = {
  horizontal: ['[agc] logo-horizontal-verde@2x.png', 'logo-horizontal-verde.png'],
  horizontalNegative: [
    '[agc] logo-horizontal-colorida-branca@2x.png',
    'logo-horizontal-colorida-branca.png',
    '[agc] logo-horizontal-branca@2x.png',
    'logo-horizontal-branca.png',
  ],
  compact: ['[agc] logo-resumida-verde@2x.png', 'logo-resumida-verde.png'],
  compactNegative: ['[agc] logo-resumida-branca@2x.png', 'logo-resumida-branca.png'],
  symbol: ['[agc] simbolo-verde@2x.png', 'simbolo-verde.png', '[agc] simbolo-colorido@2x.png', 'simbolo-colorido.png'],
  symbolNegative: ['[agc] simbolo-branco-1@2x.png', 'simbolo-branco.png', '[agc] simbolo-branco@2x.png'],
};

export const LOGO_LABELS: Record<LogoVariant, string> = {
  horizontal: 'Logo principal (verde)',
  horizontalNegative: 'Logo negativo (colorida/branca)',
  compact: 'Logo resumida (verde)',
  compactNegative: 'Logo resumida (branca)',
  symbol: 'Símbolo (cor)',
  symbolNegative: 'Símbolo (branco)',
};

export const LOGO_VARIANTS = Object.keys(LOGO_CANDIDATES) as LogoVariant[];

export const brandFileUrl = (file: string) => `${import.meta.env.BASE_URL}brand/${encodeURIComponent(file)}`;
