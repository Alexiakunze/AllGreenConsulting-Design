import { useSyncExternalStore } from 'react';
import { ALL_GREEN_COLORS, BRAND_INFO, CANVAS, type BrandPalette, type ColorToken } from '../design-system/designTokens';
import { applyTemplate, refreshCounters, TEMPLATES, themeBackground } from '../templates/templates';
import { fitTagWidth, makeImage, measureTextElement } from '../templates/elementFactory';
import type {
  Asset,
  CarouselElement,
  CarouselSettings,
  ContentKey,
  ImageElement,
  LogoVariant,
  ParsedSlide,
  Project,
  Slide,
  SlideContent,
  SlideTheme,
  TemplateId,
} from '../types/carouselTypes';
import { deepClone, uid } from '../utils/id';
import * as db from '../storage/db';

export type LeftTab = 'content' | 'slides' | 'brand' | 'elements' | 'export';
export type CreationStyle = 'auto' | 'dark' | 'light';

interface Snapshot {
  slides: Slide[];
  palette: BrandPalette;
  settings: CarouselSettings;
  currentSlideId: string | null;
}

export interface EditorState {
  view: 'dashboard' | 'new' | 'editor';
  project: Project | null;
  currentSlideId: string | null;
  selectedIds: string[];
  editingTextId: string | null;
  cropModeId: string | null;
  zoom: number | 'fit';
  effectiveScale: number;
  showGrid: boolean;
  snap: boolean;
  leftTab: LeftTab;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: number | null;
  brandLogos: Partial<Record<LogoVariant, Asset>>;
  past: Snapshot[];
  future: Snapshot[];
  clipboard: CarouselElement[] | null;
  previewOpen: boolean;
  exportOpen: boolean;
  toast: string | null;
  autoRelayout: boolean;
}

const initial: EditorState = {
  view: 'dashboard',
  project: null,
  currentSlideId: null,
  selectedIds: [],
  editingTextId: null,
  cropModeId: null,
  zoom: 'fit',
  effectiveScale: 0.5,
  showGrid: false,
  snap: true,
  leftTab: 'content',
  dirty: false,
  saving: false,
  lastSavedAt: null,
  brandLogos: {},
  past: [],
  future: [],
  clipboard: null,
  previewOpen: false,
  exportOpen: false,
  toast: null,
  autoRelayout: true,
};

let state: EditorState = initial;
const listeners = new Set<() => void>();

export const getState = () => state;

