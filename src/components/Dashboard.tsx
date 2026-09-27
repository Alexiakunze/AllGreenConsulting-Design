import { useEffect, useRef, useState } from 'react';
import * as db from '../storage/db';
import type { ProjectMeta } from '../types/carouselTypes';
import { duplicateProject, importProjectJSON, openProject, setState } from '../editor/store';
import { AppMark, Icon } from './Icons';
import { Button } from './ui';

export function Dashboard() {
  const [projects, setProjects] = useState<ProjectMeta[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () =>
    db
      .listProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="h-full overflow-auto">
      <header className="flex items-center justify-between border-b border-line bg-panel px-10 py-5">
        <div className="flex items-center gap-3">
          <AppMark size={34} />
          <div>
            <div className="text-[15px] font-semibold tracking-tight">All Green Carousel Creator</div>
            <div className="text-[11.5px] text-muted">Editor de carrosséis · identidade All Green Consulting</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importProjectJSON(f);
              e.target.value = '';
            }}
          />
          <Button onClick={() => fileRef.current?.click()}>
            <Icon.upload /> Importar projeto
          </Button>
          <Button variant="primary" onClick={() => setState({ view: 'new' })}>
            <Icon.plus /> Novo carrossel
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-10 py-10">
        <section className="mb-12 grid grid-cols-[1.3fr_1fr] gap-8 rounded-2xl bg-brand p-10 text-offwhite">
          <div>
            <div className="eyebrow !text-accent">Fluxo</div>
            <h1 className="mt-3 text-[40px] font-semibold leading-[1.02] tracking-[-0.03em]">
              Cole o texto. <br />O sistema cuida do design.
            </h1>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-offwhite/70">
              Você controla o conteúdo. O Carousel Creator aplica o grid, a tipografia Space Grotesk, as cores e os elementos editoriais da All Green — e exporta PNGs 1080×1350.
            </p>
            <Button variant="accent" size="lg" className="mt-7" onClick={() => setState({ view: 'new' })}>
              <Icon.plus /> Novo carrossel
            </Button>
          </div>
          <ol className="grid grid-cols-2 gap-3 self-center text-[12.5px]">
            {['Cole o texto com SLIDE 01, SLIDE 02…', 'Revise os templates sugeridos', 'Edite visualmente cada slide', 'Exporte 01.png, 02.png… em ZIP'].map((t, i) => (
              <li key={t} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-[22px] font-bold text-accent">{String(i + 1).padStart(2, '0')}</div>
                <div className="mt-1 leading-snug text-offwhite/85">{t}</div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight">Projetos</h2>
          <span className="text-[12px] text-muted">Salvos localmente neste navegador</span>
        </div>

        {projects === null ? (
          <div className="text-muted">Carregando…</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong p-12 text-center text-muted">
            Nenhum projeto ainda. Clique em <b className="text-ink">Novo carrossel</b> para começar.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-5">
            {projects.map((p) => (
              <div key={p.id} className="group overflow-hidden rounded-xl border border-line bg-panel transition-shadow hover:shadow-lg">
                <button className="block w-full" onClick={() => void openProject(p.id)}>
                  <div className="aspect-[4/5] w-full bg-line">
                    {p.thumbnail ? <img src={p.thumbnail} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                </button>
                <div className="flex items-start justify-between gap-2 p-3">
                  <button className="min-w-0 text-left" onClick={() => void openProject(p.id)}>
                    <div className="truncate text-[13px] font-semibold">{p.name}</div>
                    <div className="text-[11.5px] text-muted">
                      {p.slideCount} slides · {new Date(p.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                  <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                    <button title="Duplicar" className="rounded p-1 hover:bg-black/5" onClick={() => void duplicateProject(p.id).then(refresh)}>
                      <Icon.copy width={14} height={14} />
                    </button>
                    <button
                      title="Excluir"
                      className="rounded p-1 text-danger hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Excluir o projeto "${p.name}"?`)) void db.deleteProject(p.id).then(refresh);
                      }}
                    >
                      <Icon.trash width={14} height={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
