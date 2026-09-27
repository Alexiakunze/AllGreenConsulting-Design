import { useRef } from 'react';
import { duplicateProject, exportProjectJSON, goNewProject, importProjectJSON, saveNow, setState, useEditor } from '../../editor/store';
import { Icon } from '../Icons';
import { Button, Section } from '../ui';

export function ExportPanel() {
  const project = useEditor((s) => s.project)!;
  const lastSavedAt = useEditor((s) => s.lastSavedAt);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Section title="Exportar PNG">
        <p className="mb-3 text-[11.5px] leading-relaxed text-muted">
          Cada slide é renderizado diretamente em <b className="text-ink">1080 × 1350 px</b> (4:5), a partir do canvas vetorial — não é screenshot da tela.
        </p>
        <Button variant="primary" size="lg" className="w-full" onClick={() => setState({ exportOpen: true })}>
          <Icon.export /> Exportar carrossel
        </Button>
        <Button className="mt-2 w-full" onClick={() => setState({ previewOpen: true })}>
          <Icon.play /> Pré-visualizar antes
        </Button>
      </Section>

      <Section title="Projeto">
        <div className="space-y-2">
          <Button className="w-full" onClick={() => void saveNow()}>
            <Icon.save /> Salvar projeto
          </Button>
          <Button className="w-full" onClick={() => void duplicateProject()}>
            <Icon.copy /> Duplicar projeto
          </Button>
          <Button className="w-full" onClick={goNewProject}>
            <Icon.plus /> Novo projeto
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-faint">
          Salvo automaticamente no navegador (IndexedDB){lastSavedAt ? ` · último: ${new Date(lastSavedAt).toLocaleTimeString('pt-BR')}` : ''}.
        </p>
      </Section>

      <Section title="Arquivo do projeto (JSON)">
        <p className="mb-3 text-[11.5px] leading-relaxed text-muted">Inclui slides, textos, posições, cores, imagens, templates e configurações.</p>
        <div className="space-y-2">
          <Button className="w-full" onClick={exportProjectJSON}>
            <Icon.export /> Exportar projeto
          </Button>
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
          <Button className="w-full" onClick={() => fileRef.current?.click()}>
            <Icon.upload /> Importar projeto
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-faint">{project.slides.length} slides · {Object.keys(project.assets).length} imagens</p>
      </Section>
    </div>
  );
}
