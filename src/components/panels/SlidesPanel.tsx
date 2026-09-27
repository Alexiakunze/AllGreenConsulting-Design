import {
  addSlide,
  autoLayout,
  currentSlide,
  deleteSlide,
  duplicateSlide,
  moveSlide,
  renameSlide,
  selectSlide,
  setSlideBackground,
  setSlideTemplate,
  setSlideTheme,
  useEditor,
} from '../../editor/store';
import { TEMPLATE_LIST, TEMPLATES, THEME_LABELS } from '../../templates/templates';
import type { SlideTheme } from '../../types/carouselTypes';
import { Icon } from '../Icons';
import { Button, ColorField, Label, Section, Segmented, TextInput, cx } from '../ui';

export function SlidesPanel() {
  const project = useEditor((s) => s.project)!;
  const slide = useEditor((s) => currentSlide(s));
  const index = slide ? project.slides.indexOf(slide) : -1;

  return (
    <div>
      {slide && (
        <Section title={`Slide ${String(index + 1).padStart(2, '0')} de ${String(project.slides.length).padStart(2, '0')}`}>
          <div className="space-y-3">
            <label className="block">
              <Label>Nome</Label>
              <TextInput value={slide.name} onChange={(v) => renameSlide(slide.id, v)} />
            </label>
            <div>
              <Label>Fundo / tema</Label>
              <Segmented
                value={slide.theme}
                onChange={(v: SlideTheme) => setSlideTheme(slide.id, v)}
                options={(Object.keys(THEME_LABELS) as SlideTheme[]).map((t) => ({ value: t, label: THEME_LABELS[t] }))}
              />
            </div>
            <ColorField label="Cor de fundo" value={slide.background} onChange={(v) => setSlideBackground(slide.id, v)} palette={project.palette} allowTransparent={false} />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => autoLayout(slide.id)} title="Não altera o texto">
                <Icon.wand /> Organizar
              </Button>
              <Button onClick={() => duplicateSlide(slide.id)}>
                <Icon.copy /> Duplicar
              </Button>
              <Button disabled={index <= 0} onClick={() => moveSlide(index, index - 1)}>
                <Icon.back /> Mover
              </Button>
              <Button disabled={index >= project.slides.length - 1} onClick={() => moveSlide(index, index + 1)}>
                Mover <Icon.next />
              </Button>
              <Button variant="danger" className="col-span-2" onClick={() => deleteSlide(slide.id)}>
                <Icon.trash /> Excluir slide
              </Button>
            </div>
          </div>
        </Section>
      )}

      {slide && (
        <Section title="Trocar template (mantém o conteúdo)">
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATE_LIST.map((t) => (
              <button
                key={t.id}
                onClick={() => setSlideTemplate(slide.id, t.id)}
                className={cx(
                  'rounded-lg border p-2.5 text-left transition-colors',
                  slide.template === t.id ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong hover:bg-panel-2',
                )}
              >
                <TemplateGlyph id={t.id} />
                <div className="mt-2 text-[10px] font-bold tabular-nums text-accent">{t.number}</div>
                <div className="text-[12px] font-semibold leading-tight">{t.name}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted">{TEMPLATES[slide.template].description}</p>
        </Section>
      )}

      <Section
        title="Todos os slides"
        actions={
          <button className="text-[11.5px] font-medium text-brand hover:underline" onClick={() => autoLayout(null)}>
            Organizar todos
          </button>
        }
      >
        <div className="space-y-1">
          {project.slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => selectSlide(s.id)}
              className={cx('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px]', s.id === slide?.id ? 'bg-brand-soft text-brand' : 'hover:bg-panel-2')}
            >
              <span className="w-5 font-bold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="text-[10.5px] text-faint">{TEMPLATES[s.template].name}</span>
            </button>
          ))}
        </div>
        <Button className="mt-3 w-full" onClick={() => addSlide('text', slide?.id)}>
          <Icon.plus /> Adicionar slide
        </Button>
      </Section>
    </div>
  );
}

/** Mini schematic of each template (UI only) */
function TemplateGlyph({ id }: { id: string }) {
  const bar = (w: string, h = 'h-1', c = 'bg-ink/70') => <div className={cx(h, w, c, 'rounded-full')} />;
  return (
    <div className="flex aspect-[4/5] w-full flex-col justify-between rounded-md bg-panel-2 p-2 ring-1 ring-line">
      {id === 'cover' && (
        <>
          <div className="ml-auto h-6 w-5 rounded-t-full bg-accent" />
          <div className="space-y-1">
            {bar('w-full', 'h-1.5')}
            {bar('w-2/3', 'h-1.5')}
          </div>
        </>
      )}
      {id === 'text' && (
        <div className="my-auto space-y-1">
          {bar('w-3', 'h-0.5', 'bg-accent')}
          {bar('w-full', 'h-1.5')}
          {bar('w-4/5', 'h-1.5')}
          {bar('w-full', 'h-0.5', 'bg-ink/30')}
          {bar('w-3/4', 'h-0.5', 'bg-ink/30')}
        </div>
      )}
      {id === 'data' && (
        <div className="my-auto space-y-1">
          <div className="text-[18px] font-bold leading-none text-accent">37%</div>
          {bar('w-full', 'h-px', 'bg-ink/30')}
          {bar('w-3/4')}
        </div>
      )}
      {id === 'list' && (
        <div className="space-y-1.5">
          {bar('w-2/3', 'h-1.5')}
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1">
              {bar('w-1.5', 'h-1', 'bg-accent')}
              {bar('w-full', 'h-0.5', 'bg-ink/40')}
            </div>
          ))}
        </div>
      )}
      {id === 'quote' && (
        <div className="my-auto">
          <div className="text-[20px] font-bold leading-none text-accent">“</div>
          {bar('w-full', 'h-1')}
          <div className="h-1" />
          {bar('w-2/3', 'h-1')}
        </div>
      )}
      {id === 'comparison' && (
        <div className="my-auto grid grid-cols-2 gap-1">
          <div className="h-10 rounded bg-ink/15" />
          <div className="h-10 rounded bg-brand" />
        </div>
      )}
      {id === 'cta' && (
        <div className="my-auto space-y-1.5">
          {bar('w-full', 'h-1.5')}
          <div className="h-2.5 w-2/3 rounded-full bg-accent" />
        </div>
      )}
      {id === 'news' && (
        <div className="space-y-1">
          <div className="h-1.5 w-5 rounded-full bg-accent" />
          {bar('w-full', 'h-0.5', 'bg-ink')}
          {bar('w-full', 'h-1.5')}
          {bar('w-3/4', 'h-1.5')}
        </div>
      )}
      {id === 'story' && (
        <>
          <div className="h-7 w-5 rounded-t-full bg-accent" />
          <div className="space-y-1">
            {bar('w-3', 'h-0.5', 'bg-accent')}
            {bar('w-full', 'h-1')}
          </div>
        </>
      )}
      {id === 'closing' && (
        <div className="my-auto flex flex-col items-center gap-1">
          <div className="h-1.5 w-6 rounded-full bg-brand" />
          {bar('w-full', 'h-1.5')}
          <div className="h-2 w-1/2 rounded-full bg-accent" />
        </div>
      )}
    </div>
  );
}
