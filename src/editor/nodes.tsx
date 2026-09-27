import { useMemo } from 'react';
import type Konva from 'konva';
import { Arrow, Ellipse, Group, Image as KImage, Line, Rect, Shape, Text } from 'react-konva';
import { FONTS, resolveColor, type BrandPalette } from '../design-system/designTokens';
import type {
  Asset,
  CarouselElement,
  ImageElement,
  LogoElement,
  LogoVariant,
  ShadowStyle,
  ShapeElement,
  TagElement,
  TextElement,
} from '../types/carouselTypes';
import { layoutText } from '../utils/textLayout';
import { useImage } from './imageCache';

export interface RenderCtx {
  palette: BrandPalette;
  assets: Record<string, Asset>;
  logos: Partial<Record<LogoVariant, Asset>>;
}

const FONT_FAMILY = `${FONTS.primary}, ${FONTS.fallback}`;

function shadowProps(s: ShadowStyle | undefined, palette: BrandPalette) {
  if (!s?.enabled) return {};
  return {
    shadowColor: resolveColor(s.color, palette),
    shadowBlur: s.blur,
    shadowOffsetX: s.offsetX,
    shadowOffsetY: s.offsetY,
    shadowOpacity: s.opacity,
  };
}

// ───────────────────────────────────────── geometry (masks)

type Ctx2D = Konva.Context | CanvasRenderingContext2D;

export function archPath(ctx: Ctx2D, w: number, h: number, close = true) {
  const r = Math.min(w / 2, h);
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, r);
  ctx.arc(w / 2, r, w / 2, Math.PI, 0, false);
  ctx.lineTo(w, h);
  if (close) ctx.closePath();
}

export function roundRectPath(ctx: Ctx2D, w: number, h: number, radius: number) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);
  ctx.lineTo(w, h - r);
  ctx.arcTo(w, h, w - r, h, r);
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
}

function maskPath(ctx: Ctx2D, el: ImageElement) {
  if (el.mask === 'arch') archPath(ctx, el.width, el.height);
  else if (el.mask === 'circle') {
    ctx.beginPath();
    ctx.ellipse(el.width / 2, el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
    ctx.closePath();
  } else roundRectPath(ctx, el.width, el.height, el.cornerRadius);
}

// ───────────────────────────────────────── text

function TextContent({ el, rc, hideText }: { el: TextElement; rc: RenderCtx; hideText?: boolean }) {
  const pad = el.padding ?? 0;
  const layout = useMemo(
    () =>
      layoutText({
        text: el.text,
        fontSize: el.fontSize,
        fontWeight: el.fontWeight,
        lineHeight: el.lineHeight,
        letterSpacing: el.letterSpacing,
        width: Math.max(10, el.width - pad * 2),
        align: el.align,
        uppercase: el.uppercase,
      }),
    [el.text, el.fontSize, el.fontWeight, el.lineHeight, el.letterSpacing, el.width, el.align, el.uppercase, pad],
  );
  const color = resolveColor(el.color, rc.palette);
  const hl = resolveColor(el.highlightColor, rc.palette);
  const shadow = shadowProps(el.shadow, rc.palette);
  const hasBg = el.background && el.background !== 'transparent';
  return (
    <>
      <Rect
        width={el.width}
        height={el.height}
        fill={hasBg ? resolveColor(el.background, rc.palette) : 'rgba(0,0,0,0)'}
        cornerRadius={el.cornerRadius ?? 0}
        {...(hasBg ? shadow : {})}
      />
      {!hideText &&
        layout.lines.flatMap((line, li) =>
          line.runs.map((run, ri) => (
            <Text
              key={`${li}-${ri}`}
              text={run.text}
              x={pad + run.x}
              y={pad + line.y}
              fontSize={el.fontSize}
              fontFamily={FONT_FAMILY}
              fontStyle={String(el.fontWeight)}
              letterSpacing={el.letterSpacing * el.fontSize}
              lineHeight={el.lineHeight}
              fill={run.highlight ? hl : color}
              listening={false}
              perfectDrawEnabled={false}
              {...(hasBg ? {} : shadow)}
            />
          )),
        )}
    </>
  );
}

// ───────────────────────────────────────── shapes

function ShapeContent({ el, rc }: { el: ShapeElement; rc: RenderCtx }) {
  const fill = resolveColor(el.fill, rc.palette);
  const stroke = resolveColor(el.stroke, rc.palette);
  const shadow = shadowProps(el.shadow, rc.palette);
  const { width: w, height: h } = el;
  const hit = <Rect width={w} height={h} fill="rgba(0,0,0,0)" />;
  switch (el.shape) {
    case 'rect':
      return <Rect width={w} height={h} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} cornerRadius={el.cornerRadius} {...shadow} />;
    case 'ellipse':
      return <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} {...shadow} />;
    case 'line':
      return (
        <>
          {hit}
          <Line points={[0, h / 2, w, h / 2]} stroke={stroke !== 'transparent' ? stroke : fill} strokeWidth={Math.max(1, el.strokeWidth || h)} lineCap="butt" {...shadow} />
        </>
      );
    case 'arrow': {
      const sw = Math.max(1, el.strokeWidth || 3);
      const color = stroke !== 'transparent' ? stroke : fill;
      return (
        <>
          {hit}
          <Arrow
            points={[0, h / 2, w - sw, h / 2]}
            pointerLength={Math.min(h * 0.5, w * 0.4)}
            pointerWidth={h * 0.9}
            fill={color}
            stroke={color}
            strokeWidth={sw}
            lineCap="round"
            lineJoin="round"
            {...shadow}
          />
        </>
      );
    }
    case 'arch':
      return (
        <Shape
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={el.strokeWidth}
          sceneFunc={(ctx, shape) => {
            archPath(ctx, w, h);
            ctx.fillStrokeShape(shape);
          }}
          {...shadow}
        />
      );
    case 'archOutline':
      return (
        <>
          {hit}
          <Shape
            width={w}
            height={h}
            stroke={stroke !== 'transparent' ? stroke : fill}
            strokeWidth={Math.max(1, el.strokeWidth || 3)}
            sceneFunc={(ctx, shape) => {
              archPath(ctx, w, h, false);
              ctx.strokeShape(shape);
            }}
            {...shadow}
          />
        </>
      );
  }
}

