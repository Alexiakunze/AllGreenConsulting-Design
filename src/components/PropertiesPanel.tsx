import type { ReactNode } from 'react';
import { SHADOWS } from '../design-system/designTokens';
import { LOGO_LABELS, LOGO_VARIANTS } from '../design-system/brandAssets';
import { logoHeightFor } from '../templates/elementFactory';
import {
  currentSlide,
  deleteSelected,
  duplicateSelected,
  reorderLayer,
  select,
  setSlideBackground,
  setState,
  toggleFlag,
  updateElement,
  useEditor,
} from '../editor/store';
import type {
  CarouselElement,
  ImageElement,
  LogoElement,
  LogoVariant,
  ShadowStyle,
  ShapeElement,
  TagElement,
  TextElement,
} from '../types/carouselTypes';
import type { BrandPalette } from '../design-system/designTokens';
import { stripMarkup } from '../utils/textLayout';
import { Icon } from './Icons';
import { Button, ColorField, IconButton, Label, NumberField, Section, Segmented, Select, Slider, TextArea, Toggle, cx } from './ui';

const WEIGHTS = [
  { value: '300', label: 'Light 300' },
  { value: '400', label: 'Regular 400' },
  { value: '500', label: 'Medium 500' },
  { value: '600', label: 'SemiBold 600' },
  { value: '700', label: 'Bold 700' },
];

export function PropertiesPanel() {
  const slide = useEditor((s) => currentSlide(s));
  const selectedIds = useEditor((s) => s.selectedIds);
  const palette = useEditor((s) => s.project?.palette);
  if (!slide || !palette) return null;
  const selected = slide.elements.filter((e) => selectedIds.includes(e.id));
  const el = selected.length === 1 ? selected[0] : null;

  return (
    <div>
      {!selected.length && (
        <Section title="Slide">
          <p className="mb-3 text-[11.5px] leading-relaxed text-muted">Clique em um elemento no canvas para editar. Duplo clique em texto para digitar; em imagem para recortar.</p>
          <ColorField label="Fundo" value={slide.background} onChange={(v) => setSlideBackground(slide.id, v)} palette={palette} allowTransparent={false} />
        </Section>
      )}
      {selected.length > 1 && (
        <Section title={`${selected.length} elementos`}>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={duplicateSelected}>
              <Icon.copy /> Duplicar
            </Button>
            <Button variant="danger" onClick={deleteSelected}>
              <Icon.trash /> Excluir
            </Button>
          </div>
        </Section>
      )}
      {el && <ElementProps el={el} palette={palette} />}
      <LayersList elements={slide.elements} selectedIds={selectedIds} />
    </div>
  );
}

