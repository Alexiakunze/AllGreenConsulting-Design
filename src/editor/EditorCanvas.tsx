import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type Konva from 'konva';
import { Layer, Line, Rect, Stage, Transformer } from 'react-konva';
import { CANVAS, CONTENT_WIDTH, FONTS, LAYOUT, resolveColor } from '../design-system/designTokens';
import { UI_COLORS } from '../design-system/uiTokens';
import type { CarouselElement, TextElement } from '../types/carouselTypes';
import { ElementNode, type RenderCtx } from './nodes';
import {
  currentSlide,
  getState,
  pushHistory,
  select,
  setState,
  updateElement,
  updateElements,
  useEditor,
} from './store';

const M = LAYOUT.safeMargin;

interface Guide {
  orientation: 'v' | 'h';
  pos: number;
}

/** Snap targets: edges, safe margins, center and other elements */
function snapTargets(elements: CarouselElement[], exclude: string[]) {
  const v = [0, M, CANVAS.width / 2, CANVAS.width - M, CANVAS.width];
  const h = [0, M, CANVAS.height / 2, CANVAS.height - M, CANVAS.height];
  elements.forEach((e) => {
    if (exclude.includes(e.id) || e.hidden) return;
    v.push(e.x, e.x + e.width / 2, e.x + e.width);
    h.push(e.y, e.y + e.height / 2, e.y + e.height);
  });
  return { v, h };
}

function computeSnap(box: { x: number; y: number; width: number; height: number }, targets: { v: number[]; h: number[] }, threshold: number) {
  let dx = 0;
  let dy = 0;
  const guides: Guide[] = [];
  let best = threshold + 1;
  for (const edge of [box.x, box.x + box.width / 2, box.x + box.width]) {
    for (const t of targets.v) {
      const d = t - edge;
      if (Math.abs(d) < Math.abs(best) && Math.abs(d) <= threshold) {
        best = d;
        dx = d;
      }
    }
  }
  if (Math.abs(best) <= threshold) {
    [box.x, box.x + box.width / 2, box.x + box.width].forEach((edge) => {
      const t = targets.v.find((tv) => Math.abs(tv - (edge + dx)) < 0.5);
      if (t !== undefined) guides.push({ orientation: 'v', pos: t });
    });
  }
  best = threshold + 1;
  for (const edge of [box.y, box.y + box.height / 2, box.y + box.height]) {
    for (const t of targets.h) {
      const d = t - edge;
      if (Math.abs(d) < Math.abs(best) && Math.abs(d) <= threshold) {
        best = d;
        dy = d;
      }
    }
  }
  if (Math.abs(best) <= threshold) {
    [box.y, box.y + box.height / 2, box.y + box.height].forEach((edge) => {
      const t = targets.h.find((th) => Math.abs(th - (edge + dy)) < 0.5);
      if (t !== undefined) guides.push({ orientation: 'h', pos: t });
    });
  }
  return { dx, dy, guides };
}