export function setState(patch: Partial<EditorState> | ((s: EditorState) => Partial<EditorState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useEditor<T>(selector: (s: EditorState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

// ─────────────────────────────────────────── defaults

export const DEFAULT_SETTINGS: CarouselSettings = {
  showHeader: true,
  showFooter: true,
  showCounter: true,
  handle: BRAND_INFO.handle,
  eyebrowDefault: BRAND_INFO.name,
};

export const defaultPalette = (): BrandPalette => ({ ...ALL_GREEN_COLORS });

// ─────────────────────────────────────────── history

const HISTORY_LIMIT = 80;
let lastCoalesce: { key: string; at: number } | null = null;

function snapshot(): Snapshot | null {
  const p = state.project;
  if (!p) return null;
  return { slides: p.slides, palette: p.palette, settings: p.settings, currentSlideId: state.currentSlideId };
}

/** Saves the current state to the history (call before a change) */
export function pushHistory(coalesceKey?: string) {
  const now = Date.now();
  if (coalesceKey && lastCoalesce && lastCoalesce.key === coalesceKey && now - lastCoalesce.at < 800) {
    lastCoalesce.at = now;
    return;
  }
  lastCoalesce = coalesceKey ? { key: coalesceKey, at: now } : null;
  const snap = snapshot();
  if (!snap) return;
  setState((s) => ({ past: [...s.past.slice(-HISTORY_LIMIT + 1), snap], future: [] }));
}

export function undo() {
  const s = state;
  if (!s.project || !s.past.length) return;
  const prev = s.past[s.past.length - 1];
  const cur = snapshot()!;
  lastCoalesce = null;
  setState({
    past: s.past.slice(0, -1),
    future: [cur, ...s.future],
    project: { ...s.project, slides: prev.slides, palette: prev.palette, settings: prev.settings },
    currentSlideId: prev.slides.some((sl) => sl.id === prev.currentSlideId) ? prev.currentSlideId : prev.slides[0]?.id ?? null,
    selectedIds: [],
    dirty: true,
  });
}

export function redo() {
  const s = state;
  if (!s.project || !s.future.length) return;
  const next = s.future[0];
  const cur = snapshot()!;
  lastCoalesce = null;
  setState({
    future: s.future.slice(1),
    past: [...s.past, cur],
    project: { ...s.project, slides: next.slides, palette: next.palette, settings: next.settings },
    currentSlideId: next.slides.some((sl) => sl.id === next.currentSlideId) ? next.currentSlideId : next.slides[0]?.id ?? null,
    selectedIds: [],
    dirty: true,
  });
}

// ─────────────────────────────────────────── project mutation

interface MutateOpts {
  history?: boolean;
  coalesceKey?: string;
}

/** Changes the project through a cloned draft (slides/palette/settings) */
export function mutateProject(fn: (draft: Project) => void, opts: MutateOpts = {}) {
  const p = state.project;
  if (!p) return;
  if (opts.history !== false) pushHistory(opts.coalesceKey);
  const draft: Project = {
    ...p,
    slides: deepClone(p.slides),
    palette: { ...p.palette },
    settings: { ...p.settings },
    assets: { ...p.assets },
  };
  fn(draft);
  draft.updatedAt = Date.now();
  setState({ project: draft, dirty: true });
  scheduleAutosave();
}

function mutateSlide(slideId: string, fn: (slide: Slide, draft: Project) => void, opts?: MutateOpts) {
  mutateProject((d) => {
    const slide = d.slides.find((s) => s.id === slideId);
    if (slide) fn(slide, d);
  }, opts);
}

export const currentSlide = (s: EditorState = state): Slide | null =>
  s.project?.slides.find((sl) => sl.id === s.currentSlideId) ?? null;

function ctxFor(d: Project, slide: Slide) {
  return { index: d.slides.indexOf(slide), total: d.slides.length, settings: d.settings, theme: slide.theme };
}

// ─────────────────────────────────────────── projects

export function createSlidesFromParsed(parsed: ParsedSlide[], style: CreationStyle, settings: CarouselSettings): Slide[] {
  const total = parsed.length;
  const slides = parsed.map((p, index) => {
    const tpl = p.suggested;
    const def = TEMPLATES[tpl];
    const theme: SlideTheme = style === 'auto' ? def.defaultTheme : style;
    const base: Slide = {
      id: uid('slide'),
      name: `Slide ${String(index + 1).padStart(2, '0')}`,
      template: tpl,
      theme,
      content: p.content,
      rawText: p.rawText,
      background: themeBackground(theme),
      elements: [],
    };
    return applyTemplate(base, tpl, { index, total, settings, theme });
  });
  return slides;
}

export function newProject(name: string, parsed: ParsedSlide[], style: CreationStyle) {
  const settings = { ...DEFAULT_SETTINGS };
  const slides = createSlidesFromParsed(parsed, style, settings);
  const project: Project = {
    id: uid('proj'),
    name: name || 'Carrossel sem título',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    slides: slides.length ? slides : createSlidesFromParsed([{ index: 0, rawText: '', content: { headline: 'Sua headline aqui' }, suggested: 'cover', reason: '' }], style, settings),
    palette: defaultPalette(),
    settings,
    assets: {},
  };
  openProjectObject(project);
  setState({ dirty: true });
  void saveNow();
}

export function openProjectObject(project: Project) {
  // Compatibility: fill in tokens added in newer versions
  project.palette = { ...ALL_GREEN_COLORS, ...project.palette };
  project.settings = { ...DEFAULT_SETTINGS, ...project.settings };
  setState({
    view: 'editor',
    project,
    currentSlideId: project.slides[0]?.id ?? null,
    selectedIds: [],
    past: [],
    future: [],
    dirty: false,
    editingTextId: null,
    cropModeId: null,
    leftTab: 'slides',
  });
}

export async function openProject(id: string) {
  const p = await db.loadProject(id);
  if (p) openProjectObject(p);
}

export function goDashboard() {
  if (state.dirty) void saveNow();
  setState({ view: 'dashboard', project: null, selectedIds: [], previewOpen: false, exportOpen: false });
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => void saveNow(), 1500);
}

/** Thumbnail generator registered by the export module (avoids a cycle) */
let thumbnailer: ((p: Project) => Promise<string | undefined>) | null = null;
export const registerThumbnailer = (fn: typeof thumbnailer) => (thumbnailer = fn);

export async function saveNow() {
  const p = state.project;
  if (!p) return;
  setState({ saving: true });
  try {
    let thumbnail = p.thumbnail;
    try {
      thumbnail = (await thumbnailer?.(p)) ?? thumbnail;
    } catch {
      /* the thumbnail is optional */
    }
    const toSave = { ...p, thumbnail };
    await db.saveProject(toSave);
    if (state.project?.id === p.id) {
      setState({ saving: false, dirty: state.project !== p, lastSavedAt: Date.now(), project: state.project === p ? toSave : state.project });
    } else setState({ saving: false });
  } catch (e) {
    console.error(e);
    setState({ saving: false });
    toast('Não foi possível salvar o projeto.');
  }
}

export async function duplicateProject(id?: string) {
  const src = id ? await db.loadProject(id) : state.project;
  if (!src) return;
  const copy: Project = { ...deepClone(src), id: uid('proj'), name: `${src.name} (cópia)`, createdAt: Date.now(), updatedAt: Date.now() };
  await db.saveProject(copy);
  if (!id) {
    openProjectObject(copy);
    toast('Projeto duplicado.');
  }
  return copy;
}

export function renameProject(name: string) {
  mutateProject((d) => (d.name = name), { history: false });
}

export function toast(msg: string) {
  setState({ toast: msg });
  setTimeout(() => {
    if (state.toast === msg) setState({ toast: null });
  }, 2600);
}

// ─────────────────────────────────────────── slides

export function selectSlide(id: string) {
  setState({ currentSlideId: id, selectedIds: [], editingTextId: null, cropModeId: null });
}

export function addSlide(template: TemplateId = 'text', afterId?: string | null) {
  let newId = '';
  mutateProject((d) => {
    const idx = afterId ? d.slides.findIndex((s) => s.id === afterId) : d.slides.length - 1;
    const def = TEMPLATES[template];
    const slide: Slide = {
      id: uid('slide'),
      name: `Slide ${String(d.slides.length + 1).padStart(2, '0')}`,
      template,
      theme: def.defaultTheme,
      content: { headline: 'Digite a headline' },
      background: themeBackground(def.defaultTheme),
      elements: [],
    };
    d.slides.splice(idx + 1, 0, slide);
    const built = applyTemplate(slide, template, ctxFor(d, slide));
    d.slides[idx + 1] = built;
    d.slides = refreshCounters(d.slides);
    newId = slide.id;
  });
  selectSlide(newId);
}

export function appendParsedSlides(parsed: ParsedSlide[], style: CreationStyle, replace: boolean) {
  let firstId = '';
  mutateProject((d) => {
    const created = createSlidesFromParsed(parsed, style, d.settings);
    d.slides = replace ? created : [...d.slides, ...created];
    // Recomputes templates so counters/arrows follow the new total
    d.slides = d.slides.map((s, index) => applyTemplate(s, s.template, { index, total: d.slides.length, settings: d.settings, theme: s.theme }));
    firstId = created[0]?.id ?? '';
  });
  if (firstId) selectSlide(firstId);
}

export function duplicateSlide(id: string) {
  let newId = '';
  mutateProject((d) => {
    const idx = d.slides.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const copy = deepClone(d.slides[idx]);
    copy.id = uid('slide');
    copy.name = `${copy.name} (cópia)`;
    copy.elements.forEach((e) => (e.id = uid(e.type)));
    d.slides.splice(idx + 1, 0, copy);
    d.slides = refreshCounters(d.slides);
    newId = copy.id;
  });
  selectSlide(newId);
}

export function deleteSlide(id: string) {
  const p = state.project;
  if (!p || p.slides.length <= 1) {
    toast('O carrossel precisa de pelo menos 1 slide.');
    return;
  }
  const idx = p.slides.findIndex((s) => s.id === id);
  mutateProject((d) => {
    d.slides = refreshCounters(d.slides.filter((s) => s.id !== id));
  });
  const slides = state.project!.slides;
  if (state.currentSlideId === id) selectSlide(slides[Math.min(idx, slides.length - 1)].id);
}

export function moveSlide(from: number, to: number) {
  if (from === to) return;
  mutateProject((d) => {
    const [s] = d.slides.splice(from, 1);
    d.slides.splice(to, 0, s);
    d.slides = refreshCounters(d.slides);
  });
}

export function renameSlide(id: string, name: string) {
  mutateSlide(id, (s) => (s.name = name), { coalesceKey: `rename-${id}` });
}

export function setSlideTemplate(id: string, template: TemplateId) {
  mutateProject((d) => {
    const i = d.slides.findIndex((s) => s.id === id);
    if (i < 0) return;
    d.slides[i] = applyTemplate(d.slides[i], template, ctxFor(d, d.slides[i]));
  });
  setState({ selectedIds: [] });
}

export function setSlideTheme(id: string, theme: SlideTheme) {
  mutateProject((d) => {
    const i = d.slides.findIndex((s) => s.id === id);
    if (i < 0) return;
    const s = { ...d.slides[i], theme };
    d.slides[i] = applyTemplate(s, s.template, { ...ctxFor(d, d.slides[i]), theme });
  });
}

export function setSlideBackground(id: string, color: string) {
  mutateSlide(id, (s) => (s.background = color), { coalesceKey: `bg-${id}` });
}

/** ORGANIZAR LAYOUT — regenerates the composition without touching the text */
export function autoLayout(id?: string | null) {
  mutateProject((d) => {
    d.slides = d.slides.map((s, index) =>
      !id || s.id === id ? applyTemplate(s, s.template, { index, total: d.slides.length, settings: d.settings, theme: s.theme }) : s,
    );
  });
  setState({ selectedIds: [] });
  toast(id ? 'Layout organizado.' : 'Todos os slides foram organizados.');
}

/** Edits a content field (Conteúdo panel). Updates the linked elements. */
export function updateContent(slideId: string, key: ContentKey, value: string | string[] | undefined) {
  mutateProject(
    (d) => {
      const i = d.slides.findIndex((s) => s.id === slideId);
      if (i < 0) return;
      const slide = d.slides[i];
      const content: SlideContent = { ...slide.content };
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) delete content[key];
      else (content as Record<string, unknown>)[key] = value;
      slide.content = content;
      if (state.autoRelayout) {
        d.slides[i] = applyTemplate(slide, slide.template, ctxFor(d, slide));
      } else {
        syncBoundElements(slide);
      }
    },
    { coalesceKey: `content-${slideId}-${key}` },
  );
}

function syncBoundElements(slide: Slide) {
  slide.elements.forEach((e) => {
    if ((e.type === 'text' || e.type === 'tag') && e.bind) {
      const v = slide.content[e.bind];
      const text = Array.isArray(v) ? (e.type === 'text' && e.bindIndex !== undefined ? v[e.bindIndex] ?? '' : v.join('\n')) : v ?? '';
      e.text = text;
      if (e.type === 'text') e.height = measureTextElement(e);
      else e.width = fitTagWidth(e);
    }
  });
}

// ─────────────────────────────────────────── elements

export function select(ids: string[]) {
  setState({ selectedIds: ids, editingTextId: null, cropModeId: state.cropModeId && ids.includes(state.cropModeId) ? state.cropModeId : null });
}

type ElementPatch = Partial<CarouselElement> & Record<string, unknown>;

export function updateElement(id: string, patch: ElementPatch, opts: MutateOpts = {}) {
  const slideId = state.currentSlideId;
  if (!slideId) return;
  mutateSlide(
    slideId,
    (slide) => {
      const el = slide.elements.find((e) => e.id === id);
      if (!el) return;
      Object.assign(el, patch);
      if (el.type === 'text') {
        const affects = ['text', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'width', 'uppercase', 'padding'].some((k) => k in patch);
        if (affects) el.height = measureTextElement(el);
        if ('text' in patch && el.bind) writeBack(slide, el.bind, el.text, el.bindIndex);
      }
      if (el.type === 'tag') {
        if ('text' in patch || 'fontSize' in patch || 'paddingX' in patch || 'letterSpacing' in patch || 'uppercase' in patch) el.width = fitTagWidth(el);
        if ('text' in patch && el.bind) writeBack(slide, el.bind, el.text);
      }
    },
    opts,
  );
}

function writeBack(slide: Slide, key: ContentKey, text: string, index?: number) {
  if (key === 'items') {
    const items = [...(slide.content.items ?? [])];
    if (index !== undefined) items[index] = text;
    slide.content = { ...slide.content, items };
  } else {
    slide.content = { ...slide.content, [key]: text };
  }
}

export function updateElements(patches: Array<{ id: string; patch: ElementPatch }>, opts: MutateOpts = {}) {
  const slideId = state.currentSlideId;
  if (!slideId) return;
  mutateSlide(
    slideId,
    (slide) => {
      patches.forEach(({ id, patch }) => {
        const el = slide.elements.find((e) => e.id === id);
        if (el) Object.assign(el, patch);
      });
    },
    opts,
  );
}

export function addElement(el: CarouselElement) {
  const slideId = state.currentSlideId;
  if (!slideId) return;
  mutateSlide(slideId, (slide) => slide.elements.push({ ...el, templateOwned: false }));
  select([el.id]);
}

export function deleteSelected() {
  const ids = state.selectedIds;
  const slideId = state.currentSlideId;
  if (!ids.length || !slideId) return;
  mutateSlide(slideId, (slide) => {
    slide.elements = slide.elements.filter((e) => !ids.includes(e.id) || e.locked);
  });
  setState({ selectedIds: [] });
}

export function duplicateSelected() {
  const slide = currentSlide();
  if (!slide) return;
  const els = slide.elements.filter((e) => state.selectedIds.includes(e.id));
  if (!els.length) return;
  const copies = els.map((e) => ({ ...deepClone(e), id: uid(e.type), x: e.x + 24, y: e.y + 24, locked: false, templateOwned: false }));
  mutateSlide(slide.id, (s) => s.elements.push(...copies));
  select(copies.map((c) => c.id));
}

export function copySelected() {
  const slide = currentSlide();
  if (!slide) return;
  const els = slide.elements.filter((e) => state.selectedIds.includes(e.id));
  if (els.length) setState({ clipboard: deepClone(els) });
}

export function paste() {
  const slide = currentSlide();
  const clip = state.clipboard;
  if (!slide || !clip?.length) return;
  const copies = clip.map((e) => ({ ...deepClone(e), id: uid(e.type), x: e.x + 24, y: e.y + 24, templateOwned: false, bind: undefined }));
  mutateSlide(slide.id, (s) => s.elements.push(...(copies as CarouselElement[])));
  setState({ clipboard: copies as CarouselElement[] });
  select(copies.map((c) => c.id));
}

export function reorderLayer(id: string, dir: 'up' | 'down' | 'top' | 'bottom') {
  const slide = currentSlide();
  if (!slide) return;
  mutateSlide(slide.id, (s) => {
    const i = s.elements.findIndex((e) => e.id === id);
    if (i < 0) return;
    const [el] = s.elements.splice(i, 1);
    const n = s.elements.length;
    const to = dir === 'up' ? Math.min(n, i + 1) : dir === 'down' ? Math.max(0, i - 1) : dir === 'top' ? n : 0;
    s.elements.splice(to, 0, el);
  });
}

export function toggleFlag(id: string, flag: 'locked' | 'hidden') {
  const slide = currentSlide();
  const el = slide?.elements.find((e) => e.id === id);
  if (!slide || !el) return;
  updateElement(id, { [flag]: !el[flag] });
  if (flag === 'hidden' && !el.hidden) setState({ selectedIds: state.selectedIds.filter((s) => s !== id) });
}

export function nudgeSelected(dx: number, dy: number) {
  const slide = currentSlide();
  if (!slide) return;
  const els = slide.elements.filter((e) => state.selectedIds.includes(e.id) && !e.locked);
  if (!els.length) return;
  updateElements(
    els.map((e) => ({ id: e.id, patch: { x: e.x + dx, y: e.y + dy } })),
    { coalesceKey: 'nudge' },
  );
}

// ─────────────────────────────────────────── palette and settings

export function setPaletteColor(token: ColorToken, hex: string) {
  mutateProject((d) => (d.palette[token] = hex), { coalesceKey: `palette-${token}` });
}

export function resetPalette() {
  mutateProject((d) => (d.palette = defaultPalette()));
}

export function updateSettings(patch: Partial<CarouselSettings>) {
  mutateProject(
    (d) => {
      d.settings = { ...d.settings, ...patch };
      const structural = 'showHeader' in patch || 'showFooter' in patch || 'showCounter' in patch;
      if (structural) {
        d.slides = d.slides.map((s, index) => applyTemplate(s, s.template, { index, total: d.slides.length, settings: d.settings, theme: s.theme }));
        return;
      }
      d.slides.forEach((s) =>
        s.elements.forEach((e) => {
          if (e.type !== 'text' || e.role !== 'chrome') return;
          if (patch.handle !== undefined && e.name === 'Handle') {
            e.text = patch.handle;
            e.height = measureTextElement(e);
          }
          if (patch.eyebrowDefault !== undefined && e.name === 'Cabeçalho') {
            e.text = patch.eyebrowDefault;
            e.height = measureTextElement(e);
          }
        }),
      );
    },
    { coalesceKey: `settings-${Object.keys(patch).join()}` },
  );
}

// ─────────────────────────────────────────── assets / images

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

export async function fileToAsset(file: File, kind: Asset['kind'] = 'photo'): Promise<Asset | null> {
  if (!ACCEPTED.includes(file.type)) {
    toast('Formato não suportado. Use PNG, JPG ou WEBP.');
    return null;
  }
  const src = await readFileAsDataURL(file);
  const { width, height } = await imageSize(src);
  return { id: uid('asset'), name: file.name, kind, src, width, height };
}

export function registerAsset(asset: Asset) {
  mutateProject((d) => (d.assets[asset.id] = asset), { history: false });
}

/** Inserts an image into the current slide (fills the template's photo slot, if any) */
export function insertImage(asset: Asset) {
  const slide = currentSlide();
  if (!slide) return;
  if (!state.project?.assets[asset.id]) registerAsset(asset);
  const slot = slide.elements.find((e) => e.role === 'photoSlot' && e.templateOwned);
  let el: ImageElement;
  if (slot) {
    el = makeImage(asset.id, { x: slot.x, y: slot.y, width: slot.width, height: slot.height, mask: 'arch', role: 'photo', name: asset.name, templateOwned: false });
    mutateSlide(slide.id, (s) => {
      const i = s.elements.findIndex((e) => e.id === slot.id);
      s.elements.splice(i, 1, el);
    });
    select([el.id]);
    return;
  }
  const maxW = 760;
  const ratio = asset.height / asset.width;
  const w = maxW;
  const h = Math.min(Math.round(w * ratio), 900);
  el = makeImage(asset.id, {
    x: (CANVAS.width - w) / 2,
    y: (CANVAS.height - h) / 2,
    width: w,
    height: h,
    cornerRadius: 0,
    name: asset.name,
    role: 'free',
    templateOwned: false,
  });
  addElement(el);
}

export async function loadBrandLogos(probe: (variant: LogoVariant) => Promise<Asset | null>, variants: LogoVariant[]) {
  const logos: Partial<Record<LogoVariant, Asset>> = {};
  try {
    const stored = await db.listBrandLogos();
    stored.forEach((r) => (logos[r.variant] = r.asset));
  } catch {
    /* IndexedDB unavailable */
  }
  await Promise.all(
    variants.map(async (v) => {
      if (logos[v]) return;
      const a = await probe(v);
      if (a) logos[v] = a;
    }),
  );
  setState({ brandLogos: logos });
}

export async function setBrandLogo(variant: LogoVariant, asset: Asset | null) {
  if (asset) await db.saveBrandLogo({ variant, asset: { ...asset, kind: 'logo', logoVariant: variant } });
  else await db.deleteBrandLogo(variant);
  setState((s) => {
    const logos = { ...s.brandLogos };
    if (asset) logos[variant] = asset;
    else delete logos[variant];
    return { brandLogos: logos };
  });
}

// ─────────────────────────────────────────── JSON import/export

export function exportProjectJSON() {
  const p = state.project;
  if (!p) return;
  const blob = new Blob([JSON.stringify({ format: 'all-green-carousel', version: 1, project: p }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${slugify(p.name)}.allgreen.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function importProjectJSON(file: File) {
  try {
    const data = JSON.parse(await file.text());
    const p: Project = data.project ?? data;
    if (!p || !Array.isArray(p.slides)) throw new Error('invalid');
    const imported: Project = { ...p, id: uid('proj'), updatedAt: Date.now(), assets: p.assets ?? {} };
    await db.saveProject(imported);
    openProjectObject(imported);
    toast('Projeto importado.');
  } catch {
    toast('Arquivo inválido. Use um JSON exportado pelo All Green Carousel Creator.');
  }
}

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'carrossel';

export function goNewProject() {
  if (state.dirty) void saveNow();
  setState({ view: 'new', project: null, selectedIds: [], previewOpen: false, exportOpen: false });
}
