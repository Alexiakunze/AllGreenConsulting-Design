/**
 * Saves a file. Inside a published Claude link it uses the viewer's
 * `downloads` capability (the viewer confirms the save); elsewhere
 * (npm run dev, local file) it uses a normal download.
 */
interface DownloadsNs {
  save(req: { filename: string; data: Blob | string }): Promise<unknown>;
}

let dlPromise: Promise<DownloadsNs | null> | null = null;

function getDownloads(): Promise<DownloadsNs | null> {
  const c = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
  if (!c?.use) return Promise.resolve(null);
  dlPromise ??= c.use('downloads').then((ns) => (ns as DownloadsNs) ?? null).catch(() => null);
  return dlPromise;
}

export async function saveFile(data: Blob, filename: string): Promise<'saved' | 'declined' | 'fallback'> {
  const dl = await getDownloads();
  if (dl) {
    try {
      await dl.save({ filename, data });
      return 'saved';
    } catch (e) {
      if ((e as { code?: string })?.code === 'declined') return 'declined';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(data);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'fallback';
}