function ElementProps({ el, palette }: { el: CarouselElement; palette: BrandPalette }) {
  const set = (patch: Record<string, unknown>, key?: string) => updateElement(el.id, patch, { coalesceKey: key ?? `${el.id}-${Object.keys(patch).join()}` });
  return (
    <>
      <Section
        title={typeLabel(el)}
        actions={
          <div className="flex">
            <IconButton title="Duplicar (⌘/Ctrl+D)" onClick={duplicateSelected}>
              <Icon.copy />
            </IconButton>
            <IconButton title={el.locked ? 'Desbloquear' : 'Bloquear'} onClick={() => toggleFlag(el.id, 'locked')} active={el.locked}>
              {el.locked ? <Icon.lock /> : <Icon.unlock />}
            </IconButton>
            <IconButton title="Ocultar" onClick={() => toggleFlag(el.id, 'hidden')}>
              <Icon.eyeOff />
            </IconButton>
            <IconButton title="Excluir (Delete)" className="text-danger" onClick={deleteSelected}>
              <Icon.trash />
            </IconButton>
          </div>
        }
      >
        {(el.type === 'text' || el.type === 'tag') && el.bind && (
          <div className="mb-3 rounded-md bg-brand-soft px-2.5 py-1.5 text-[11px] text-brand">Ligado ao conteúdo: editar aqui atualiza a aba Conteúdo.</div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={el.x} onChange={(v) => set({ x: v })} />
          <NumberField label="Y" value={el.y} onChange={(v) => set({ y: v })} />
          <NumberField
            label="Largura"
            value={el.width}
            min={4}
            onChange={(v) => set(el.type === 'logo' ? { width: v, height: logoHeightFor(el.variant, v) } : { width: v })}
          />
          <NumberField label="Altura" value={el.height} min={2} onChange={(v) => el.type !== 'text' && set(el.type === 'logo' ? { height: v, width: Math.round((v * el.width) / el.height) } : { height: v })} />
          <NumberField label="Rotação" value={el.rotation} suffix="°" onChange={(v) => set({ rotation: v })} />
          <NumberField label="Opacidade" value={Math.round(el.opacity * 100)} min={0} max={100} suffix="%" onChange={(v) => set({ opacity: v / 100 })} />
        </div>
        {el.type === 'text' && <p className="mt-1.5 text-[10.5px] text-faint">A altura do texto é automática.</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted">Camada</span>
          <div className="flex">
            <IconButton title="Trazer para frente" onClick={() => reorderLayer(el.id, 'top')}>
              <Icon.top />
            </IconButton>
            <IconButton title="Avançar uma" onClick={() => reorderLayer(el.id, 'up')}>
              <Icon.up />
            </IconButton>
            <IconButton title="Recuar uma" onClick={() => reorderLayer(el.id, 'down')}>
              <Icon.down />
            </IconButton>
            <IconButton title="Enviar para trás" onClick={() => reorderLayer(el.id, 'bottom')}>
              <Icon.bottom />
            </IconButton>
          </div>
        </div>
      </Section>

      {el.type === 'text' && <TextProps el={el} palette={palette} set={set} />}
      {el.type === 'tag' && <TagProps el={el} palette={palette} set={set} />}
      {el.type === 'shape' && <ShapeProps el={el} palette={palette} set={set} />}
      {el.type === 'image' && <ImageProps el={el} palette={palette} set={set} />}
      {el.type === 'logo' && <LogoProps el={el} set={set} />}
      <ShadowProps shadow={el.shadow} palette={palette} set={set} />
    </>
  );
}

type Setter = (patch: Record<string, unknown>, key?: string) => void;

function TextProps({ el, palette, set }: { el: TextElement; palette: BrandPalette; set: Setter }) {
  return (
    <Section title="Tipografia">
      <div className="space-y-3">
        <label className="block">
          <Label>Texto (use *asteriscos* para destacar)</Label>
          <TextArea value={el.text} onChange={(v) => set({ text: v }, `${el.id}-text`)} rows={3} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Tamanho" value={el.fontSize} min={8} max={600} suffix="px" onChange={(v) => set({ fontSize: v })} />
          <Select label="Peso" value={String(el.fontWeight)} onChange={(v) => set({ fontWeight: Number(v) })} options={WEIGHTS} />
          <NumberField label="Entrelinha" value={el.lineHeight} step={0.02} precision={2} min={0.6} max={3} onChange={(v) => set({ lineHeight: v })} />
          <NumberField label="Espaçamento" value={Math.round(el.letterSpacing * 1000) / 10} step={0.5} precision={1} suffix="%" onChange={(v) => set({ letterSpacing: v / 100 })} />
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
          <div>
            <Label>Alinhamento</Label>
            <Segmented
              value={el.align}
              onChange={(v) => set({ align: v })}
              options={[
                { value: 'left', label: <Icon.alignLeft />, title: 'Esquerda' },
                { value: 'center', label: <Icon.alignCenter />, title: 'Centro' },
                { value: 'right', label: <Icon.alignRight />, title: 'Direita' },
              ]}
            />
          </div>
          <button
            title="Caixa alta"
            onClick={() => set({ uppercase: !el.uppercase })}
            className={cx('h-8 rounded-md border px-2.5 text-[12px] font-semibold', el.uppercase ? 'border-brand bg-brand-soft text-brand' : 'border-line-strong')}
          >
            AA
          </button>
        </div>
        <ColorField label="Cor" value={el.color} onChange={(v) => set({ color: v })} palette={palette} allowTransparent={false} />
        <ColorField label="Cor do destaque (*palavra*)" value={el.highlightColor} onChange={(v) => set({ highlightColor: v })} palette={palette} allowTransparent={false} />
        <ColorField label="Fundo da caixa" value={el.background ?? 'transparent'} onChange={(v) => set({ background: v, padding: v !== 'transparent' && !el.padding ? 24 : el.padding })} palette={palette} />
        {el.background && el.background !== 'transparent' && (
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Padding" value={el.padding ?? 0} min={0} onChange={(v) => set({ padding: v })} />
            <NumberField label="Raio" value={el.cornerRadius ?? 0} min={0} onChange={(v) => set({ cornerRadius: v })} />
          </div>
        )}
      </div>
    </Section>
  );
}

function TagProps({ el, palette, set }: { el: TagElement; palette: BrandPalette; set: Setter }) {
  return (
    <Section title="Etiqueta">
      <div className="space-y-3">
        <label className="block">
          <Label>Texto</Label>
          <TextArea value={el.text} onChange={(v) => set({ text: v }, `${el.id}-text`)} rows={1} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Tamanho" value={el.fontSize} min={8} suffix="px" onChange={(v) => set({ fontSize: v })} />
          <Select label="Peso" value={String(el.fontWeight)} onChange={(v) => set({ fontWeight: Number(v) })} options={WEIGHTS} />
          <NumberField label="Padding X" value={el.paddingX} min={0} onChange={(v) => set({ paddingX: v })} />
          <NumberField label="Raio" value={el.cornerRadius} min={0} onChange={(v) => set({ cornerRadius: v })} />
          <NumberField label="Borda" value={el.strokeWidth} min={0} onChange={(v) => set({ strokeWidth: v })} />
          <NumberField label="Espaçamento" value={Math.round(el.letterSpacing * 1000) / 10} step={0.5} precision={1} suffix="%" onChange={(v) => set({ letterSpacing: v / 100 })} />
        </div>
        <Toggle checked={!!el.uppercase} onChange={(v) => set({ uppercase: v })} label="Caixa alta" />
        <ColorField label="Texto" value={el.color} onChange={(v) => set({ color: v })} palette={palette} allowTransparent={false} />
        <ColorField label="Preenchimento" value={el.fill} onChange={(v) => set({ fill: v })} palette={palette} />
        <ColorField label="Borda" value={el.stroke} onChange={(v) => set({ stroke: v, strokeWidth: el.strokeWidth || 2 })} palette={palette} />
      </div>
    </Section>
  );
}

function ShapeProps({ el, palette, set }: { el: ShapeElement; palette: BrandPalette; set: Setter }) {
  const strokeOnly = el.shape === 'line' || el.shape === 'arrow' || el.shape === 'archOutline';
  return (
    <Section title="Forma">
      <div className="space-y-3">
        {!strokeOnly && <ColorField label="Preenchimento" value={el.fill} onChange={(v) => set({ fill: v })} palette={palette} />}
        <ColorField label={strokeOnly ? 'Cor da linha' : 'Borda'} value={el.stroke} onChange={(v) => set({ stroke: v, strokeWidth: el.strokeWidth || 2 })} palette={palette} />
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Espessura" value={el.strokeWidth} min={0} onChange={(v) => set({ strokeWidth: v })} />
          {el.shape === 'rect' && <NumberField label="Raio" value={el.cornerRadius} min={0} onChange={(v) => set({ cornerRadius: v })} />}
        </div>
      </div>
    </Section>
  );
}

function ImageProps({ el, palette, set }: { el: ImageElement; palette: BrandPalette; set: Setter }) {
  const cropMode = useEditor((s) => s.cropModeId === el.id);
  return (
    <Section title="Imagem">
      <div className="space-y-3">
        <Button className="w-full" variant={cropMode ? 'primary' : 'secondary'} onClick={() => setState({ cropModeId: cropMode ? null : el.id })}>
          <Icon.crop /> {cropMode ? 'Concluir recorte' : 'Recortar / reposicionar'}
        </Button>
        <div>
          <Label>Máscara</Label>
          <Segmented
            value={el.mask}
            onChange={(v) => set({ mask: v })}
            options={[
              { value: 'rect', label: 'Retângulo' },
              { value: 'arch', label: 'Arco' },
              { value: 'circle', label: 'Círculo' },
            ]}
          />
        </div>
        <Slider label="Zoom" value={el.zoom} min={1} max={4} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set({ zoom: v })} />
        <Slider label="Posição horizontal" value={el.offsetX} min={-1} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}`} onChange={(v) => set({ offsetX: v })} />
        <Slider label="Posição vertical" value={el.offsetY} min={-1} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}`} onChange={(v) => set({ offsetY: v })} />
        {el.mask === 'rect' && <NumberField label="Raio da borda" value={el.cornerRadius} min={0} onChange={(v) => set({ cornerRadius: v })} />}
        <Select
          label="Tratamento All Green"
          value={el.treatment}
          onChange={(v) => set({ treatment: v })}
          options={[
            { value: 'none', label: 'Original' },
            { value: 'mono', label: 'Preto e branco' },
            { value: 'duotone', label: 'Monocromático verde' },
            { value: 'greenTint', label: 'Véu verde' },
          ]}
        />
        <ColorField label="Borda" value={el.stroke} onChange={(v) => set({ stroke: v, strokeWidth: el.strokeWidth || 4 })} palette={palette} />
        {el.stroke !== 'transparent' && <NumberField label="Espessura da borda" value={el.strokeWidth} min={0} onChange={(v) => set({ strokeWidth: v })} />}
      </div>
    </Section>
  );
}

