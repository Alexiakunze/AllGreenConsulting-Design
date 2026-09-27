import { useEffect, useState } from 'react';

/** Global HTMLImageElement cache (shared by the editor, thumbnails and export) */
const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit);
  const p = pending.get(src);
  if (p) return p;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cache.set(src, img);
      pending.delete(src);
      resolve(img);
    };
    img.onerror = (e) => {
      pending.delete(src);
      reject(e);
    };
    img.src = src;
  });
  pending.set(src, promise);
  return promise;
}

export const getCachedImage = (src?: string) => (src ? cache.get(src) : undefined);

export function useImage(src?: string): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement | undefined>(() => getCachedImage(src));
  useEffect(() => {
    if (!src) {
      setImg(undefined);
      return;
    }
    const hit = cache.get(src);
    if (hit) {
      setImg(hit);
      return;
    }
    let alive = true;
    loadImage(src)
      .then((i) => alive && setImg(i))
      .catch(() => alive && setImg(undefined));
    return () => {
      alive = false;
    };
  }, [src]);
  return img;
}
