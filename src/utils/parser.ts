import type { ParsedSlide, SlideContent, TemplateId } from '../types/carouselTypes';

/**
 * Carousel text parser.
 *
 * Splits the pasted text into slides and extracts the STRUCTURE of each block
 * (headline, paragraph, list, number, quote, CTA…). The text is never
 * rewritten: every word ends up in a field exactly as it was typed.
 * The template suggestion looks only at the form of the content, never at its meaning.
 */

const HEADER_RE = /^\s*(?:slide|l[âa]mina|card|p[áa]gina|tela)\s*#?\s*(\d{1,3})\s*[:.\-–—)]?\s*(.*)$/i;
const SEPARATOR_RE = /^\s*(?:-{3,}|={3,}|_{3,})\s*$/;
const BULLET_RE = /^\s*(?:[-•*▪·✓✔→]|\d{1,2}[.)]|[a-z][)])\s+(.+)$/i;
const QUOTE_RE = /^\s*["“”«„'‘](.+?)["“”»'’]?\s*$/;
const AUTHOR_RE = /^\s*[—–―]\s*(.+)$/;
const STAT_TOKEN = String.raw`[+\-]?(?:US\$|R\$|\$|€|£)?\s?\d[\d.,]*\s?(?:%|x|k|mil|mi|milh[õo]es|bi|bilh[õo]es|anos|dias|meses|h|horas)?\+?`;
const STAT_LINE_RE = new RegExp(`^\\s*${STAT_TOKEN}\\s*$`, 'i');
const STAT_INLINE_RE = new RegExp(`^\\s*((?:[+\\-]?(?:US\\$|R\\$|\\$|€)\\s?\\d[\\d.,]*\\s?(?:mil|mi|milh[õo]es|bi|bilh[õo]es|k)?)|(?:[+\\-]?\\d[\\d.,]*\\s?%))\\s+(.{8,})$`, 'i');
const HANDLE_RE = /(^|\s)(@[\w.]{2,})|(https?:\/\/\S+)|(\b[\w-]+\.(?:com|com\.br|net|org|io|us)(?:\/\S*)?)/i;
const CTA_RE = /^\s*(salve|comente|compartilhe|agende|fale|clique|acesse|siga|envie|chame|mande|baixe|inscreva|garanta|toque|arraste|link na bio|marque|descubra|entre em contato|converse|reserve|saiba mais|vem|venha)\b/i;

type LabelTarget = keyof SlideContent | 'left' | 'right';

const LABELS: Array<[RegExp, LabelTarget]> = [
  [/^(eyebrow|editoria|chap[ée]u|categoria|se[çc][ãa]o)$/i, 'eyebrow'],
  [/^(tag|etiqueta)$/i, 'tag'],
  [/^(t[íi]tulo|headline|manchete|frase)$/i, 'headline'],
  [/^(subt[íi]tulo|texto|body|corpo|descri[çc][ãa]o|par[áa]grafo|complemento|contexto)$/i, 'body'],
  [/^(n[úu]mero|dado|stat|estat[íi]stica)$/i, 'number'],
  [/^(fonte|source|refer[êe]ncia)$/i, 'source'],
  [/^(autor|author|por|assinatura)$/i, 'author'],
  [/^(cta|chamada|a[çc][ãa]o)$/i, 'cta'],
  [/^(data|date|quando)$/i, 'date'],
  [/^(nome|name|cliente|personagem)$/i, 'name'],
  [/^(cita[çc][ãa]o|quote|aspas)$/i, 'quote'],
  [/^(handle|instagram|url|link|site|@)$/i, 'handle'],
  [/^(antes|op[çc][ãa]o a|lado a|a|mito|errado|sem)$/i, 'left'],
  [/^(depois|op[çc][ãa]o b|lado b|b|verdade|certo|com)$/i, 'right'],
];

function matchLabel(line: string): { target: LabelTarget; label: string; value: string } | null {
  const m = line.match(/^\s*([^:]{1,24}):\s*(.*)$/);
  if (!m) return null;
  const label = m[1].trim();
  if (/^https?$/i.test(label)) return null;
  for (const [re, target] of LABELS) {
    if (re.test(label)) return { target, label, value: m[2].trim() };
  }
  return null;
}

/** Splits the full text into raw blocks (one per slide) */
export function splitIntoBlocks(input: string): string[] {
  const text = input.replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const hasHeaders = lines.some((l) => HEADER_RE.test(l));

  if (hasHeaders) {
    const blocks: string[] = [];
    let current: string[] | null = null;
    for (const line of lines) {
      const h = line.match(HEADER_RE);
      if (h) {
        if (current) blocks.push(current.join('\n'));
        current = [];
        if (h[2] && h[2].trim()) current.push(h[2].trim());
      } else if (current) {
        current.push(line);
      }
      // text before the first "SLIDE" header is ignored (usually a title/briefing)
    }
    if (current) blocks.push(current.join('\n'));
    return blocks.map((b) => b.trim()).filter(Boolean);
  }

  const hasSeparators = lines.some((l) => SEPARATOR_RE.test(l));
  if (hasSeparators) {
    return text
      .split(/\n\s*(?:-{3,}|={3,}|_{3,})\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);
  }

  // Fallback: blocks separated by two or more blank lines, or by a single blank line
  const byDouble = text.split(/\n\s*\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  if (byDouble.length > 1) return byDouble;
  return text.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
}

const isShortCaps = (s: string) => s.length <= 48 && s === s.toUpperCase() && /[A-ZÀ-Ý]/.test(s) && s.split(/\s+/).length <= 7;

/** Extracts the structure of a block without changing the text */
export function parseBlock(raw: string): SlideContent {
  const content: SlideContent = {};
  const plain: string[] = [];
  const items: string[] = [];
  const append = (key: 'body' | 'leftBody' | 'rightBody', value: string) => {
    content[key] = content[key] ? `${content[key]}\n${value}` : value;
  };
  let lastQuote = false;
  let side: 'left' | 'right' | null = null;
  /** CTAs detected by the verb (the explicit "CTA:" label takes priority) */
  const autoCta: Array<{ line: string; at: number }> = [];
  /** Never overwrites: a repeated field is appended on a new line */
  const assign = (key: keyof SlideContent, value: string) => {
    const cur = (content as Record<string, unknown>)[key];
    (content as Record<string, unknown>)[key] = typeof cur === 'string' && cur ? `${cur}\n${value}` : value;
  };

  const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  lines.forEach((line) => {
    // Side A/B blocks of a comparison: subsequent lines belong to the side
    const label = matchLabel(line);
    if (label) {
      side = null;
      lastQuote = false;
      switch (label.target) {
        case 'left':
          content.leftTitle = label.label;
          if (label.value) content.leftBody = label.value;
          side = 'left';
          return;
        case 'right':
          content.rightTitle = label.label;
          if (label.value) content.rightBody = label.value;
          side = 'right';
          return;
        case 'body':
          if (label.value) append('body', label.value);
          return;
        default:
          if (label.value) assign(label.target, label.value);
          else if (label.target === 'tag') assign('tag', label.label);
          else plain.push(line);
          return;
      }
    }

    if (/^not[íi]cia[:!]?$/i.test(line) || /^breaking( news)?$/i.test(line) || /^urgente[:!]?$/i.test(line)) {
      content.tag = line.replace(/[:!]$/, '').toUpperCase();
      return;
    }

    if (side) {
      const bullet = line.match(BULLET_RE);
      append(side === 'left' ? 'leftBody' : 'rightBody', bullet ? bullet[1] : line);
      return;
    }

    const author = line.match(AUTHOR_RE);
    if (author && (lastQuote || content.quote)) {
      assign('author', author[1].trim());
      lastQuote = false;
      return;
    }

    const quote = line.match(QUOTE_RE);
    if (quote && /["“«„]/.test(line[0]) && line.length > 12) {
      content.quote = content.quote ? `${content.quote}\n${quote[1]}` : quote[1];
      lastQuote = true;
      return;
    }
    lastQuote = false;

    const bullet = line.match(BULLET_RE);
    if (bullet && !AUTHOR_RE.test(line)) {
      items.push(bullet[1].trim());
      return;
    }

    if (STAT_LINE_RE.test(line) && !content.number) {
      content.number = line.trim();
      return;
    }

    const handle = line.match(HANDLE_RE);
    if (handle && line.replace(HANDLE_RE, '').trim().length < 4) {
      assign('handle', line.trim());
      return;
    }

    if (CTA_RE.test(line) && line.length <= 90 && plain.length > 0) {
      autoCta.push({ line, at: plain.length });
      return;
    }

    plain.push(line);
  });

  if (items.length) content.items = items;

  // Auto-detected CTA: uses the last one if there is no explicit "CTA:"; the others go back to the text
  if (!content.cta && autoCta.length) content.cta = autoCta.pop()!.line;
  for (let i = autoCta.length - 1; i >= 0; i--) plain.splice(autoCta[i].at, 0, autoCta[i].line);

  // Short all-caps first line followed by more text = eyebrow
  if (plain.length >= 2 && !content.eyebrow && isShortCaps(plain[0])) {
    content.eyebrow = plain.shift();
  }

  // Number at the start of the sentence ("73% dos...") → number + headline
  if (!content.number && plain.length && !content.items) {
    const inline = plain[0].match(STAT_INLINE_RE);
    if (inline) {
      content.number = inline[1].trim();
      plain[0] = inline[2].trim();
    }
  }

  if (!content.headline && plain.length) content.headline = plain.shift();
  if (plain.length) content.body = content.body ? `${plain.join('\n')}\n${content.body}` : plain.join('\n');

  return content;
}

/** Suggests a template based only on the content STRUCTURE */
export function suggestTemplate(content: SlideContent, index: number, total: number): { template: TemplateId; reason: string } {
  const isFirst = index === 0;
  const isLast = index === total - 1 && total > 1;

  if (content.tag && /not[íi]cia|breaking|urgente/i.test(content.tag)) return { template: 'news', reason: 'Tag de notícia' };
  if (content.leftBody || content.rightBody) return { template: 'comparison', reason: 'Dois blocos (A/B)' };
  if (content.quote) return { template: 'quote', reason: 'Citação entre aspas' };
  if (content.items && content.items.length >= 2) return { template: 'list', reason: `Lista com ${content.items.length} itens` };
  if (content.number) return { template: 'data', reason: 'Número em destaque' };
  if (content.name) return { template: 'story', reason: 'Nome de pessoa/case' };
  if (isFirst) return { template: 'cover', reason: 'Primeiro slide' };
  if (isLast && (content.cta || content.handle)) {
    return content.body ? { template: 'cta', reason: 'Chamada para ação' } : { template: 'closing', reason: 'Último slide com CTA' };
  }
  if (content.cta || content.handle) return { template: 'cta', reason: 'Chamada para ação' };
  if (isLast) return { template: 'closing', reason: 'Último slide' };
  if (content.body) return { template: 'text', reason: 'Headline + parágrafo' };
  return { template: 'text', reason: 'Frase única' };
}

export function parseCarousel(input: string): ParsedSlide[] {
  const blocks = splitIntoBlocks(input);
  return blocks.map((raw, index) => {
    const content = parseBlock(raw);
    const { template, reason } = suggestTemplate(content, index, blocks.length);
    return { index, rawText: raw, content, suggested: template, reason };
  });
}

/** Rebuilds the text of a content object (used in the Slides panel) */
export function contentToText(c: SlideContent): string {
  const out: string[] = [];
  if (c.tag) out.push(`Tag: ${c.tag}`);
  if (c.eyebrow) out.push(`Eyebrow: ${c.eyebrow}`);
  if (c.number) out.push(c.number);
  if (c.headline) out.push(c.headline);
  if (c.quote) out.push(`“${c.quote}”`);
  if (c.author) out.push(`— ${c.author}`);
  if (c.body) out.push(c.body);
  if (c.items) c.items.forEach((i) => out.push(`- ${i}`));
  if (c.leftTitle || c.leftBody) out.push(`${c.leftTitle || 'Antes'}: ${c.leftBody ?? ''}`);
  if (c.rightTitle || c.rightBody) out.push(`${c.rightTitle || 'Depois'}: ${c.rightBody ?? ''}`);
  if (c.name) out.push(`Nome: ${c.name}`);
  if (c.date) out.push(`Data: ${c.date}`);
  if (c.source) out.push(`Fonte: ${c.source}`);
  if (c.cta) out.push(`CTA: ${c.cta}`);
  if (c.handle) out.push(c.handle);
  return out.join('\n');
}
