#!/usr/bin/env node
// Gera o PDF (A4, folha timbrada All Green) de um artigo de blog em .md com front matter.
// uso: node blog/pdf.mjs blog/AA-MM-DD/artigo.md [saida.pdf]
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

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
  greenGray: '#A9C2BC',
};

const [, , input, outArg] = process.argv;
if (!input) {
  console.error('uso: node blog/pdf.mjs blog/AA-MM-DD/artigo.md [saida.pdf]');
  process.exit(1);
}
const out = resolve(outArg || input.replace(/\.md$/, '.pdf'));

const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(file).toString('base64')}`;
const fontDir = dirname(require.resolve('@fontsource/space-grotesk/package.json')) + '/files';
const font = (family, weights) =>
  weights
    .map(
      (w) => `@font-face{font-family:'${family}';font-weight:${w};
src:url(${dataUri(`${fontDir}/space-grotesk-latin-${w}-normal.woff2`, 'font/woff2')}) format('woff2'),
url(${dataUri(`${fontDir}/space-grotesk-latin-ext-${w}-normal.woff2`, 'font/woff2')}) format('woff2');}`,
    )
    .join('\n');
const ESTAMPA = dataUri(`${HERE}/../newsletter/assets/estampa-outline-branca.png`, 'image/png');
const LOGO = dataUri(`${HERE}/../newsletter/assets/logo-horizontal-verde.png`, 'image/png');

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

// ---------- front matter + markdown simples ----------
const raw = readFileSync(input, 'utf8').replace(/\r/g, '');
const fm = {};
let body = raw;
const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
if (m) {
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (kv) fm[kv[1]] = kv[2];
  }
  body = raw.slice(m[0].length);
}

let h1 = '';
const blocks = [];
const lines = body.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  let mm;
  if ((mm = line.match(/^# (.+)/))) h1 = mm[1];
  else if ((mm = line.match(/^## (.+)/))) blocks.push(`<h2>${inline(mm[1])}</h2>`);
  else if (/^---\s*$/.test(line)) blocks.push('<hr>');
  else if (line.startsWith('|')) {
    const rows = [];
    while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
    i--;
    const cells = (r) => r.split('|').slice(1, -1).map((c) => c.trim());
    const [head, , ...rest] = rows;
    blocks.push(
      `<table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rest
        .map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`,
    );
  } else if (/^(\d+\.|-) /.test(line)) {
    const ordered = /^\d+\./.test(line);
    const items = [];
    while (i < lines.length && /^(\d+\.|-) /.test(lines[i])) items.push(lines[i++].replace(/^(\d+\.|-) /, ''));
    i--;
    blocks.push(
      ordered
        ? `<ol class="steps">${items.map((t, k) => `<li><span class="step">${k + 1}</span><span>${inline(t)}</span></li>`).join('')}</ol>`
        : `<ul>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ul>`,
    );
  } else if (/^\*\*Fontes:\*\*/.test(line)) blocks.push(`<p class="src">${inline(line)}</p>`);
  else if (/^\*\*Links internos sugeridos:\*\*/.test(line)) blocks.push(`<div class="tag"><span class="lbl">Links internos sugeridos</span>${inline(line.replace(/^\*\*Links internos sugeridos:\*\*\s*/, ''))}</div>`);
  else if (/^\*[^*].*\*$/.test(line)) blocks.push(`<p class="legal">${inline(line)}</p>`);
  else if (/^\*\*.+\*\*$/.test(line) && lines[i + 1] && !lines[i + 1].startsWith('**')) blocks.push(`<p class="q">${inline(line)}</p>`);
  else blocks.push(`<p>${inline(line)}</p>`);
}

const DOC_NAME = 'Blog · All Green Consulting';
const seo = `<div class="seo keep">
<div><span class="lbl">Título SEO</span>${esc(fm.title_seo || '')}</div>
<div><span class="lbl">Meta description</span>${esc(fm.meta_description || '')}</div>
<div class="row"><div><span class="lbl">Slug</span>/${esc(fm.slug || '')}</div><div><span class="lbl">Palavra-chave</span>${esc(fm.palavra_chave || '')}</div></div>
<div><span class="lbl">Palavras secundárias</span>${esc(fm.palavras_secundarias || '')}</div>
</div>`;

const [titleA, ...titleB] = h1.split(':');
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(fm.title_seo || h1)}</title>
<style>
${font('Space Grotesk', [400, 500, 600, 700])}
@page{size:A4;margin:30mm 18mm 22mm}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:'Space Grotesk',sans-serif;font-size:10.5pt;line-height:1.5;color:${C.text};-webkit-print-color-adjust:exact;print-color-adjust:exact}
a{color:inherit}
p{margin:0 0 2.5mm}
.cover{position:relative;overflow:hidden;background:${C.green};border-radius:4mm;padding:8mm 10mm 7mm;margin-bottom:6mm}
.cover::before{content:'';position:absolute;inset:0;background:url(${ESTAMPA}) 0 0/150mm auto repeat;opacity:.16}
.cover>*{position:relative}
.support{display:flex;align-items:center;gap:3mm;font-size:8pt;letter-spacing:2px;text-transform:uppercase;color:${C.sand};font-weight:600;margin-bottom:4mm}
.support i{display:inline-block;width:8mm;height:2px;background:${C.orangeOnGreen}}
h1{margin:0;font-size:22pt;line-height:1.15;font-weight:700;color:#fff}
h1 em{font-style:normal;color:${C.orangeOnGreen}}
.cover .line{margin-top:3mm;font-size:10pt;color:${C.greenGray}}
.seo{background:#FAF6EF;border:1px solid ${C.beige};border-radius:2mm;padding:3.5mm 4mm;margin-bottom:6mm;font-size:9pt;line-height:1.45;display:grid;gap:2mm}
.seo .row{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.lbl{display:block;font-size:7.5pt;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:${C.brown};margin-bottom:.5mm}
h2{margin:6mm 0 2.5mm;font-size:15pt;line-height:1.25;font-weight:600;color:${C.green};break-after:avoid}
h2+p{break-before:avoid}
ul{margin:0 0 3mm;padding-left:5mm}
li{margin-bottom:1.5mm}
.steps{list-style:none;margin:0 0 3mm;padding:0}
.steps li{display:flex;gap:3mm;align-items:flex-start;margin-bottom:2.5mm;break-inside:avoid}
.step{flex:none;width:6.5mm;height:6.5mm;border-radius:50%;background:${C.beige};color:${C.green};font-weight:700;font-size:9pt;display:flex;align-items:center;justify-content:center;margin-top:.3mm}
table{width:100%;border-collapse:collapse;font-size:9.5pt;line-height:1.45;margin:2mm 0 4mm;break-inside:avoid}
th{background:${C.green};color:#fff;text-align:left;font-weight:600;padding:2mm 3mm}
td{padding:2mm 3mm;vertical-align:top}
tbody tr:nth-child(even) td{background:#FAF6EF}
td:first-child{color:${C.green};font-weight:600}
.q{margin:4mm 0 1mm;color:${C.green};break-after:avoid}
hr{border:0;border-top:1px solid ${C.beige};margin:6mm 0 4mm}
hr+p{background:${C.sand};border-left:3px solid ${C.orange};padding:3mm 4mm;font-weight:500;break-inside:avoid}
.legal{font-size:8.5pt;color:${C.text2}}
.src{font-size:8.5pt;line-height:1.5;color:${C.text2}}
.src a{color:${C.text2}}
.tag{margin-top:3mm;background:#FAF6EF;padding:2.5mm 4mm;font-size:8.5pt;color:${C.text2};break-inside:avoid}
.keep{break-inside:avoid}
</style></head><body>
<div class="cover">
  <div class="support"><i></i>Blog · All Green News</div>
  <h1>${titleB.length ? `${esc(titleA)}:<em>${esc(titleB.join(':'))}</em>` : esc(h1)}</h1>
  <div class="line">Publicado em ${esc((fm.publicado || '').split('-').reverse().join('/'))}</div>
</div>
${seo}
${blocks.join('\n')}
</body></html>`;

const fontFace = `<style>${font('SG', [400])}</style>`;
const header = `${fontFace}<div style="width:100%;margin:8mm 18mm 0;padding-bottom:2.5mm;border-bottom:1.2px solid ${C.orange};display:flex;align-items:flex-end;justify-content:space-between;gap:6mm;-webkit-print-color-adjust:exact">
<img src="${LOGO}" style="height:9mm;width:auto;display:block"><span style="font-family:SG,sans-serif;font-size:7.5pt;letter-spacing:1.5px;text-transform:uppercase;color:${C.brown};white-space:nowrap">${esc(DOC_NAME)}</span></div>`;
const footer = `${fontFace}<div style="width:100%;margin:0 18mm 8mm;padding-top:2mm;border-top:1px solid ${C.beige};display:flex;justify-content:space-between;font-family:SG,sans-serif;font-size:7.5pt;color:${C.text2};-webkit-print-color-adjust:exact">
<span>All Green Consulting · Dúvidas? Fale com o seu Care Team</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true, headerTemplate: header, footerTemplate: footer });
await browser.close();
console.log(`PDF: ${out}`);
