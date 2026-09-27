import { useEffect, useState } from 'react';
import { FONTS } from './design-system/designTokens';
import { brandFileUrl, LOGO_CANDIDATES, LOGO_VARIANTS } from './design-system/brandAssets';
import { Dashboard } from './components/Dashboard';
import { NewCarousel } from './components/NewCarousel';
import { EditorView } from './components/EditorView';
import {
  copySelected,
  currentSlide,
  deleteSelected,
  duplicateSelected,
  getState,
  imageSize,
  loadBrandLogos,
  nudgeSelected,
  paste,
  redo,
  registerThumbnailer,
  saveNow,
  select,
  setState,
  undo,
  useEditor,
} from './editor/store';
import { makeThumbnail } from './export/exportPng';
import { resetMeasureCache } from './utils/textLayout';
import type { Asset, LogoVariant } from './types/carouselTypes';

/** Loads every Space Grotesk weight BEFORE rendering the canvas (Konva measures text on canvas) */
async function loadFonts() {
  const weights = Object.values(FONTS.weights);
  await Promise.all(weights.map((w) => document.fonts.load(`${w} 40px "${FONTS.primary}"`, 'AaÇã0123456789%“')));
  resetMeasureCache();
}

async function probeLogo(variant: LogoVariant): Promise<Asset | null> {
  for (const file of LOGO_CANDIDATES[variant]) {
    const url = brandFileUrl(file);
    try {
      const res = await fetch(url, { method: 'GET' });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !type.startsWith('image/')) continue;
      const { width, height } = await imageSize(url);
      return { id: `brand-${variant}`, name: file, kind: 'logo', src: url, width, height, logoVariant: variant };
    } catch {
      /* next candidate */
    }
  }
  return null;
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = getState();
      if (s.view !== 'editor' || s.previewOpen || s.exportOpen) return;
      if (isTyping(e)) return;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (mod && k === 'z') {
        e.preventDefault();
        undo();
      } else if (mod && k === 'y') {
        e.preventDefault();
        redo();
      } else if (mod && k === 'c') {
        copySelected();
      } else if (mod && k === 'v') {
        e.preventDefault();
        paste();
      } else if (mod && k === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (mod && k === 's') {
        e.preventDefault();
        void saveNow();
      } else if (mod && k === 'a') {
        e.preventDefault();
        const sl = currentSlide(s);
        if (sl) select(sl.elements.filter((el) => !el.hidden && !el.locked).map((el) => el.id));
      } else if (k === 'delete' || k === 'backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (k === 'escape') {
        setState({ selectedIds: [], cropModeId: null, editingTextId: null });
      } else if (k === 'g' && !mod) {
        setState({ showGrid: !s.showGrid });
      } else if (k.startsWith('arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        nudgeSelected(k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0, k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export default function App() {
  const view = useEditor((s) => s.view);
  const toastMsg = useEditor((s) => s.toast);
  const [ready, setReady] = useState(false);
  useShortcuts();

  useEffect(() => {
    registerThumbnailer((p) => makeThumbnail(p, getState().brandLogos));
    void Promise.all([loadFonts(), loadBrandLogos(probeLogo, LOGO_VARIANTS)]).finally(() => setReady(true));
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (getState().dirty) {
        void saveNow();
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  if (!ready) {
    return <div className="flex h-full items-center justify-center text-muted">Carregando identidade All Green…</div>;
  }

  return (
    <>
      {view === 'dashboard' && <Dashboard />}
      {view === 'new' && <NewCarousel />}
      {view === 'editor' && <EditorView />}
      {toastMsg && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[12.5px] text-white shadow-lg">{toastMsg}</div>
      )}
    </>
  );
}
