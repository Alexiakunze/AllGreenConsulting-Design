import { memo, useState } from 'react';
import type { RenderCtx } from '../editor/nodes';
import { SlideStage } from '../editor/SlideStage';
import { addSlide, deleteSlide, duplicateSlide, moveSlide, selectSlide, useEditor } from '../editor/store';
import { TEMPLATES } from '../templates/templates';
import type { Slide } from '../types/carouselTypes';
import { Icon } from './Icons';
import { cx } from './ui';

const THUMB_SCALE = 0.105;

const Thumb = memo(function Thumb({ slide, rc }: { slide: Slide; rc: RenderCtx }) {
  return <SlideStage slide={slide} rc={rc} scale={THUMB_SCALE} />;
});

export function Timeline({ rc }: { rc: RenderCtx }) {
  const slides = useEditor((s) => s.project?.slides ?? []);
  const current = useEditor((s) => s.currentSlideId);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  return (
    <div className="shrink-0 border-t border-line bg-panel">
      <div className="scroll-thin flex items-end gap-3 overflow-x-auto px-4 pb-3 pt-2.5">
        {slides.map((s, i) => (
          <div
            key={s.id}
            draggable
            onDragStart={(e) => {
              setDragIndex(i);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(i);
            }}
            onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) moveSlide(dragIndex, i);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={cx('group relative shrink-0 cursor-pointer', dragIndex === i && 'opacity-40')}
            onClick={() => selectSlide(s.id)}
            title={`${s.name} · ${TEMPLATES[s.template].name}`}
          >
            {overIndex === i && dragIndex !== null && dragIndex !== i && (
              <div className={cx('absolute top-0 bottom-6 w-[3px] rounded bg-selection', dragIndex > i ? '-left-2' : '-right-2')} />
            )}
            <div
              className={cx(
                'overflow-hidden rounded-md ring-offset-2 transition-shadow',
                s.id === current ? 'ring-2 ring-brand' : 'ring-1 ring-line hover:ring-line-strong',
              )}
            >
              <Thumb slide={s} rc={rc} />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10.5px]">
              <span className={cx('font-semibold tabular-nums', s.id === current ? 'text-brand' : 'text-muted')}>{String(i + 1).padStart(2, '0')}</span>
              <span className="max-w-[70px] truncate text-faint">{TEMPLATES[s.template].name}</span>
            </div>
            <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                title="Duplicar slide"
                className="rounded bg-white/90 p-0.5 shadow hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateSlide(s.id);
                }}
              >
                <Icon.copy width={12} height={12} />
              </button>
              <button
                title="Excluir slide"
                className="rounded bg-white/90 p-0.5 text-danger shadow hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSlide(s.id);
                }}
              >
                <Icon.trash width={12} height={12} />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => addSlide('text', current)}
          title="Adicionar slide"
          className="mb-[22px] flex shrink-0 items-center justify-center rounded-md border border-dashed border-line-strong text-muted hover:border-brand hover:text-brand"
          style={{ width: 1080 * THUMB_SCALE, height: 1350 * THUMB_SCALE }}
        >
          <Icon.plus width={20} height={20} />
        </button>
      </div>
    </div>
  );
}
