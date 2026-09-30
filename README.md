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

## Visual styles

- **Movimento** (default): inspired by the visual language of Dunamis Movement /
  Big Wave Media, translated to the All Green palette. It has giant uppercase headlines
  (Space Grotesk 700, tight leading and tracking), a poster frame (thin rules plus
  small-caps metadata `ALL GREEN CONSULTING … (03/08)`), film grain over the whole slide,
  full-bleed photos in black & white with a gradient in the background color, a
  full-width CTA bar and the logo arch as a tone-on-tone mass. Code:
  `src/templates/movementTemplates.ts`.
- **Editorial**: the original classic composition (`src/templates/templates.ts`).

Switch in **Identidade › Estilo visual** (it reorganizes every slide without changing the text);
the grain intensity is adjusted on the same screen.

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

## Weekly newsletter (All Green News)

`newsletter/` turns the internal weekly **All Green News** report into the
client newsletter (All Letter's), as email, in the brand palette (600px table
layout with inline styles, works in Gmail/Outlook/Apple Mail, responsive on mobile).

```bash
node newsletter/newsletter.mjs newsletter/edicoes/26-09-21/All-Green-Newsletter-26-09-21.md
# optional: LOGO_URL=https://…/logo-negativo.png SITE_URL=https://allgreenconsulting.com
```

- `newsletter/Prompt-Newsletter-Semanal.md`: weekly instructions (what goes in,
  tone, exact `.md` structure). Only facts tagged **PODE AFIRMAR** go in; the SDR
  call lines become "O que isso significa para você".
- `newsletter/print.mjs`: A4 PDF of an edition on the All Green letterhead: Space Grotesk
  only, margins 30/18/22 mm, header with the green horizontal logo and the document name
  over a thin orange rule, footer "All Green Consulting · Dúvidas? Fale com o seu Care Team"
  with page numbers, rounded green cover with the outline pattern, numbered sections,
  tip/alert boxes, green-header tables and step lists. `node newsletter/print.mjs <arquivo.md>`;
  `CHROME_PATH` points at Chrome on a Mac. Put the official logo at
  `newsletter/assets/logo-horizontal-verde.png` (until then a text wordmark is used).
- `newsletter/edicoes/AA-MM-DD/`: one folder per week (`.md` source + generated `.html` and `.pdf`).
- `newsletter/fonte/`: the internal research prompt (`Prompt-Noticias-da-Semana.md`),
  the latest monthly summary and the weekly reports, so the Monday routine can
  avoid repeating old news.