// ───────────────────────────────────────── image

export function coverGeometry(el: ImageElement, iw: number, ih: number) {
  const scale = Math.max(el.width / iw, el.height / ih) * Math.max(1, el.zoom);
  const drawW = iw * scale;
  const drawH = ih * scale;
  const extraX = drawW - el.width;
  const extraY = drawH - el.height;
  return {
    drawW,
    drawH,
    extraX,
    extraY,
    x: (-extraX / 2) * (1 + el.offsetX),
    y: (-extraY / 2) * (1 + el.offsetY),
  };
}

function ImageContent({
  el,
  rc,
  cropMode,
  onCropChange,
}: {
  el: ImageElement;
  rc: RenderCtx;
  cropMode?: boolean;
  onCropChange?: (offsetX: number, offsetY: number) => void;
}) {
  const asset = rc.assets[el.assetId];
  const img = useImage(asset?.src);
  const geo = img ? coverGeometry(el, img.naturalWidth, img.naturalHeight) : null;
  const stroke = resolveColor(el.stroke, rc.palette);
  const primary = resolveColor('token:primary', rc.palette);
  const shadow = shadowProps(el.shadow, rc.palette);
  return (
    <>
      {el.shadow?.enabled && (
        <Shape
          fill="#000"
          {...shadow}
          sceneFunc={(ctx, shape) => {
            maskPath(ctx, el);
            ctx.fillShape(shape);
          }}
        />
      )}
      <Group clipFunc={(ctx) => maskPath(ctx, el)}>
        <Rect width={el.width} height={el.height} fill={resolveColor('token:muted', rc.palette)} opacity={img ? 0 : 0.35} />
        {img && geo && (
          <KImage
            image={img}
            x={geo.x}
            y={geo.y}
            width={geo.drawW}
            height={geo.drawH}
            draggable={cropMode}
            dragBoundFunc={undefined}
            onDragMove={(e) => {
              const n = e.target;
              n.x(Math.min(0, Math.max(-geo.extraX, n.x())));
              n.y(Math.min(0, Math.max(-geo.extraY, n.y())));
            }}
            onDragEnd={(e) => {
              const n = e.target;
              const ox = geo.extraX > 0 ? (-2 * n.x()) / geo.extraX - 1 : 0;
              const oy = geo.extraY > 0 ? (-2 * n.y()) / geo.extraY - 1 : 0;
              onCropChange?.(Math.max(-1, Math.min(1, ox)), Math.max(-1, Math.min(1, oy)));
            }}
          />
        )}
        {el.treatment === 'mono' && <Rect width={el.width} height={el.height} fill="#000" globalCompositeOperation="saturation" listening={false} />}
        {el.treatment === 'duotone' && <Rect width={el.width} height={el.height} fill={primary} globalCompositeOperation="color" listening={false} />}
        {el.treatment === 'greenTint' && (
          <Rect width={el.width} height={el.height} fill={primary} opacity={0.45} globalCompositeOperation="multiply" listening={false} />
        )}
      </Group>
      {el.strokeWidth > 0 && stroke !== 'transparent' && (
        <Shape
          stroke={stroke}
          strokeWidth={el.strokeWidth}
          listening={false}
          sceneFunc={(ctx, shape) => {
            maskPath(ctx, el);
            ctx.strokeShape(shape);
          }}
        />
      )}
    </>
  );
}

// ───────────────────────────────────────── logo

function LogoContent({ el, rc }: { el: LogoElement; rc: RenderCtx }) {
  const asset = rc.logos[el.variant];
  const img = useImage(asset?.src);
  if (img) return <KImage image={img} width={el.width} height={el.height} />;
  return <LogoFallback el={el} rc={rc} />;
}

