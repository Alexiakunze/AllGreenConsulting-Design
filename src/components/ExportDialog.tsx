import { useState } from 'react';
import { exportAllSlides, exportCurrentSlide } from '../export/exportPng';
import { getState, setState, slugify, toast, useEditor } from '../editor/store';
import { pad2 } from '../utils/id';
import { Icon } from './Icons';
import { Button, Modal, cx } from './ui';

export function ExportDialog() {
  const project = useEditor((s) => s.project)!;
  const currentId = useEditor((s) => s.currentSlideId);
  const [mode, setMode] = useState<'current' | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const close = () => !busy && setState({ exportOpen: false });
  const idx = project.slides.findIndex((s) => s.id === currentId);

  const run = async () => {
    const logos = getState().brandLogos;
    try {
      if (mode === 'current' && currentId) {
        setBusy('Renderizando…');
        await exportCurrentSlide(project, currentId, logos);
      } else {
        setBusy(`0 / ${project.slides.length}`);
        await exportAllSlides(project, logos, (d, t) => setBusy(`${d} / ${t}`), slugify(project.name));
      }
      toast('Exportação concluída.');
      setState({ exportOpen: false });
    } catch (e) {
      console.error(e);
      toast('Falha na exportação.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal onClose={close} className="w-[460px]">
      <div className="p-6">
        <div className="eyebrow">Exportar carrossel</div>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight">PNG · 1080 × 1350 px</h2>
        <div className="mt-5 space-y-2">
          <Option active={mode === 'current'} onClick={() => setMode('current')} title="Exportar slide atual" detail={`${pad2(idx + 1)}.png`} />
          <Option active={mode === 'all'} onClick={() => setMode('all')} title="Exportar todos os slides" detail={`ZIP com ${project.slides.map((_, i) => `${pad2(i + 1)}.png`).slice(0, 4).join(', ')}${project.slides.length > 4 ? '…' : ''}`} />
        </div>
        <p className="mt-4 text-[11.5px] leading-relaxed text-muted">A renderização é feita direto do canvas em resolução final — não é captura de tela.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={close} disabled={!!busy}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void run()} disabled={!!busy}>
            <Icon.export /> {busy ?? 'Exportar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Option({ active, onClick, title, detail }: { active: boolean; onClick: () => void; title: string; detail: string }) {
  return (
    <button onClick={onClick} className={cx('flex w-full items-center gap-3 rounded-lg border p-3 text-left', active ? 'border-brand bg-brand-soft' : 'border-line hover:bg-panel-2')}>
      <span className={cx('flex h-4 w-4 items-center justify-center rounded border', active ? 'border-brand bg-brand' : 'border-line-strong')}>
        {active && <span className="h-1.5 w-1.5 rounded-sm bg-white" />}
      </span>
      <span>
        <span className="block text-[13px] font-semibold">{title}</span>
        <span className="block text-[11.5px] text-muted">{detail}</span>
      </span>
    </button>
  );
}