function LogoProps({ el, set }: { el: LogoElement; set: Setter }) {
  return (
    <Section title="Logo">
      <Select
        label="Versão"
        value={el.variant}
        onChange={(v: LogoVariant) => set({ variant: v, height: logoHeightFor(v, el.width) })}
        options={LOGO_VARIANTS.map((v) => ({ value: v, label: LOGO_LABELS[v] }))}
      />
      <p className="mt-2 text-[11px] text-faint">Proporção travada: o logo nunca é deformado.</p>
    </Section>
  );
}

function ShadowProps({ shadow, palette, set }: { shadow?: ShadowStyle; palette: BrandPalette; set: Setter }) {
  const s: ShadowStyle = shadow ?? { ...SHADOWS.soft, enabled: false };
  const upd = (patch: Partial<ShadowStyle>) => set({ shadow: { ...s, ...patch } }, 'shadow');
  return (
    <Section title="Sombra">
      <Toggle checked={s.enabled} onChange={(v) => upd({ enabled: v })} label="Ativar sombra" />
      {s.enabled && (
        <div className="mt-2 space-y-3">
          <Slider label="Desfoque" value={s.blur} min={0} max={120} onChange={(v) => upd({ blur: v })} />
          <Slider label="Deslocamento Y" value={s.offsetY} min={-60} max={60} onChange={(v) => upd({ offsetY: v })} />
          <Slider label="Opacidade" value={s.opacity} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => upd({ opacity: v })} />
          <ColorField value={s.color} onChange={(v) => upd({ color: v })} palette={palette} allowTransparent={false} />
        </div>
      )}
    </Section>
  );
}

