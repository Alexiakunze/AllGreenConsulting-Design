import { useRef } from 'react';
import { COLOR_LABELS, TYPE_SCALE, type ColorToken } from '../../design-system/designTokens';
import { LOGO_LABELS, LOGO_VARIANTS } from '../../design-system/brandAssets';
import { fileToAsset, resetPalette, setBrandLogo, setPaletteColor, updateSettings, useEditor } from '../../editor/store';
import type { LogoVariant } from '../../types/carouselTypes';
import { Button, Label, Section, Slider, TextInput, Toggle } from '../ui';

const TOKENS: ColorToken[] = ['primary', 'secondary', 'dark', 'light', 'white', 'accent', 'text', 'muted', 'sand'];

export function BrandPanel() {
  const project = useEditor((s) => s.project)!;
  const logos = useEditor((s) => s.brandLogos);
  const settings = project.settings;

  return (
    <div>
      <Section title="Estilo visual">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['movement', 'Movimento', 'Tipografia gigante em caixa alta, moldura de pôster, grão e fotos P&B — inspirado em Dunamis / Big Wave.'],
              ['editorial', 'Editorial', 'Composição clássica, arco em destaque, headlines em caixa baixa.'],
            ] as const
          ).map(([id, label, desc]) => (
            <button
              key={id}
              onClick={() => settings.style !== id && updateSettings({ style: id, grain: id === 'movement' ? Math.max(settings.grain, 0.22) : 0 })}
              className={`rounded-lg border p-3 text-left ${settings.style === id ? 'border-brand bg-brand-soft' : 'border-line hover:bg-panel-2'}`}
            >
              <div className="text-[12.5px] font-semibold">{label}</div>
              <div className="mt-1 text-[11px] leading-snug text-muted">{desc}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-faint">Trocar o estilo reorganiza todos os slides (o texto não muda).</p>
        <div className="mt-3">
          <Slider label="Grão / textura" value={settings.grain} min={0} max={0.6} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => updateSettings({ grain: v })} />
        </div>
      </Section>

      <Section
        title="Cores (tokens)"
        actions={
          <button className="text-[11.5px] text-brand hover:underline" onClick={resetPalette}>
            Restaurar oficiais
          </button>
        }
      >
        <p className="mb-3 text-[11.5px] leading-relaxed text-muted">
          Alterar uma cor aqui atualiza todos os slides que usam o token. Valores oficiais extraídos dos arquivos de logo da All Green.
        </p>
        <div className="space-y-2">
          {TOKENS.map((t) => (
            <div key={t} className="flex items-center gap-2.5">
              <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-black/10" style={{ background: project.palette[t] }}>
                <input type="color" value={project.palette[t]} onChange={(e) => setPaletteColor(t, e.target.value.toUpperCase())} className="absolute inset-0 opacity-0" />
              </label>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium leading-tight">{COLOR_LABELS[t]}</div>
                <div className="font-mono text-[10.5px] text-faint">
                  {t} · {project.palette[t]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Logos oficiais">
        <p className="mb-3 text-[11.5px] leading-relaxed text-muted">
          Coloque os PNGs da pasta <b className="text-ink">Identidade Visual › PNG</b> em <code className="rounded bg-panel-2 px-1">public/brand</code> ou envie aqui. Enquanto não houver arquivo, é usada uma assinatura provisória.
        </p>
        <div className="space-y-2">
          {LOGO_VARIANTS.map((v) => (
            <LogoSlot key={v} variant={v} src={logos[v]?.src} />
          ))}
        </div>
      </Section>

      <Section title="Tipografia · Space Grotesk">
        <div className="space-y-2.5">
          {(
            [
              ['headline', 'Headline'],
              ['subheadline', 'Subheadline'],
              ['body', 'Body'],
              ['eyebrow', 'Eyebrow'],
              ['number', 'Números'],
            ] as const
          ).map(([k, label]) => {
            const s = TYPE_SCALE[k];
            return (
              <div key={k} className="flex items-baseline justify-between gap-2 border-b border-line pb-2 last:border-0">
                <span style={{ fontWeight: s.fontWeight, fontSize: Math.min(22, s.fontSize / 4), letterSpacing: `${s.letterSpacing}em`, textTransform: k === 'eyebrow' ? 'uppercase' : undefined }}>{label}</span>
                <span className="shrink-0 font-mono text-[10.5px] text-faint">
                  {s.fontSize}px · {s.fontWeight} · {s.lineHeight}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Elementos recorrentes">
        <div className="space-y-3">
          <label className="block">
            <Label>Cabeçalho (editoria padrão)</Label>
            <TextInput value={settings.eyebrowDefault} onChange={(v) => updateSettings({ eyebrowDefault: v })} />
          </label>
          <label className="block">
            <Label>@ / handle do rodapé</Label>
            <TextInput value={settings.handle} onChange={(v) => updateSettings({ handle: v })} />
          </label>
          <div className="rounded-md bg-panel-2 px-3 py-1">
            <Toggle checked={settings.showHeader} onChange={(v) => updateSettings({ showHeader: v })} label="Cabeçalho em todos os slides" />
            <Toggle checked={settings.showCounter} onChange={(v) => updateSettings({ showCounter: v })} label="Contador 01 / 08" />
            <Toggle checked={settings.showFooter} onChange={(v) => updateSettings({ showFooter: v })} label="Rodapé com @ e seta" />
          </div>
          <p className="text-[11px] text-faint">Ligar/desligar reorganiza o layout dos slides.</p>
        </div>
      </Section>
    </div>
  );
}

function LogoSlot({ variant, src }: { variant: LogoVariant; src?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const dark = variant.endsWith('Negative');
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-line ${dark ? 'bg-brand' : 'bg-panel-2'}`}>
        {src ? <img src={src} alt="" className="max-h-7 max-w-14 object-contain" /> : <span className={`text-[9px] ${dark ? 'text-white/60' : 'text-faint'}`}>provisório</span>}
      </div>
      <div className="min-w-0 flex-1 text-[11.5px] leading-tight">{LOGO_LABELS[variant]}</div>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/webp,image/jpeg"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          const a = await fileToAsset(f, 'logo');
          if (a) await setBrandLogo(variant, a);
        }}
      />
      <Button size="sm" onClick={() => ref.current?.click()}>
        {src ? 'Trocar' : 'Enviar'}
      </Button>
    </div>
  );
}
