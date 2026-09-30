#!/usr/bin/env node
// Gera a versão impressa (PDF A4) da newsletter no padrão "All Letter's" da All Green.
// uso: node newsletter/print.mjs entrada.md [saida.pdf]
// Variáveis opcionais: CHROME_PATH (Chrome/Chromium), EDICAO_LABEL (ex.: "09.26").
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import { parse } from './parse.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const C = {
  green: '#133F38',
  orange: '#C4570F',
  orangeOnGreen: '#F07A2B',
  sand: '#F4EDE2',
  beige: '#E8DCC8',
  brown: '#8A6A4B',
  text: '#1D2A27',
  text2: '#6E675C',
  ok: '#2E7D4F',
  alert: '#B3261E',
  alertBg: '#FBEEEC',
  greenGray: '#A9C2BC',
};
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const [, , input, outArg] = process.argv;
if (!input) {
  console.error('uso: node newsletter/print.mjs entrada.md [saida.pdf]');
  process.exit(1);
}
const out = resolve(outArg || input.replace(/\.md$/, '.pdf'));

const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(file).toString('base64')}`;
const fontDir = dirname(require.resolve('@fontsource/space-grotesk/package.json')) + '/files';
const fontFaces = [400, 500, 600, 700]
  .map(
    (w) => `@font-face{font-family:'Space Grotesk';font-weight:${w};font-style:normal;
src:url(${dataUri(`${fontDir}/space-grotesk-latin-${w}-normal.woff2`, 'font/woff2')}) format('woff2'),
url(${dataUri(`${fontDir}/space-grotesk-latin-ext-${w}-normal.woff2`, 'font/woff2')}) format('woff2');}`,
  )
  .join('\n');
const ESTAMPA = dataUri(`${HERE}/assets/estampa-outline-branca.png`, 'image/png');
const BANDEIRA = dataUri(`${HERE}/assets/bandeira.jpg`, 'image/jpeg');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

const doc = parse(readFileSync(input, 'utf8'));

// "AA-MM-DD" da edição → rótulo "MM.AA" do cabeçalho, como no modelo do Canva.
const [yy, mm] = (doc.edition || '').split('-');
const label = process.env.EDICAO_LABEL || (mm ? `${mm}.${yy}` : '');

const block = (b) => {
  if (b.kind === 'p') return `<p>${inline(b.text)}</p>`;
  if (b.kind === 'sources') return `<p class="src">Fontes: ${inline(b.text)}</p>`;
  if (b.kind === 'highlight')
    return `<div class="box ${b.alert ? 'alert' : 'tip'}"><span class="lbl">${esc(b.label)}</span>${inline(b.text)}</div>`;
  return '';
};

let n = 0;
const stories = doc.sections
  .filter((s) => !s.list)
  .map((s) => {
    n += 1;
    const panel = `<div class="panel tex">
  ${s.tag ? `<div class="kicker"><i></i>${esc(s.tag)}</div>` : ''}
  ${s.stat ? `<div class="stat">${esc(s.stat.value)}</div><div class="cap">${esc(s.stat.caption)}</div>` : ''}
</div>`;
    const text = `<div class="txt">
  <h2><span class="num">${n}</span><span>${esc(s.heading)}</span></h2>
  ${s.blocks.map(block).join('\n')}
</div>`;
    return `<section class="row ${n % 2 ? '' : 'flip'}">${n % 2 ? panel + text : text + panel}</section>`;
  })
  .join('\n');

const lists = doc.sections
  .filter((s) => s.list)
  .map((s, i) => {
    const items = s.blocks.filter((b) => b.kind === 'item');
    if (i === 0) {
      // Rápidas: tabela Setor | Notícia | Fonte
      const rows = items
        .map((b) => {
          const m = b.text.match(/^\*\*(.+?):\*\*\s*(.*?)\s*(\[[^\]]+\]\([^)]+\))?$/);
          return m
            ? `<tr><td>${esc(m[1])}</td><td>${inline(m[2])}</td><td>${m[3] ? inline(m[3]) : ''}</td></tr>`
            : `<tr><td></td><td colspan="2">${inline(b.text)}</td></tr>`;
        })
        .join('');
      return `<section class="plain keep"><h3>${esc(s.heading)}</h3>
