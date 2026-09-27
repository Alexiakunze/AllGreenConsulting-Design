import { useMemo, useState } from 'react';
import { EditorCanvas } from '../editor/EditorCanvas';
import type { RenderCtx } from '../editor/nodes';
import {
  autoLayout,
  goDashboard,
  redo,
  renameProject,
  saveNow,
  setState,
  undo,
  useEditor,
  type LeftTab,
} from '../editor/store';
import { AppMark, Icon } from './Icons';
import { ContentPanel } from './panels/ContentPanel';
import { SlidesPanel } from './panels/SlidesPanel';
import { BrandPanel } from './panels/BrandPanel';
import { ElementsPanel } from './panels/ElementsPanel';
import { ExportPanel } from './panels/ExportPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { Timeline } from './Timeline';
import { PreviewModal } from './PreviewModal';
import { ExportDialog } from './ExportDialog';
import { Button, IconButton, cx } from './ui';

const TABS: Array<{ id: LeftTab; label: string; icon: keyof typeof Icon }> = [
  { id: 'content', label: 'Conteúdo', icon: 'content' },
  { id: 'slides', label: 'Slides', icon: 'slides' },
  { id: 'brand', label: 'Identidade', icon: 'brand' },
  { id: 'elements', label: 'Elementos', icon: 'elements' },
  { id: 'export', label: 'Exportar', icon: 'export' },
];

export function useRenderCtx(): RenderCtx | null {
  const project = useEditor((s) => s.project);
  const logos = useEditor((s) => s.brandLogos);
  const palette = project?.palette;
  const assets = project?.assets;
  const grain = project?.settings.grain ?? 0;
  return useMemo(() => (palette && assets ? { palette, assets, logos, grain } : null), [palette, assets, logos, grain]);
}

export function EditorView() {
  const rc = useRenderCtx();
  const tab = useEditor((s) => s.leftTab);
  const previewOpen = useEditor((s) => s.previewOpen);
  const exportOpen = useEditor((s) => s.exportOpen);
  if (!rc) return null;
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-[68px] shrink-0 flex-col items-center gap-1 border-r border-line bg-panel py-3">
          {TABS.map((t) => {
            const I = Icon[t.icon];
            return (
              <button
                key={t.id}
                onClick={() => setState({ leftTab: t.id })}
                className={cx(
                  'flex w-[58px] flex-col items-center gap-1 rounded-lg py-2 text-[10.5px] font-medium transition-colors',
                  tab === t.id ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-black/5 hover:text-ink',
                )}
              >
                <I width={18} height={18} />
                {t.label}
              </button>
            );
          })}
        </nav>
        <aside className="scroll-thin w-[300px] shrink-0 overflow-y-auto border-r border-line bg-panel">
          {tab === 'content' && <ContentPanel />}
          {tab === 'slides' && <SlidesPanel />}
          {tab === 'brand' && <BrandPanel />}
          {tab === 'elements' && <ElementsPanel />}
          {tab === 'export' && <ExportPanel />}
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <EditorCanvas rc={rc} />
          <Timeline rc={rc} />
        </div>
        <aside className="scroll-thin w-[288px] shrink-0 overflow-y-auto border-l border-line bg-panel">
          <PropertiesPanel />
        </aside>
      </div>
      {previewOpen && <PreviewModal rc={rc} />}
      {exportOpen && <ExportDialog />}
    </div>
  );
}

function TopBar() {
  const project = useEditor((s) => s.project)!;
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const zoom = useEditor((s) => s.zoom);
  const scale = useEditor((s) => s.effectiveScale);
  const showGrid = useEditor((s) => s.showGrid);
  const snap = useEditor((s) => s.snap);
  const saving = useEditor((s) => s.saving);
  const dirty = useEditor((s) => s.dirty);
  const currentSlideId = useEditor((s) => s.currentSlideId);
  const [editingName, setEditingName] = useState(false);

  const setZoom = (z: number | 'fit') => setState({ zoom: z });
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-panel px-3">
      <div className="flex min-w-0 items-center gap-2">
        <IconButton title="Voltar aos projetos" onClick={goDashboard}>
          <Icon.back />
        </IconButton>
        <AppMark size={24} />
        {editingName ? (
          <input
            autoFocus
            defaultValue={project.name}
            onBlur={(e) => {
              renameProject(e.target.value.trim() || project.name);
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="h-7 w-72 rounded border border-brand px-2 text-[13px] font-semibold outline-none"
          />
        ) : (
          <button className="max-w-[280px] truncate rounded px-2 py-1 text-[13px] font-semibold hover:bg-black/5" title="Renomear projeto" onClick={() => setEditingName(true)}>
            {project.name}
          </button>
        )}
        <span className="whitespace-nowrap text-[11px] text-faint">{saving ? 'Salvando…' : dirty ? 'Alterações não salvas' : 'Salvo'}</span>
      </div>

      <div className="flex items-center gap-1">
        <IconButton title="Desfazer (⌘/Ctrl+Z)" disabled={!canUndo} onClick={undo}>
          <Icon.undo />
        </IconButton>
        <IconButton title="Refazer (⌘/Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}>
          <Icon.redo />
        </IconButton>
        <div className="mx-2 h-5 w-px bg-line" />
        <IconButton title="Diminuir zoom" onClick={() => setZoom(Math.max(0.15, Math.round((scale - 0.1) * 100) / 100))}>
          −
        </IconButton>
        <button className="h-7 w-14 rounded text-[12px] tabular-nums hover:bg-black/5" title="Ajustar à tela" onClick={() => setZoom('fit')}>
          {zoom === 'fit' ? 'Ajustar' : `${Math.round(scale * 100)}%`}
        </button>
        <IconButton title="Aumentar zoom" onClick={() => setZoom(Math.min(2, Math.round((scale + 0.1) * 100) / 100))}>
          +
        </IconButton>
        <button className="h-7 rounded px-2 text-[12px] hover:bg-black/5" title="Tamanho real (1080×1350)" onClick={() => setZoom(1)}>
          100%
        </button>
        <div className="mx-2 h-5 w-px bg-line" />
        <IconButton title="Mostrar grid e margem segura (G)" active={showGrid} onClick={() => setState({ showGrid: !showGrid })}>
          <Icon.grid />
        </IconButton>
        <IconButton title="Snap / alinhamento magnético" active={snap} onClick={() => setState({ snap: !snap })}>
          <Icon.magnet />
        </IconButton>
      </div>

      <div className="flex items-center gap-2">
        <Button title="Reorganiza headline, texto, número, imagem e elementos no grid — sem alterar o texto" onClick={() => autoLayout(currentSlideId)}>
          <Icon.wand /> Organizar layout
        </Button>
        <Button onClick={() => setState({ previewOpen: true })}>
          <Icon.play /> Pré-visualizar
        </Button>
        <Button onClick={() => void saveNow()} title="Salvar (⌘/Ctrl+S)">
          <Icon.save /> Salvar
        </Button>
        <Button variant="primary" onClick={() => setState({ exportOpen: true })}>
          <Icon.export /> Exportar carrossel
        </Button>
      </div>
    </header>
  );
}
