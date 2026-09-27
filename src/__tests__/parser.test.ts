import { describe, expect, it } from 'vitest';
import { parseBlock, parseCarousel, splitIntoBlocks } from '../utils/parser';
import { SAMPLE_TEXT } from '../components/NewCarousel';

describe('splitIntoBlocks', () => {
  it('reconhece SLIDE 01 / SLIDE 02', () => {
    const b = splitIntoBlocks('SLIDE 01\nA\n\nSLIDE 02\nB\nC');
    expect(b).toEqual(['A', 'B\nC']);
  });
  it('reconhece "Slide 1:" com texto na mesma linha', () => {
    const b = splitIntoBlocks('Slide 1: Primeiro\nSlide 2: Segundo\nmais texto');
    expect(b).toEqual(['Primeiro', 'Segundo\nmais texto']);
  });
  it('usa linhas em branco quando não há cabeçalhos', () => {
    expect(splitIntoBlocks('Um\n\nDois\n\nTrês')).toHaveLength(3);
  });
  it('usa separadores ---', () => {
    expect(splitIntoBlocks('Um\n---\nDois')).toEqual(['Um', 'Dois']);
  });
});

describe('parseBlock (não reescreve o texto)', () => {
  it('headline + parágrafo', () => {
    const c = parseBlock('Seu diploma conta.\nProfissionais qualificados têm caminhos.');
    expect(c.headline).toBe('Seu diploma conta.');
    expect(c.body).toBe('Profissionais qualificados têm caminhos.');
  });
  it('lista', () => {
    const c = parseBlock('Caminhos:\n- EB-2 NIW\n- EB-1\n• O-1');
    expect(c.items).toEqual(['EB-2 NIW', 'EB-1', 'O-1']);
  });
  it('número isolado + fonte', () => {
    const c = parseBlock('37%\ndas petições foram aprovadas.\nFonte: USCIS');
    expect(c.number).toBe('37%');
    expect(c.headline).toBe('das petições foram aprovadas.');
    expect(c.source).toBe('USCIS');
  });
  it('número no início da frase', () => {
    const c = parseBlock('73% dos imigrantes qualificados chegam com diploma.');
    expect(c.number).toBe('73%');
    expect(c.headline).toBe('dos imigrantes qualificados chegam com diploma.');
  });
  it('citação com autor', () => {
    const c = parseBlock('“Imigrar não é recomeçar do zero.”\n— Maria Silva');
    expect(c.quote).toBe('Imigrar não é recomeçar do zero.');
    expect(c.author).toBe('Maria Silva');
  });
  it('comparação antes/depois', () => {
    const c = parseBlock('Título: Visto de turista x Green Card\nAntes: prazo limitado\nDepois: residência permanente');
    expect(c.headline).toBe('Visto de turista x Green Card');
    expect(c.leftTitle).toBe('Antes');
    expect(c.leftBody).toBe('prazo limitado');
    expect(c.rightBody).toBe('residência permanente');
  });
  it('eyebrow em caixa alta', () => {
    const c = parseBlock('EB-2 NIW\nVocê não precisa começar do zero.');
    expect(c.eyebrow).toBe('EB-2 NIW');
    expect(c.headline).toBe('Você não precisa começar do zero.');
  });
  it('CTA e handle', () => {
    const c = parseBlock('Conheça o EB-2 NIW.\nAgende uma análise de perfil.\n@allgreenconsulting');
    expect(c.headline).toBe('Conheça o EB-2 NIW.');
    expect(c.cta).toBe('Agende uma análise de perfil.');
    expect(c.handle).toBe('@allgreenconsulting');
  });
  it('mantém *marcação* de destaque intacta', () => {
    const c = parseBlock('Seu *diploma* conta.');
    expect(c.headline).toBe('Seu *diploma* conta.');
  });
});

describe('parseCarousel — sugestão estrutural de template', () => {
  it('texto de exemplo', () => {
    const r = parseCarousel(SAMPLE_TEXT);
    expect(r.map((s) => s.suggested)).toEqual(['cover', 'text', 'list', 'data', 'quote', 'cta']);
  });
  it('notícia', () => {
    const r = parseCarousel('SLIDE 1\nCapa\nSLIDE 2\nNOTÍCIA\nUSCIS atualiza regras\nData: 12/05');
    expect(r[1].suggested).toBe('news');
    expect(r[1].content.date).toBe('12/05');
  });
  it('não perde nenhuma palavra', () => {
    const r = parseCarousel(SAMPLE_TEXT);
    const words = (s: string) => s.replace(/SLIDE \d+/g, '').replace(/CTA:|Fonte:/g, '').match(/[\p{L}\p{N}@%]+/gu) ?? [];
    const out = r.flatMap((s) => Object.values(s.content).flatMap((v) => (Array.isArray(v) ? v : [v])).flatMap((v) => words(String(v))));
    expect(out.sort()).toEqual(words(SAMPLE_TEXT).sort());
  });
});
