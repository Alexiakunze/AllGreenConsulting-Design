import { useMemo, useState } from 'react';
import { appendParsedSlides, currentSlide, setState, updateContent, useEditor, type CreationStyle } from '../../editor/store';
import { TEMPLATES } from '../../templates/templates';
import type { ContentKey, Slide } from '../../types/carouselTypes';
import { parseCarousel } from '../../utils/parser';
import { Button, Label, Section, Segmented, Select, TextArea, Toggle } from '../ui';

export const FIELD_META: Record<ContentKey, { label: string; multiline?: boolean }> = {
  tag: { label: 'Tag' },
  eyebrow: { label: 'Eyebrow / editoria' },
  number: { label: 'Número' },
  headline: { label: 'Headline', multiline: true },
  body: { label: 'Texto complementar', multiline: true },
  items: { label: 'Lista (um item por linha)', multiline: true },
  quote: { label: 'Citação', multiline: true },
  author: { label: 'Autor' },
  source: { label: 'Fonte' },
  cta: { label: 'CTA (botão)' },
  handle: { label: '@ / URL' },
  date: { label: 'Data' },
  name: { label: 'Nome' },
  leftTitle: { label: 'Título do bloco A' },
  leftBody: { label: 'Bloco A', multiline: true },
  rightTitle: { label: 'Título do bloco B' },
  rightBody: { label: 'Bloco B', multiline: true },
};

const ALL_KEYS = Object.keys(FIELD_META) as ContentKey[];

export function ContentPanel() {
  const slide = useEditor((s) => currentSlide(s));
  return (
    <div>
      {slide && <SlideContentEditor slide={slide} />}
      <ImportText />
    </div>
  );
}

function SlideContentEditor({ slide }: { slide: Slide }) {
  const autoRelayout = useEditor((s) => s.autoRelayout);
  const tpl = TEMPLATES[slide.template];
  const present = ALL_KEYS.filter((k) => slide.content[k] !== undefined);
  const [extra, setExtra] = useState<ContentKey[]>([]);
  const keys = useMemo(() => {
    const set = new Set<ContentKey>([...tpl.uses, ...present, ...extra]);
    return ALL_KEYS.filter((k) => set.has(k));
  }, [tpl, present, extra]);
  const missing = ALL_KEYS.filter((k) => !keys.includes(k));

  return (
    <Section title={`Conteúdo · ${slide.name}`}>
      <p className="mb-3 text-[11.5px] leading-relaxed text-muted">
        O texto é seu: o sistema só posiciona. Use <b className="text-ink">*asteriscos*</b> para destacar palavras-chave na cor de destaque.
      </p>
      <div className="space-y-3">
        {keys.map((k) => {
          const meta = FIELD_META[k];
          const raw = slide.content[k];
          const value = Array.isArray(raw) ? raw.join('\n') : raw ?? '';
          const onChange = (v: string) => updateContent(slide.id, k, k === 'items' ? v.split('\n').filter((l, i, arr) => l.trim() || i === arr.length - 1) : v);
          return (
            <label key={k} className="block">
              <Label>
                {meta.label}
                {!tpl.uses.includes(k) && <span className="ml-1 text-faint">(fora deste template)</span>}
              </Label>
              {meta.multiline ? <TextArea value={value} onChange={onChange} rows={k === 'items' ? 5 : 3} /> : <TextArea value={value} onChange={onChange} rows={1} />}
            </label>
          );
        })}
      </div>
      {missing.length > 0 && (
        <div className="mt-3">
          <Select
            value={'' as ContentKey}
            onChange={(k) => k && setExtra((e) => [...e, k])}
            options={[{ value: '' as ContentKey, label: '+ Adicionar campo…' }, ...missing.map((k) => ({ value: k, label: FIELD_META[k].label }))]}
          />
        </div>
      )}
      <div className="mt-3 rounded-md bg-panel-2 px-3 py-1.5">
        <Toggle checked={autoRelayout} onChange={(v) => setState({ autoRelayout: v })} label="Reorganizar layout ao editar" />
      </div>
    </Section>
  );
}

function ImportText() {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<CreationStyle>('auto');
  const parsed = useMemo(() => (text.trim() ? parseCarousel(text) : []), [text]);
  return (
    <Section title="Colar texto do carrossel">
      <TextArea
        value={text}
        onChange={setText}
        rows={9}
        className="font-mono text-[11.5px]"
        placeholder={'SLIDE 01\nVocê não precisa começar do zero…\n\nSLIDE 02\n…'}
      />
      {parsed.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[11.5px] text-muted">{parsed.length} slides detectados:</div>
          {parsed.map((p) => (
            <div key={p.index} className="flex items-center gap-2 text-[11.5px]">
              <span className="w-6 font-bold tabular-nums text-brand">{String(p.index + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1 truncate">{(p.content.headline ?? p.content.quote ?? p.content.number ?? '').replace(/\*/g, '')}</span>
              <span className="shrink-0 text-faint">{TEMPLATES[p.suggested].name}</span>
            </div>
          ))}
          <div className="pt-2">
            <Segmented
              value={style}
              onChange={setStyle}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'dark', label: 'Verde' },
                { value: 'light', label: 'Off-white' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button onClick={() => appendParsedSlides(parsed, style, false)}>Adicionar ao final</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (confirm('Substituir todos os slides atuais pelos slides detectados?')) appendParsedSlides(parsed, style, true);
              }}
            >
              Substituir slides
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}
