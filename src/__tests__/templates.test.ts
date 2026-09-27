import { describe, expect, it } from 'vitest';
import { CANVAS, LAYOUT } from '../design-system/designTokens';
import { applyTemplate, TEMPLATE_LIST } from '../templates/templates';
import { DEFAULT_SETTINGS } from '../editor/store';
import type { Slide } from '../types/carouselTypes';

const content = {
  eyebrow: 'EB-2 NIW',
  headline: 'Você não precisa começar do *zero*',
  body: 'Texto complementar curto.',
  number: '37%',
  items: ['Um', 'Dois', 'Três'],
  quote: 'Imigrar é levar sua trajetória.',
  author: 'All Green',
  cta: 'Agende sua análise',
  handle: '@allgreenconsulting',
};

const base = (): Slide => ({ id: 's1', name: 'S', template: 'text', theme: 'dark', content: { ...content }, background: 'token:primary', elements: [] });

describe.each(['movement', 'editorial'] as const)('templates (%s)', (style) => {
  const settings = { ...DEFAULT_SETTINGS, style };
  for (const t of TEMPLATE_LIST) {
    it(`${t.number} ${t.name}: textos dentro do canvas e sem alterar conteúdo`, () => {
      const s = applyTemplate(base(), t.id, { index: 1, total: 5, settings });
      expect(s.content).toEqual(content);
      const texts = s.elements.filter((e) => e.type === 'text' && e.role !== 'decor');
      expect(texts.length).toBeGreaterThan(0);
      for (const e of texts) {
        expect(e.x).toBeGreaterThanOrEqual(LAYOUT.safeMargin - 1);
        expect(e.x + e.width).toBeLessThanOrEqual(CANVAS.width - LAYOUT.safeMargin + 1);
        expect(e.y).toBeGreaterThanOrEqual(0);
      }
      // elementos ligados preservam o texto do conteúdo
      const hl = s.elements.find((e) => e.type === 'text' && e.bind === 'headline');
      if (hl && hl.type === 'text') expect(hl.text).toBe(content.headline);
    });
  }
});

describe('templates', () => {
  it('trocar de template mantém elementos do usuário', () => {
    const s = applyTemplate(base(), 'text', { index: 0, total: 1, settings: DEFAULT_SETTINGS });
    s.elements.push({ id: 'user1', type: 'shape', shape: 'rect', name: 'r', x: 1, y: 1, width: 10, height: 10, rotation: 0, opacity: 1, fill: '#000', stroke: 'transparent', strokeWidth: 0, cornerRadius: 0 });
    const s2 = applyTemplate(s, 'data', { index: 0, total: 1, settings: DEFAULT_SETTINGS });
    expect(s2.elements.some((e) => e.id === 'user1')).toBe(true);
    expect(s2.content).toEqual(content);
  });
});
