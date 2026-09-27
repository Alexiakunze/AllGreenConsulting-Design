import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type Konva from 'konva';
import JSZip from 'jszip';
import { CANVAS } from '../design-system/designTokens';
import { loadImage } from '../editor/imageCache';
import { SlideStage } from '../editor/SlideStage';
import type { RenderCtx } from '../editor/nodes';
import type { Project, Slide } from '../types/carouselTypes';
import { pad2 } from '../utils/id';
import { saveFile } from '../utils/download';

/**
 * PNG export.
 * Each slide is re-rendered off-screen at exactly 1080×1350 (scale 1,
 * pixelRatio 1) from the vector scene graph — never a screenshot.
 */

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

async function preload(slide: Slide, rc: RenderCtx) {
  const srcs = new Set<string>();
  slide.elements.forEach((e) => {
    if (e.hidden) return;
    if (e.type === 'image' && rc.assets[e.assetId]) srcs.add(rc.assets[e.assetId].src);
    if (e.type === 'logo' && rc.logos[e.variant]) srcs.add(rc.logos[e.variant]!.src);
  });
  await Promise.all([...srcs].map((s) => loadImage(s).catch(() => undefined)));
  await document.fonts?.ready;
}

export async function renderSlide(slide: Slide, rc: RenderCtx, pixelRatio = 1): Promise<Blob> {
  await preload(slide, rc);
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none;opacity:0;';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const stage = await new Promise<Konva.Stage>((resolve) => {
      root.render(
        createElement(SlideStage, {
          slide,
          rc,
          scale: 1,
          ref: (s: Konva.Stage | null) => {
            if (s) resolve(s);
          },
        }),
      );
    });
    await nextFrame();
    await nextFrame();
    stage.draw();
    const blob = (await stage.toBlob({ pixelRatio, mimeType: 'image/png', width: CANVAS.width, height: CANVAS.height, x: 0, y: 0 })) as Blob;
    return blob;
  } finally {
    root.unmount();
    host.remove();
  }
}

export const renderContext = (p: Project, logos: RenderCtx['logos']): RenderCtx => ({ palette: p.palette, assets: p.assets, logos });


export interface ExportedFile {
  name: string;
  blob: Blob;
}

export async function exportCurrentSlide(p: Project, slideId: string, logos: RenderCtx['logos']): Promise<ExportedFile[]> {
  const idx = p.slides.findIndex((s) => s.id === slideId);
  if (idx < 0) return [];
  const blob = await renderSlide(p.slides[idx], renderContext(p, logos));
  const name = `${pad2(idx + 1)}.png`;
  await saveFile(blob, name);
  return [{ name, blob }];
}

export async function exportAllSlides(p: Project, logos: RenderCtx['logos'], onProgress?: (done: number, total: number) => void, zipName = 'carrossel') {
  const zip = new JSZip();
  const rc = renderContext(p, logos);
  const files: ExportedFile[] = [];
  for (let i = 0; i < p.slides.length; i++) {
    const blob = await renderSlide(p.slides[i], rc);
    const name = `${pad2(i + 1)}.png`;
    zip.file(name, blob);
    files.push({ name, blob });
    onProgress?.(i + 1, p.slides.length);
  }
  const out = await zip.generateAsync({ type: 'blob' });
  await saveFile(out, `${zipName}.zip`);
  return files;
}

export async function makeThumbnail(p: Project, logos: RenderCtx['logos']): Promise<string | undefined> {
  if (!p.slides.length) return undefined;
  const blob = await renderSlide(p.slides[0], renderContext(p, logos), 0.3);
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}