/**
 * Temporary wordmark (used while the official PNGs are not loaded).
 * Follows the structure of the official logo: symbol + "All GREEN" + "CONSULTING".
 */
function LogoFallback({ el, rc }: { el: LogoElement; rc: RenderCtx }) {
  const negative = el.variant.endsWith('Negative');
  const main = resolveColor(negative ? 'token:light' : 'token:primary', rc.palette);
  const symbolColor = resolveColor(negative && el.variant.startsWith('horizontal') ? 'token:secondary' : negative ? 'token:light' : 'token:primary', rc.palette);
  const h = el.height;
  const w = el.width;
  if (el.variant.startsWith('symbol')) {
    const s = Math.min(w, h);
    return (
      <>
        <Rect width={w} height={h} fill="rgba(0,0,0,0)" />
        <Shape
          x={(w - s * 0.8) / 2}
          y={(h - s) / 2}
          fill={symbolColor}
          sceneFunc={(ctx, shape) => {
            archPath(ctx, s * 0.8, s);
            ctx.fillShape(shape);
          }}
        />
      </>
    );
  }
  const compact = el.variant.startsWith('compact');
  const sym = h * (compact ? 1 : 0.86);
  const textX = sym * 1.25;
  return (
    <>
      <Rect width={w} height={h} fill="rgba(0,0,0,0)" />
      <Shape
        y={(h - sym) / 2}
        fill={symbolColor}
        sceneFunc={(ctx, shape) => {
          archPath(ctx, sym * 0.86, sym);
          ctx.fillShape(shape);
        }}
      />
      <Text text="All GREEN" x={textX} y={compact ? h * 0.12 : 0} fontSize={h * (compact ? 0.72 : 0.62)} fontFamily={FONT_FAMILY} fontStyle="600" letterSpacing={-h * 0.01} fill={main} />
      {!compact && (
        <Text text="CONSULTING" x={textX + 2} y={h * 0.74} fontSize={h * 0.17} fontFamily={FONT_FAMILY} fontStyle="500" letterSpacing={h * 0.045} fill={main} opacity={negative ? 0.4 : 0.6} />
      )}
    </>
  );
}

// ───────────────────────────────────────── tag

function TagContent({ el, rc }: { el: TagElement; rc: RenderCtx }) {
  const shadow = shadowProps(el.shadow, rc.palette);
  return (
    <>
      <Rect
        width={el.width}
        height={el.height}
        fill={resolveColor(el.fill, rc.palette)}
        stroke={resolveColor(el.stroke, rc.palette)}
        strokeWidth={el.strokeWidth}
        cornerRadius={Math.min(el.cornerRadius, el.height / 2)}
        {...shadow}
      />
      <Text
        text={el.uppercase ? el.text.toUpperCase() : el.text}
        width={el.width}
        height={el.height}
        x={(el.letterSpacing * el.fontSize) / 2}
        align="center"
        verticalAlign="middle"
        fontSize={el.fontSize}
        fontFamily={FONT_FAMILY}
        fontStyle={String(el.fontWeight)}
        letterSpacing={el.letterSpacing * el.fontSize}
        fill={resolveColor(el.color, rc.palette)}
        listening={false}
      />
    </>
  );
}

// ───────────────────────────────────────── generic node

export interface NodeHandlers {
  draggable?: boolean;
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDblClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformStart?: (e: Konva.KonvaEventObject<Event>) => void;
  onTransform?: (e: Konva.KonvaEventObject<Event>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}

export function ElementNode({
  el,
  rc,
  handlers = {},
  hideText,
  cropMode,
  onCropChange,
  listening = true,
}: {
  el: CarouselElement;
  rc: RenderCtx;
  handlers?: NodeHandlers;
  hideText?: boolean;
  cropMode?: boolean;
  onCropChange?: (ox: number, oy: number) => void;
  listening?: boolean;
}) {
  return (
    <Group
      id={el.id}
      name="element"
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      opacity={el.opacity}
      listening={listening}
      draggable={handlers.draggable && !cropMode}
      onMouseDown={handlers.onMouseDown}
      onTouchStart={handlers.onMouseDown}
      onDblClick={handlers.onDblClick}
      onDblTap={handlers.onDblClick as never}
      onDragStart={handlers.onDragStart}
      onDragMove={handlers.onDragMove}
      onDragEnd={handlers.onDragEnd}
      onTransformStart={handlers.onTransformStart}
      onTransform={handlers.onTransform}
      onTransformEnd={handlers.onTransformEnd}
    >
      {el.type === 'text' && <TextContent el={el} rc={rc} hideText={hideText} />}
      {el.type === 'shape' && <ShapeContent el={el} rc={rc} />}
      {el.type === 'image' && <ImageContent el={el} rc={rc} cropMode={cropMode} onCropChange={onCropChange} />}
      {el.type === 'logo' && <LogoContent el={el} rc={rc} />}
      {el.type === 'tag' && <TagContent el={el} rc={rc} />}
    </Group>
  );
}
