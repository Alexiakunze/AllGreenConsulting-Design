import { useEffect, useState } from 'react';
import { exportAllSlides, exportCurrentSlide, type ExportedFile } from '../export/exportPng';
import { getState, setState, slugify, toast, useEditor } from '../editor/store';
import { pad2 } from '../utils/id';
import { saveFile } from '../utils/download';
import { Icon } from './Icons';
import { Button, Modal, cx } from './ui';

export function ExportDialog() {
  const project = useEditor((s) => s.project)!;
  const currentId = useEditor((s) => s.currentSlideId);
  const [mode, setMode] = useState<'current' | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [files, setFiles] = useState<Array<ExportedFile & { url: string }> | null>(null);
  const close = () => !busy && setState({ exportOpen: false });
  const idx = project.slides.findIndex((s) => s.id === currentId);

  useEffect(() => () => files?.forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  const run = async () => {
    const logos = getState().brandLogos;
    try {
      let out: ExportedFile[];
      if (mode === 'current' && currentId) {
        setBusy('Renderizando…');
        out = await exportCurrentSlide(project, currentId, logos);
      } else {
        setBusy(`0 / ${project.slides.length}`);
        out = await exportAllSlides(project, logos, (d, t) => setBusy(`${d} / ${t}`), slugify(project.name));
      }
      setFiles(out.map((f) => ({ ...f, url: URL.createObjectURL(f.blob) })));
      toast('Exportação concluída.');
    } catch (e) {
      console.error(e);
      toast('Falha na exportação.');
    } finally {
      setBusy(null);
    }
  };

  if (files) {
    return (
      <Modal onClose={close} className="w-[min(920px,92vw)]">
        <div className="p-6">
          <div className="eyebrow">Arquivos gerados · 1080 × 1350 px</div>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight">{files.length === 1 ? files[0].name : `${files.length} PNGs`}</h2>
          <p className="mt-2 max-w-[62ch] text-[12px] leading-relaxed text-muted">
            Confirme o download quando o navegador pedir. Você também pode baixar cada PNG individualmente abaixo, ou clicar com o botão direito na imagem e escolher
            <b className="text-ink"> Salvar imagem como…</b> (sai em resolução total).
          </p>
          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
            {files.map((f) => (
              <figure key={f.name} className="m-0">
                <img src={f.url} alt={f.name} className="w-full rounded-md ring-1 ring-line" />
                <figcaption className="mt-1.5 flex items-center justify-between text-[11.5px]">
                  <span className="font-semibold tabular-nums">{f.name}</span>
                  <button onClick={() => void saveFile(f.blob, f.name)} className="text-brand hover:underline">
                    Baixar
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={() => setFiles(null)}>Exportar de novo</Button>
            <Button variant="primary" onClick={close}>
              Concluir
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

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
