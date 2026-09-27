import { useMemo, useState } from 'react';
import { TEMPLATES, TEMPLATE_LIST } from '../templates/templates';
import type { ParsedSlide, TemplateId } from '../types/carouselTypes';
import { newProject, setState, type CreationStyle } from '../editor/store';
import { parseCarousel } from '../utils/parser';
import { AppMark, Icon } from './Icons';
import { Button, Segmented, Select, TextInput } from './ui';

export const SAMPLE_TEXT = `SLIDE 01
EB-2 NIW
Você não precisa começar do zero para construir sua vida nos EUA.

SLIDE 02
Seu diploma, sua experiência e sua trajetória podem fazer parte do seu *projeto imigratório*.
Profissionais qualificados têm caminhos próprios — e legais — para morar e trabalhar nos Estados Unidos.

SLIDE 03
Existem caminhos legais para profissionais qualificados.
- EB-2 NIW: sem oferta de emprego
- EB-1: habilidades extraordinárias
- O-1: talentos reconhecidos
- L-1: transferência entre empresas

SLIDE 04
37%
das petições EB-2 NIW aprovadas no último ano fiscal foram de profissionais de áreas técnicas.
Fonte: inserir fonte oficial (exemplo)

SLIDE 05
“Imigrar não é recomeçar do zero. É levar sua trajetória para um novo lugar.”
— All Green Consulting

SLIDE 06
Conheça o EB-2 NIW.
Agende uma análise de perfil com a nossa equipe.
CTA: Agende sua análise
@allgreenconsulting`;

export function NewCarousel() {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [style, setStyle] = useState<CreationStyle>('auto');
  const [overrides, setOverrides] = useState<Record<number, TemplateId>>({});

  const parsed = useMemo(() => (text.trim() ? parseCarousel(text) : []), [text]);
  const final: ParsedSlide[] = parsed.map((p) => ({ ...p, suggested: overrides[p.index] ?? p.suggested }));

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line bg-panel px-6 py-3">
        <div className="flex items-center gap-3">
          <button className="rounded-md p-1.5 hover:bg-black/5" onClick={() => setState({ view: 'dashboard' })} title="Voltar">
            <Icon.back />
          </button>
          <AppMark size={26} />
          <div className="text-[14px] font-semibold">Novo carrossel</div>
        </div>
        <Button variant="primary" disabled={!final.length} onClick={() => newProject(name.trim() || firstLine(final), final, style)}>
          Criar carrossel com {final.length || 0} slides <Icon.next />
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(420px,1fr)_minmax(420px,1fr)]">
        <div className="flex min-h-0 flex-col gap-4 overflow-auto border-r border-line bg-panel p-6">
          <div>
            <div className="eyebrow mb-1.5">1 · Nome do projeto</div>
            <TextInput value={name} onChange={setName} placeholder="Ex.: EB-2 NIW — caminhos legais" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="eyebrow">2 · Cole o texto do carrossel</div>
              <button className="text-[12px] text-brand underline-offset-2 hover:underline" onClick={() => setText(SAMPLE_TEXT)}>
                Usar texto de exemplo
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setOverrides({});
              }}
              spellCheck={false}
              placeholder={'SLIDE 01\nVocê não precisa começar do zero para construir sua vida nos EUA.\n\nSLIDE 02\nSeu diploma, sua experiência e sua trajetória…\n\nSLIDE 03\n…'}
              className="min-h-[360px] w-full flex-1 resize-none rounded-lg border border-line-strong bg-panel-2 p-4 font-mono text-[12.5px] leading-relaxed outline-none focus:border-brand"
            />
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Reconhece <b>SLIDE 01</b>, <b>Slide 1:</b>, <b>Lâmina 2</b> ou blocos separados por linha em branco / <b>---</b>. Estrutura detectada: listas (- item), números (37%, US$ 1,2 mi),
              citações (“…” — Autor), rótulos (Título:, Texto:, Fonte:, CTA:, Antes:, Depois:, Nome:, Data:) e *palavras destacadas*. O texto nunca é reescrito.
            </p>
          </div>
          <div>
            <div className="eyebrow mb-1.5">3 · Estilo</div>
            <Segmented
              value={style}
              onChange={setStyle}
              options={[
                { value: 'auto', label: 'Automático (alterna verde / off-white)' },
                { value: 'dark', label: 'Tudo verde' },
                { value: 'light', label: 'Tudo off-white' },
              ]}
            />
          </div>
        </div>

        <div className="min-h-0 overflow-auto bg-ui-bg p-6">
          <div className="eyebrow mb-3">Slides detectados · layout sugerido pela estrutura</div>
          {!final.length && <div className="rounded-xl border border-dashed border-line-strong p-10 text-center text-muted">Os slides aparecem aqui conforme você cola o texto.</div>}
          <ol className="space-y-3">
            {final.map((p) => (
              <li key={p.index} className="rounded-xl border border-line bg-panel p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 min-w-8 items-center justify-center rounded-md bg-brand px-1.5 text-[11px] font-bold text-white">{String(p.index + 1).padStart(2, '0')}</span>
                    <span className="text-[11.5px] text-muted">{p.reason}</span>
                  </div>
                  <Select
                    className="w-52"
                    value={p.suggested}
                    onChange={(v) => setOverrides((o) => ({ ...o, [p.index]: v }))}
                    options={TEMPLATE_LIST.map((t) => ({ value: t.id, label: `${t.number} · ${t.name}` }))}
                  />
                </div>
                <FieldsPreview p={p} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function firstLine(slides: ParsedSlide[]) {
  const h = slides[0]?.content.headline ?? 'Carrossel';
  return h.replace(/\*/g, '').slice(0, 60);
}

const FIELD_LABELS: Record<string, string> = {
  tag: 'Tag',
  eyebrow: 'Eyebrow',
  number: 'Número',
  headline: 'Headline',
  quote: 'Citação',
  author: 'Autor',
  body: 'Texto',
  items: 'Lista',
  leftTitle: 'Título A',
  leftBody: 'Bloco A',
  rightTitle: 'Título B',
  rightBody: 'Bloco B',
  name: 'Nome',
  date: 'Data',
  source: 'Fonte',
  cta: 'CTA',
  handle: '@ / URL',
};

function FieldsPreview({ p }: { p: ParsedSlide }) {
  const entries = Object.entries(p.content).filter(([, v]) => v !== undefined && v !== '');
  return (
    <div className="space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[72px_1fr] gap-2 text-[12px]">
          <span className="pt-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-faint">{FIELD_LABELS[k] ?? k}</span>
          <span className="whitespace-pre-line leading-snug">{Array.isArray(v) ? v.map((i) => `• ${i}`).join('\n') : String(v)}</span>
        </div>
      ))}
      <div className="pt-1 text-[11px] text-muted">
        Template: <b className="text-ink">{TEMPLATES[p.suggested].name}</b> — {TEMPLATES[p.suggested].description}
      </div>
    </div>
  );
}
