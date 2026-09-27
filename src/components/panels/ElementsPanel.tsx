import { useRef, type ReactNode } from 'react';
import { CANVAS, LAYOUT, tok, type TypeStyle } from '../../design-system/designTokens';
import { LOGO_LABELS, LOGO_VARIANTS } from '../../design-system/brandAssets';
import { logoHeightFor, makeLogo, makeShape, makeTag, makeText } from '../../templates/elementFactory';
import { THEMES } from '../../templates/templates';
import { addElement, currentSlide, fileToAsset, getState, insertImage, registerAsset, useEditor } from '../../editor/store';
import type { Asset, CarouselElement, ShapeKind } from '../../types/carouselTypes';
import { Icon } from '../Icons';
import { Button, Section } from '../ui';

const M = LAYOUT.safeMargin;

/** Colors follow the current slide's theme (automatic design system) */
function themeColors() {
  const s = currentSlide(getState());
  return THEMES[s?.theme ?? 'dark'];
}

function add(el: CarouselElement) {
  addElement({ ...el, templateOwned: false });
}

const TEXT_PRESETS: Array<{ style: TypeStyle; label: string; sample: string; uppercase?: boolean; accent?: boolean }> = [
  { style: 'headline', label: 'Headline', sample: 'Headline' },
  { style: 'subheadline', label: 'Subheadline', sample: 'Subheadline' },
  { style: 'body', label: 'Texto', sample: 'Texto complementar' },
  { style: 'eyebrow', label: 'Eyebrow', sample: 'Editoria', uppercase: true, accent: true },
  { style: 'numberSm', label: 'Número', sample: '01', accent: true },
  { style: 'caption', label: 'Legenda', sample: 'Fonte / legenda' },
];