<table><thead><tr><th>Setor</th><th>Notícia</th><th>Fonte</th></tr></thead><tbody>${rows}</tbody></table></section>`;
    }
    return `<section class="plain keep"><h3>${esc(s.heading)}</h3><ol class="steps">${items
      .map((b, k) => `<li><span class="step">${k + 1}</span><span>${inline(b.text)}</span></li>`)
      .join('')}</ol></section>`;
  })
  .join('\n');

const [titleMain, ...kw] = doc.title.split(/(green card)/i);
const title = kw.length ? `${esc(titleMain)}<em>${esc(kw.join(''))}</em>` : esc(doc.title);
const [greeting, ...intro] = doc.intro;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>All Letter's ${esc(label)}</title>
<style>
${fontFaces}
@page{size:A4;margin:12mm 0 16mm}
@page:first{margin-top:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:'Space Grotesk',sans-serif;font-size:10.5pt;line-height:1.5;color:${C.text};-webkit-print-color-adjust:exact;print-color-adjust:exact}
a{color:inherit}
.tex{position:relative;background:${C.green};overflow:hidden}
.tex::before{content:'';position:absolute;inset:0;background:url(${ESTAMPA}) 0 0/70mm auto repeat;opacity:.14}
.tex>*{position:relative}
.mast{height:34mm;display:flex;align-items:center;gap:8mm;padding:0 14mm}
.mast .brand{font-size:40pt;font-weight:600;color:#EDEAE6;letter-spacing:-1px;line-height:1}
.mast .rule{flex:1;height:1.4px;background:#EDEAE6;opacity:.9}
.mast .ed{font-size:24pt;font-weight:600;color:#EDEAE6;line-height:1}
.flag{height:28mm;background:url(${BANDEIRA}) center 38%/cover}
.row,.intro{display:grid;grid-template-columns:43% 57%;break-inside:avoid}
.row.flip{grid-template-columns:57% 43%}
.panel{padding:9mm 8mm;display:flex;flex-direction:column;justify-content:center;min-height:48mm}
.kicker{display:flex;align-items:center;gap:3mm;font-size:7.5pt;letter-spacing:2px;text-transform:uppercase;color:${C.sand};font-weight:600;margin-bottom:5mm}
.kicker i{display:inline-block;width:7mm;height:2px;background:${C.orangeOnGreen}}
.stat{font-size:30pt;font-weight:700;color:${C.orangeOnGreen};line-height:1.05;letter-spacing:-.5px}
.cap{margin-top:3mm;font-size:9pt;line-height:1.4;color:${C.greenGray}}
.intro .panel h1{margin:0;font-size:24pt;line-height:1.1;font-weight:700;color:#fff}
.intro .panel h1 em{font-style:normal;color:${C.orangeOnGreen}}
.intro .panel .sub{margin-top:4mm;font-size:9.5pt;color:${C.greenGray}}
.txt{padding:6mm 18mm 4mm 9mm}
.row.flip .txt{padding:6mm 9mm 4mm 18mm}
.intro .txt{padding:9mm 18mm 8mm 9mm}
.hello{margin:0 0 3mm;font-size:21pt;font-weight:700;color:${C.green};line-height:1.15;text-shadow:1.5px 1.5px 0 ${C.beige}}
p{margin:0 0 2.6mm}
h2{display:flex;gap:3mm;align-items:flex-start;margin:0 0 3mm;font-size:15pt;line-height:1.2;font-weight:600;color:${C.green};break-after:avoid}
.num{flex:none;width:8mm;height:8mm;border-radius:50%;background:${C.orange};color:#fff;font-size:10.5pt;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:.3mm}
.box{margin:3mm 0;padding:3mm 4mm;border-left:3px solid ${C.orange};background:${C.sand};font-size:10pt;line-height:1.45}
.box.alert{border-left-color:${C.alert};background:${C.alertBg}}
.lbl{display:block;font-size:7.5pt;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:${C.brown};margin-bottom:1mm}
.box.alert .lbl{color:${C.alert}}
.src{font-size:7.5pt;line-height:1.4;color:${C.text2};margin-top:2mm}
.src a{color:${C.text2}}
.row+.row{border-top:1px solid ${C.beige}}
.plain{padding:4mm 18mm 0}
.keep{break-inside:avoid}
h3{margin:0 0 3mm;font-size:10pt;letter-spacing:2px;text-transform:uppercase;color:${C.brown};font-weight:600;break-after:avoid}
table{width:100%;border-collapse:collapse;font-size:9pt;line-height:1.4}
th{background:${C.green};color:#fff;text-align:left;font-weight:600;padding:2.2mm 3mm;font-size:8.5pt;letter-spacing:1px;text-transform:uppercase}
td{padding:1.5mm 3mm;vertical-align:top;border-bottom:1px solid ${C.beige}}
tbody tr:nth-child(even) td{background:#FAF6EF}
td:first-child{color:${C.green};font-weight:600;white-space:nowrap}
td:last-child{font-size:8pt;color:${C.text2};width:30mm}
td a{color:${C.text2}}
.steps{list-style:none;margin:0;padding:0}
.steps li{display:flex;gap:3mm;align-items:flex-start;margin-bottom:2mm}
.step{flex:none;width:7mm;height:7mm;border-radius:50%;background:${C.beige};color:${C.green};font-weight:700;font-size:9.5pt;display:flex;align-items:center;justify-content:center}
.close{margin-top:3mm;background:${C.orange};padding:4mm 18mm;break-inside:avoid;position:relative;overflow:hidden}
.close::before{content:'';position:absolute;inset:0;background:url(${ESTAMPA}) 0 0/70mm auto repeat;opacity:.12}
.close>*{position:relative}
.close .q{font-size:14pt;font-weight:600;color:#fff;margin:0 0 2mm}
.close .b{font-size:9pt;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.sand}}
.legal{margin:3mm 0 0;font-size:7.5pt;color:#FBE3D2}
</style></head><body>
<header class="mast tex"><div class="brand">All Letter’s</div><div class="rule"></div><div class="ed">${esc(label)}</div></header>
<div class="flag"></div>
<section class="intro">
  <div class="panel tex">
    <div class="kicker"><i></i>All Green News · EB-2 NIW</div>
    <h1>${title}</h1>
    <div class="sub">${esc(doc.subtitle)}</div>
  </div>
  <div class="txt"><p class="hello">${esc(greeting || '')}</p>${intro.map((l) => `<p>${inline(l)}</p>`).join('')}</div>
</section>
${stories}
${lists}
${doc.cta ? `<section class="close"><p class="q">${inline(doc.cta.text)}</p>${doc.cta.button ? `<div class="b">${esc(doc.cta.button)}</div>` : ''}${doc.footer ? `<p class="legal">${inline(doc.footer)}</p>` : ''}</section>` : ''}
</body></html>`;

const footer = `<style>@font-face{font-family:'SG';src:url(${dataUri(`${fontDir}/space-grotesk-latin-400-normal.woff2`, 'font/woff2')}) format('woff2'),url(${dataUri(`${fontDir}/space-grotesk-latin-ext-400-normal.woff2`, 'font/woff2')}) format('woff2')}</style><div style="width:100%;margin:0 18mm;padding-top:2mm;border-top:1px solid ${C.beige};display:flex;justify-content:space-between;font-family:SG,sans-serif;font-size:7.5pt;color:${C.text2};-webkit-print-color-adjust:exact">
<span>All Green Consulting · Dúvidas? Fale com o seu Care Team</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`;

const htmlPath = out.replace(/\.pdf$/, '.print.html');
writeFileSync(htmlPath, html);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: out,
  preferCSSPageSize: true,
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: footer,
});
await browser.close();
console.log(`PDF: ${out}`);
