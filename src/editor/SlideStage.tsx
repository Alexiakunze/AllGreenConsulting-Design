import { forwardRef } from 'react';
import type Konva from 'konva';
import { Layer, Rect, Stage } from 'react-konva';
import { CANVAS, resolveColor } from '../design-system/designTokens';
import type { Slide } from '../types/carouselTypes';
import { ElementNode, type RenderCtx } from './nodes';

/**
 * Static render of a slide (thumbnails, preview and PNG export).
 * Uses the same components as the editor → pixel-perfect consistency.
 */
export const SlideStage = forwardRef<Konva.Stage, { slide: Slide; rc: RenderCtx; scale: number }>(function SlideStage(
  { slide, rc, scale },
  ref,
) {
  return (
    <Stage ref={ref} width={CANVAS.width * scale} height={CANVAS.height * scale} scaleX={scale} scaleY={scale} listening={false}>
      <Layer listening={false}>
        <Rect width={CANVAS.width} height={CANVAS.height} fill={resolveColor(slide.background, rc.palette)} />
        {slide.elements
          .filter((e) => !e.hidden)
          .map((el) => (
            <ElementNode key={el.id} el={el} rc={rc} listening={false} />
          ))}
      </Layer>
    </Stage>
  );
});
