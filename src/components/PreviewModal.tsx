import { useEffect, useState } from 'react';
import type { RenderCtx } from '../editor/nodes';
import { SlideStage } from '../editor/SlideStage';
import { setState, useEditor } from '../editor/store';
import { AppMark, Icon } from './Icons';
import { Modal, cx } from './ui';

/** Instagram-style preview (4:5 feed) before exporting */
export function PreviewModal({ rc }: { rc: RenderCtx }) {
  const slides = useEditor((s) => s.project?.slides ?? []);
  const currentId = useEditor((s) => s.currentSlideId);
  const handle = useEditor((s) => s.project?.settings.handle ?? '');
  const [i, setI] = useState(() => Math.max(0, slides.findIndex((s) => s.id === currentId)));
  const close = () => setState({ previewOpen: false });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((v) => Math.min(slides.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  const W = Math.min(520, Math.round((window.innerHeight - 220) * 0.8));
  const scale = W / 1080;

  return (
    <Modal onClose={close} className="bg-white">
      <div style={{ width: W }} className="select-none">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <AppMark size={30} />
          <div className="text-[13px] font-semibold">{handle.replace(/^@/, '')}</div>
          <button className="ml-auto rounded p-1 hover:bg-black/5" onClick={close} title="Fechar (Esc)">
            <Icon.close />
          </button>
        </div>
        <div className="relative overflow-hidden bg-black" style={{ width: W, height: W * 1.25 }}>
          <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(${-i * W}px)` }}>
            {slides.map((s) => (
              <div key={s.id} className="shrink-0" style={{ width: W, height: W * 1.25 }}>
                <SlideStage slide={s} rc={rc} scale={scale} />
              </div>
            ))}
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            {i + 1}/{slides.length}
          </div>
          {i > 0 && (
            <button className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow" onClick={() => setI(i - 1)}>
              <Icon.back />
            </button>
          )}
          {i < slides.length - 1 && (
            <button className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow" onClick={() => setI(i + 1)}>
              <Icon.next />
            </button>
          )}
        </div>
        <div className="flex justify-center gap-1 py-3">
          {slides.map((s, k) => (
            <button key={s.id} onClick={() => setI(k)} className={cx('h-1.5 w-1.5 rounded-full', k === i ? 'bg-selection' : 'bg-black/20')} />
          ))}
        </div>
      </div>
    </Modal>
  );
}