export function ElementsPanel() {
  const project = useEditor((s) => s.project)!;
  const fileRef = useRef<HTMLInputElement>(null);
  const photos = Object.values(project.assets).filter((a) => a.kind !== 'logo');

  const onFiles = async (files: FileList | null, kind: Asset['kind'] = 'photo') => {
    if (!files) return;
    for (const f of Array.from(files)) {
      const a = await fileToAsset(f, kind);
      if (!a) continue;
      registerAsset(a);
      insertImage(a);
    }
  };

  return (
    <div>
      <Section title="Texto">
        <div className="grid grid-cols-2 gap-2">
          {TEXT_PRESETS.map((p) => (
            <Tile
              key={p.style}
              onClick={() => {
                const t = themeColors();
                add(
                  makeText(p.sample, {
                    name: p.label,
                    style: p.style,
                    uppercase: p.uppercase,
                    color: p.accent ? t.accent : t.text,
                    highlightColor: t.accent,
                    x: M,
                    y: 480,
                    width: p.style === 'headline' ? CANVAS.width - M * 2 : 700,
                    templateOwned: false,
                  }),
                );
              }}
            >
              <span className={p.accent ? 'text-accent' : ''} style={{ fontWeight: p.style.startsWith('head') || p.style.startsWith('number') ? 600 : p.style === 'eyebrow' ? 600 : 400, fontSize: p.style === 'headline' ? 17 : p.style === 'subheadline' ? 14 : 12, textTransform: p.uppercase ? 'uppercase' : undefined, letterSpacing: p.uppercase ? '0.12em' : undefined }}>
                {p.label}
              </span>
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Elementos gráficos All Green">
        <div className="grid grid-cols-3 gap-2">
          <ShapeTile label="Arco" kind="arch" preview={<div className="h-8 w-6 rounded-t-full bg-accent" />} />
          <ShapeTile label="Arco linha" kind="archOutline" preview={<div className="h-8 w-6 rounded-t-full border-2 border-b-0 border-accent" />} />
          <ShapeTile label="Retângulo" kind="rect" preview={<div className="h-6 w-8 bg-brand" />} />
          <ShapeTile label="Círculo" kind="ellipse" preview={<div className="h-7 w-7 rounded-full bg-accent" />} />
          <ShapeTile label="Linha" kind="line" preview={<div className="h-0.5 w-9 bg-ink" />} />
          <ShapeTile label="Seta" kind="arrow" preview={<Icon.next width={22} height={22} />} />
          <Tile
            label="Divisor"
            onClick={() => {
              const t = themeColors();
              add(makeShape('rect', { name: 'Divisor', x: M, y: 640, width: CANVAS.width - M * 2, height: 2, fill: t.text, opacity: 0.2, templateOwned: false }));
            }}
          >
            <div className="h-px w-9 bg-ink/40" />
          </Tile>
          <Tile
            label="Régua"
            onClick={() => add(makeShape('rect', { name: 'Régua de destaque', x: M, y: 600, width: 72, height: 8, fill: themeColors().accent, templateOwned: false }))}
          >
            <div className="h-1.5 w-5 bg-accent" />
          </Tile>
          <Tile
            label="Pill"
            onClick={() => add(makeShape('rect', { name: 'Pill', x: M, y: 600, width: 320, height: 72, cornerRadius: 999, fill: themeColors().accent, templateOwned: false }))}
          >
            <div className="h-3.5 w-9 rounded-full bg-accent" />
          </Tile>
          <Tile
            label="Etiqueta"
            onClick={() => {
              const t = themeColors();
              add(makeTag('Etiqueta', { x: M, y: 600, stroke: t.accent, color: t.accent, templateOwned: false }));
            }}
          >
            <div className="rounded-full border border-accent px-1.5 text-[8px] font-semibold uppercase tracking-wider text-accent">Tag</div>
          </Tile>
          <Tile
            label="Tag cheia"
            onClick={() =>
              add(makeTag('Notícia', { x: M, y: 600, fill: tok('secondary'), stroke: 'transparent', strokeWidth: 0, color: tok('light'), templateOwned: false }))
            }
          >
            <div className="rounded-full bg-accent px-1.5 text-[8px] font-semibold uppercase tracking-wider text-white">Tag</div>
          </Tile>
          <Tile
            label="Nº editorial"
            onClick={() => {
              const t = themeColors();
              add(makeText('Nº 01', { name: 'Número editorial', style: 'eyebrow', fontSize: 28, color: t.accent, x: M, y: 600, width: 240, templateOwned: false }));
            }}
          >
            <span className="text-[11px] font-bold text-accent">Nº 01</span>
          </Tile>
        </div>
      </Section>

      <Section title="Logo">
        <div className="grid grid-cols-2 gap-2">
          {LOGO_VARIANTS.map((v) => (
            <Tile
              key={v}
              label={LOGO_LABELS[v].replace('Logo ', '')}
              onClick={() => {
                const width = v.startsWith('symbol') ? 140 : v.startsWith('compact') ? 300 : 320;
                const el = makeLogo(v, { width, x: M, y: CANVAS.height - M - 200, templateOwned: false });
                el.height = logoHeightFor(v, width);
                add(el);
              }}
            >
              <div className={`h-4 w-10 rounded-sm ${v.endsWith('Negative') ? 'bg-brand' : 'bg-panel-2 ring-1 ring-line'}`} />
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Imagens">
        <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void onFiles(e.target.files).finally(() => (e.target.value = ''))} />
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFiles(e.dataTransfer.files);
          }}
          className="rounded-lg border border-dashed border-line-strong p-4 text-center"
        >
          <Button onClick={() => fileRef.current?.click()}>
            <Icon.image /> Enviar imagem
          </Button>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">PNG, JPG ou WEBP. Arraste aqui. Se o template tiver espaço para foto (arco), a imagem entra nele.</p>
        </div>
        {photos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {photos.map((a) => (
              <button key={a.id} title={`Inserir ${a.name}`} onClick={() => insertImage(a)} className="aspect-square overflow-hidden rounded-md ring-1 ring-line hover:ring-brand">
                <img src={a.src} alt={a.name} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Tile({ children, label, onClick }: { children: ReactNode; label?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-1 py-3 text-center hover:border-brand hover:bg-panel-2">
      <div className="flex h-9 items-center justify-center">{children}</div>
      {label && <span className="text-[10.5px] leading-tight text-muted">{label}</span>}
    </button>
  );
}

function ShapeTile({ kind, label, preview }: { kind: ShapeKind; label: string; preview: ReactNode }) {
  return (
    <Tile
      label={label}
      onClick={() => {
        const t = themeColors();
        const size: Record<ShapeKind, [number, number]> = {
          arch: [300, 380],
          archOutline: [300, 380],
          rect: [360, 240],
          ellipse: [240, 240],
          line: [400, 4],
          arrow: [120, 32],
          scrim: [1080, 600],
        };
        const [w, h] = size[kind];
        const strokeKinds: ShapeKind[] = ['line', 'arrow', 'archOutline'];
        add(
          makeShape(kind, {
            x: (CANVAS.width - w) / 2,
            y: (CANVAS.height - h) / 2,
            width: w,
            height: h,
            fill: kind === 'rect' ? t.card : strokeKinds.includes(kind) ? t.text : t.accent,
            stroke: strokeKinds.includes(kind) ? (kind === 'archOutline' ? t.accent : t.text) : 'transparent',
            strokeWidth: kind === 'line' ? 4 : kind === 'arrow' ? 3 : kind === 'archOutline' ? 3 : 0,
            templateOwned: false,
          }),
        );
      }}
    >
      {preview}
    </Tile>
  );
}