export function EditorCanvas({ rc }: { rc: RenderCtx }) {
  const slide = useEditor((s) => currentSlide(s));
  const selectedIds = useEditor((s) => s.selectedIds);
  const editingTextId = useEditor((s) => s.editingTextId);
  const cropModeId = useEditor((s) => s.cropModeId);
  const zoom = useEditor((s) => s.zoom);
  const showGrid = useEditor((s) => s.showGrid);
  const snapOn = useEditor((s) => s.snap);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [box, setBox] = useState({ w: 800, h: 800 });
  const [guides, setGuides] = useState<Guide[]>([]);
  const dragStart = useRef<Record<string, { x: number; y: number }>>({});

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fitScale = Math.max(0.1, Math.min((box.w - 64) / CANVAS.width, (box.h - 64) / CANVAS.height));
  const scale = zoom === 'fit' ? fitScale : zoom;

  useEffect(() => {
    if (getState().effectiveScale !== scale) setState({ effectiveScale: scale });
  }, [scale]);

  // Attaches the transformer to the selected (unlocked) nodes
  const selectedEls = useMemo(() => slide?.elements.filter((e) => selectedIds.includes(e.id)) ?? [], [slide, selectedIds]);
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = selectedEls
      .filter((e) => !e.locked && !e.hidden && e.id !== cropModeId)
      .map((e) => stage.findOne(`#${e.id}`))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedEls, cropModeId, slide]);

  if (!slide) return <div ref={wrapRef} className="flex-1" />;

  const single = selectedEls.length === 1 ? selectedEls[0] : null;
  const onlyTexts = selectedEls.length > 0 && selectedEls.every((e) => e.type === 'text');
  const keepRatio = single?.type === 'logo' || single?.type === 'image' ? single.type === 'logo' : false;
  const anchors = onlyTexts
    ? ['middle-left', 'middle-right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']
    : single?.type === 'logo'
      ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
      : undefined;

  const handlersFor = (el: CarouselElement) => ({
    draggable: !el.locked && editingTextId !== el.id,
    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      const shift = 'shiftKey' in e.evt && (e.evt.shiftKey || e.evt.metaKey);
      if (shift) {
        select(selectedIds.includes(el.id) ? selectedIds.filter((i) => i !== el.id) : [...selectedIds, el.id]);
      } else if (!selectedIds.includes(el.id)) {
        select([el.id]);
      }
    },
    onDblClick: () => {
      if (el.locked) return;
      if (el.type === 'text') setState({ editingTextId: el.id, selectedIds: [el.id] });
      if (el.type === 'image') setState({ cropModeId: cropModeId === el.id ? null : el.id, selectedIds: [el.id] });
    },
    onDragStart: () => {
      const ids = selectedIds.includes(el.id) ? selectedIds : [el.id];
      dragStart.current = {};
      slide.elements.forEach((e) => {
        if (ids.includes(e.id)) dragStart.current[e.id] = { x: e.x, y: e.y };
      });
    },
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const start = dragStart.current[el.id];
      if (!start) return;
      let nx = node.x();
      let ny = node.y();
      if (snapOn && !e.evt.altKey) {
        const ids = Object.keys(dragStart.current);
        const snap = computeSnap({ x: nx, y: ny, width: el.width, height: el.height }, snapTargets(slide.elements, ids), LAYOUT.snapThreshold / Math.min(1, scale));
        nx += snap.dx;
        ny += snap.dy;
        node.position({ x: nx, y: ny });
        setGuides(snap.guides);
      }
      // Moves the other selected elements together
      const dx = nx - start.x;
      const dy = ny - start.y;
      const stage = stageRef.current;
      Object.entries(dragStart.current).forEach(([id, p]) => {
        if (id === el.id) return;
        stage?.findOne(`#${id}`)?.position({ x: p.x + dx, y: p.y + dy });
      });
    },
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const start = dragStart.current[el.id];
      setGuides([]);
      if (!start) return;
      const dx = node.x() - start.x;
      const dy = node.y() - start.y;
      updateElements(
        Object.entries(dragStart.current).map(([id, p]) => ({ id, patch: { x: Math.round(p.x + dx), y: Math.round(p.y + dy) } })),
      );
      dragStart.current = {};
    },
    onTransformStart: () => pushHistory(),
    onTransform: (e: Konva.KonvaEventObject<Event>) => {
      // Text: reflows live instead of stretching
      if (el.type !== 'text') return;
      const node = e.target;
      const anchor = trRef.current?.getActiveAnchor() ?? '';
      const sx = node.scaleX();
      node.scale({ x: 1, y: 1 });
      if (anchor.startsWith('middle')) {
        updateElement(el.id, { x: Math.round(node.x()), width: Math.max(40, Math.round(el.width * sx)) }, { history: false });
      } else {
        updateElement(
          el.id,
          {
            x: Math.round(node.x()),
            y: Math.round(node.y()),
            width: Math.max(40, Math.round(el.width * sx)),
            fontSize: Math.max(8, Math.round(el.fontSize * sx * 10) / 10),
          },
          { history: false },
        );
      }
    },
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const sx = node.scaleX();
      const sy = node.scaleY();
      node.scale({ x: 1, y: 1 });
      const base = { x: Math.round(node.x()), y: Math.round(node.y()), rotation: Math.round(node.rotation() * 10) / 10 };
      if (el.type === 'text') {
        updateElement(el.id, base, { history: false });
        return;
      }
      if (el.type === 'tag') {
        const corner = !(trRef.current?.getActiveAnchor() ?? '').startsWith('middle');
        updateElement(
          el.id,
          {
            ...base,
            width: Math.max(20, Math.round(el.width * sx)),
            height: Math.max(20, Math.round(el.height * sy)),
            ...(corner ? { fontSize: Math.max(8, Math.round(el.fontSize * sy)), paddingX: Math.round(el.paddingX * sx) } : {}),
          },
          { history: false },
        );
        return;
      }
      updateElement(
        el.id,
        { ...base, width: Math.max(4, Math.round(el.width * sx)), height: Math.max(2, Math.round(el.height * sy)) },
        { history: false },
      );
    },
  });

  const editingEl = slide.elements.find((e) => e.id === editingTextId && e.type === 'text') as TextElement | undefined;
  const stageW = CANVAS.width * scale;
  const stageH = CANVAS.height * scale;
  const colW = (CONTENT_WIDTH - LAYOUT.gutter * (LAYOUT.columns - 1)) / LAYOUT.columns;

  return (
    <div
      ref={wrapRef}
      className="canvas-bg relative flex-1 overflow-auto"
      onMouseDown={(e) => {
        if (e.target === wrapRef.current || (e.target as HTMLElement).dataset.canvasPad) select([]);
      }}
      onWheel={(e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        const next = Math.max(0.15, Math.min(2, scale * (e.deltaY < 0 ? 1.08 : 0.92)));
        setState({ zoom: Math.round(next * 100) / 100 });
      }}
    >
      <div data-canvas-pad="1" className="flex min-h-full min-w-full items-center justify-center p-8" style={{ width: Math.max(box.w, stageW + 64), height: Math.max(box.h, stageH + 64) }}>
        <div className="relative shadow-[0_24px_80px_-24px_rgba(12,46,43,0.35)]" style={{ width: stageW, height: stageH }}>
          <Stage
            ref={stageRef}
            width={stageW}
            height={stageH}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage() || e.target.name() === 'background') {
                select([]);
                setState({ cropModeId: null });
              }
            }}
          >
            <Layer>
              <Rect name="background" width={CANVAS.width} height={CANVAS.height} fill={resolveColor(slide.background, rc.palette)} />
              {slide.elements
                .filter((e) => !e.hidden)
                .map((el) => (
                  <ElementNode
                    key={el.id}
                    el={el}
                    rc={rc}
                    handlers={handlersFor(el)}
                    hideText={editingTextId === el.id}
                    cropMode={cropModeId === el.id}
                    onCropChange={(ox, oy) => updateElement(el.id, { offsetX: ox, offsetY: oy })}
                  />
                ))}
            </Layer>
            <Layer listening={false}>
              {showGrid && (
                <>
                  {Array.from({ length: LAYOUT.columns }).map((_, i) => (
                    <Rect key={i} x={M + i * (colW + LAYOUT.gutter)} y={0} width={colW} height={CANVAS.height} fill={UI_COLORS.gridColumn} />
                  ))}
                  <Rect x={M} y={M} width={CANVAS.width - M * 2} height={CANVAS.height - M * 2} stroke={UI_COLORS.safeMargin} strokeWidth={2 / scale} dash={[10 / scale, 8 / scale]} />
                  <Line points={[CANVAS.width / 2, 0, CANVAS.width / 2, CANVAS.height]} stroke={UI_COLORS.gridLine} strokeWidth={1 / scale} />
                  <Line points={[0, CANVAS.height / 2, CANVAS.width, CANVAS.height / 2]} stroke={UI_COLORS.gridLine} strokeWidth={1 / scale} />
                  {Array.from({ length: Math.floor(CANVAS.height / 90) }).map((_, i) => (
                    <Line key={`b${i}`} points={[0, (i + 1) * 90, CANVAS.width, (i + 1) * 90]} stroke={UI_COLORS.gridBaseline} strokeWidth={1 / scale} />
                  ))}
                </>
              )}
              {guides.map((g, i) =>
                g.orientation === 'v' ? (
                  <Line key={i} points={[g.pos, 0, g.pos, CANVAS.height]} stroke={UI_COLORS.guide} strokeWidth={1.5 / scale} dash={[6 / scale, 4 / scale]} />
                ) : (
                  <Line key={i} points={[0, g.pos, CANVAS.width, g.pos]} stroke={UI_COLORS.guide} strokeWidth={1.5 / scale} dash={[6 / scale, 4 / scale]} />
                ),
              )}
              {selectedEls
                .filter((e) => e.locked)
                .map((e) => (
                  <Rect key={e.id} x={e.x} y={e.y} width={e.width} height={e.height} rotation={e.rotation} stroke={UI_COLORS.locked} strokeWidth={1.5 / scale} dash={[4 / scale, 4 / scale]} />
                ))}
              {cropModeId &&
                selectedEls
                  .filter((e) => e.id === cropModeId)
                  .map((e) => (
                    <Rect key={e.id} x={e.x} y={e.y} width={e.width} height={e.height} rotation={e.rotation} stroke={UI_COLORS.crop} strokeWidth={2 / scale} dash={[8 / scale, 6 / scale]} />
                  ))}
            </Layer>
            <Layer>
              <Transformer
                ref={trRef}
                rotateEnabled
                keepRatio={keepRatio || undefined}
                enabledAnchors={anchors}
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                rotationSnapTolerance={4}
                anchorSize={9}
                anchorCornerRadius={2}
                anchorStroke={UI_COLORS.selection}
                anchorFill="#ffffff"
                borderStroke={UI_COLORS.selection}
                borderStrokeWidth={1.5}
                padding={2}
                ignoreStroke
                flipEnabled={false}
                boundBoxFunc={(oldBox, newBox) => (newBox.width < 8 || newBox.height < 4 ? oldBox : newBox)}
              />
            </Layer>
          </Stage>
          {editingEl && <InlineTextEditor el={editingEl} scale={scale} rc={rc} />}
          {cropModeId && (
            <div className="pointer-events-none absolute -top-9 left-0 rounded-full bg-[var(--ui-ink)] px-3 py-1 text-xs text-white">
              Modo recorte: arraste a imagem dentro do quadro · duplo clique para sair
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InlineTextEditor({ el, scale, rc }: { el: TextElement; scale: number; rc: RenderCtx }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(el.text);
  const valueRef = useRef(el.text);
  const cancelled = useRef(false);
  useEffect(() => {
    const t = ref.current;
    if (t) {
      t.focus();
      t.select();
    }
    // Commits on close too (clicking the canvas closes the editor before the blur)
    const id = el.id;
    const original = el.text;
    return () => {
      if (!cancelled.current && valueRef.current !== original) updateElement(id, { text: valueRef.current });
    };
  }, []);
  const change = (v: string) => {
    valueRef.current = v;
    setValue(v);
  };
  const commit = () => setState({ editingTextId: null });
  const pad = (el.padding ?? 0) * scale;
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => change(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          cancelled.current = true;
          setState({ editingTextId: null });
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
      }}
      spellCheck={false}
      className="absolute resize-none overflow-hidden border-0 bg-transparent outline outline-2 outline-[var(--ui-selection)]"
      style={{
        left: el.x * scale,
        top: el.y * scale,
        width: el.width * scale,
        height: Math.max(el.height, el.fontSize * el.lineHeight * (value.split('\n').length + 0.2)) * scale,
        padding: pad,
        fontFamily: `"${FONTS.primary}", ${FONTS.fallback}`,
        fontSize: el.fontSize * scale,
        fontWeight: el.fontWeight,
        lineHeight: el.lineHeight,
        letterSpacing: `${el.letterSpacing}em`,
        textAlign: el.align,
        textTransform: el.uppercase ? 'uppercase' : 'none',
        color: resolveColor(el.color, rc.palette),
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: 'top left',
        caretColor: resolveColor(el.highlightColor, rc.palette),
      }}
    />
  );
}
