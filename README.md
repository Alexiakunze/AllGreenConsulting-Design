# All Green Carousel Creator

Internal visual editor for All Green Consulting's Instagram carousels.
It does **not** generate images with AI: everything is vector (Konva/Canvas) and
editable, rendered as **1080 × 1350 px** PNGs.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # parser and template tests
npm run build      # production build (dist/)
```

## Flow

1. **Novo carrossel** → paste the text (`SLIDE 01`, `Slide 1:`, `Lâmina 2`, blank lines or `---`).
2. The parser detects the **structure** of each block (headline, paragraph, list, number,
   quote, A/B comparison, CTA, @/URL, news tag) and suggests a template. The text is never
   rewritten.
3. Review/switch the templates and create. Edit visually (drag, resize, double-click
   to type or crop), switch templates without losing content, add images, reorder slides.
4. **Exportar carrossel** → current slide (`01.png`) or all of them (ZIP with `01.png`, `02.png`…).

## Brand identity (source of truth)

Colors extracted from the official files in Drive (`Identidade Visual › PNG`):

| Token | Value | Origin |
| --- | --- | --- |
| `primary` | `#12403C` | Deep green of the logo |
| `secondary` / `accent` | `#C04E01` | Burnt orange of the symbol |
| `light` | `#EDEAE6` | Off-white of the negative wordmark |
| `muted` | `#698480` | "CONSULTING" (off-white at 40% over the green) |
| `dark`, `sand` | derived | Supporting tones |

The graphic motif is the **arch** from the logo symbol: it shows up as a shape,
as a photo mask and as an outline. Orange is used sparingly (highlights, numbers, arches).
Typography: **Space Grotesk** (300–700), bundled locally via `@fontsource`.

Official logos: see [`public/brand/README.md`](public/brand/README.md).

## Architecture

```
src/
  design-system/  designTokens.ts (colors, fonts, type scale, spacing, radius, shadows, margins)
                  brandAssets.ts (official logo files) · uiTokens.ts (editor interface only)
  types/          carouselTypes.ts (Project, Slide, SlideContent, elements)
  templates/      templates.ts (10 templates + applyTemplate/auto layout) · elementFactory.ts
  utils/          parser.ts (text → slides) · textLayout.ts (word wrap + *highlight*)
  editor/         store.ts (state, undo/redo, actions) · EditorCanvas.tsx (selection, snap,
                  transform, crop, inline editing) · nodes.tsx (render of each element) · SlideStage.tsx
  export/         exportPng.ts (off-screen render at 1080×1350, ZIP)
  storage/        db.ts (IndexedDB: projects and brand logos)
  components/     Dashboard, NewCarousel, EditorView, panels, properties, timeline, preview
```

- Elements store colors as **tokens** (`token:primary`); changing the palette in
  *Identidade* updates every slide.
- Template text is **bound** to the slide content: editing on the canvas updates the
  *Conteúdo* tab and vice versa. **Organizar layout** regenerates the composition from the
  content and keeps images and elements you added.
- The export re-renders each slide at scale 1 / pixelRatio 1 from the scene graph,
  with the same components as the editor (not a screenshot).

## Shortcuts

`Delete` delete · `⌘/Ctrl+C` / `⌘/Ctrl+V` copy/paste · `⌘/Ctrl+Z` undo ·
`⌘/Ctrl+Shift+Z` redo · `⌘/Ctrl+D` duplicate · `⌘/Ctrl+S` save · arrows nudge (Shift = 10px) ·
`G` grid · `Esc` deselect · `Alt` while dragging turns off snap · `⌘/Ctrl+scroll` zoom.

## Text markup

- `*word*` → highlight in the accent color.
- Labels: `Eyebrow:`, `Título:`, `Texto:`, `Número:`, `Fonte:`, `Autor:`, `CTA:`, `Data:`,
  `Nome:`, `Tag:`, `Antes:` / `Depois:` (or `Mito:` / `Verdade:`, `A:` / `B:`).
- Lists: `- item`, `• item`, `1. item`. Quotes: `“…”` followed by `— Author`.
