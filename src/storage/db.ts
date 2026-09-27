import type { Asset, LogoVariant, Project, ProjectMeta } from '../types/carouselTypes';

/**
 * Local persistence in IndexedDB (supports images in data URL,
 * unlike localStorage's ~5 MB limit).
 */
const DB_NAME = 'all-green-carousel-creator';
const DB_VERSION = 1;
const PROJECTS = 'projects';
const BRAND = 'brandKit';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(BRAND)) db.createObjectStore(BRAND, { keyPath: 'variant' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const saveProject = (p: Project) => tx(PROJECTS, 'readwrite', (s) => s.put(p)).then(() => undefined);
export const loadProject = (id: string) => tx<Project | undefined>(PROJECTS, 'readonly', (s) => s.get(id));
export const deleteProject = (id: string) => tx(PROJECTS, 'readwrite', (s) => s.delete(id)).then(() => undefined);

export async function listProjects(): Promise<ProjectMeta[]> {
  const all = await tx<Project[]>(PROJECTS, 'readonly', (s) => s.getAll());
  return all
    .map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt, slideCount: p.slides.length, thumbnail: p.thumbnail }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export interface BrandLogoRecord {
  variant: LogoVariant;
  asset: Asset;
}

export const saveBrandLogo = (r: BrandLogoRecord) => tx(BRAND, 'readwrite', (s) => s.put(r)).then(() => undefined);
export const deleteBrandLogo = (v: LogoVariant) => tx(BRAND, 'readwrite', (s) => s.delete(v)).then(() => undefined);
export const listBrandLogos = () => tx<BrandLogoRecord[]>(BRAND, 'readonly', (s) => s.getAll());