function typeLabel(el: CarouselElement) {
  return { text: 'Texto', shape: 'Forma', image: 'Imagem', logo: 'Logo', tag: 'Etiqueta' }[el.type];
}

function LayersList({ elements, selectedIds }: { elements: CarouselElement[]; selectedIds: string[] }) {
  const ordered = [...elements].reverse();
  return (
    <Section title={`Camadas (${elements.length})`}>
      <div className="space-y-0.5">
        {ordered.map((e) => (
          <div
            key={e.id}
            onClick={(ev) => select(ev.shiftKey ? [...selectedIds, e.id] : [e.id])}
            className={cx(
              'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[12px]',
              selectedIds.includes(e.id) ? 'bg-brand-soft text-brand' : 'hover:bg-panel-2',
              e.hidden && 'opacity-45',
            )}
          >
            <LayerIcon el={e} />
            <span className="min-w-0 flex-1 truncate">{layerName(e)}</span>
            <button
              title={e.locked ? 'Desbloquear' : 'Bloquear'}
              className={cx('rounded p-0.5 hover:bg-black/5', !e.locked && 'opacity-0 group-hover:opacity-100')}
              onClick={(ev) => {
                ev.stopPropagation();
                select([e.id]);
                toggleFlag(e.id, 'locked');
              }}
            >
              {e.locked ? <Icon.lock width={13} height={13} /> : <Icon.unlock width={13} height={13} />}
            </button>
            <button
              title={e.hidden ? 'Mostrar' : 'Ocultar'}
              className={cx('rounded p-0.5 hover:bg-black/5', !e.hidden && 'opacity-0 group-hover:opacity-100')}
              onClick={(ev) => {
                ev.stopPropagation();
                toggleFlag(e.id, 'hidden');
              }}
            >
              {e.hidden ? <Icon.eyeOff width={13} height={13} /> : <Icon.eye width={13} height={13} />}
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function layerName(e: CarouselElement) {
  if (e.type === 'text' || e.type === 'tag') {
    const t = stripMarkup(e.text).replace(/\n/g, ' ').trim();
    return `${e.name}${t ? ` — ${t}` : ''}`;
  }
  return e.name;
}

function LayerIcon({ el }: { el: CarouselElement }): ReactNode {
  const p = { width: 13, height: 13, className: 'shrink-0 opacity-60' };
  if (el.type === 'text' || el.type === 'tag') return <Icon.text {...p} />;
  if (el.type === 'image') return <Icon.image {...p} />;
  if (el.type === 'logo') return <Icon.brand {...p} />;
  return <Icon.elements {...p} />;
}
