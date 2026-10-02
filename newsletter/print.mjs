#!/usr/bin/env node
// Gera a versão impressa (PDF A4) da newsletter na folha timbrada da All Green.
// uso: node newsletter/print.mjs entrada.md [saida.pdf]
// Variáveis opcionais: CHROME_PATH (Chrome/Chromium). Logo: newsletter/assets/logo-horizontal-verde.png.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

const doc = parse(readFileSync(input, 'utf8'));

// "AA-MM-DD" da edição → rótulo "MM.AA" do cabeçalho, como no modelo do Canva.
const LOGO_FILE = `${HERE}/assets/logo-horizontal-verde.png`;
const LOGO = existsSync(LOGO_FILE)
  ? `<img src="${dataUri(LOGO_FILE, 'image/png')}" style="height:9mm;width:auto;display:block">`
  : `<div style="height:9mm;display:flex;flex-direction:column;justify-content:center;line-height:1;font-family:SG,sans-serif;color:${C.green}">
<span style="font-size:13pt;font-weight:700;letter-spacing:.5px">ALL GREEN</span><span style="font-size:5.5pt;letter-spacing:3.2px;color:${C.brown};margin-top:1px">CONSULTING</span></div>`;
const DOC_NAME = `Newsletter · ${doc.subtitle}`;

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
    const [first, ...rest] = s.blocks;
    return `<section class="story">
<div class="keep">${s.tag ? `<div class="sub">${esc(s.tag)}</div>` : ''}
<h2><span class="num">${n}</span><span>${esc(s.heading)}</span></h2>
${first ? block(first) : ''}</div>
${rest.map(block).join('\n')}
</section>`;
  })
  .join('\n');

const lists = doc.sections
  .filter((s) => s.list)
  .map((s, i) => {
    const items = s.blocks.filter((b) => b.kind === 'item');
    if (i === 0) {
      const rows = items
        .map((b) => {
          const m = b.text.match(/^\*\*(.+?):\*\*\s*(.*?)\s*(\[[^\]]+\]\([^)]+\))?$/);
          return m
            ? `<tr><td>${esc(m[1])}</td><td>${inline(m[2])}</td><td>${m[3] ? inline(m[3]) : ''}</td></tr>`
            : `<tr><td></td><td colspan="2">${inline(b.text)}</td></tr>`;
        })
        .join('');
      return `<section class="keep"><h2><span class="num">${++n}</span><span>${esc(s.heading)}</span></h2>
<table><thead><tr><th>Setor</th><th>Notícia</th><th>Fonte</th></tr></thead><tbody>${rows}</tbody></table></section>`;
    }
    return `<section class="keep"><h2><span class="num">${++n}</span><span>${esc(s.heading)}</span></h2><ol class="steps">${items
      .map((b, k) => `<li><span class="step">${k + 1}</span><span>${inline(b.text)}</span></li>`)
      .join('')}</ol></section>`;
  })
  .join('\n');

// Palavra-chave do título em laranja.
const parts = doc.title.split(/(green card)/i);
const title = parts.length > 1 ? `${esc(parts[0])}<em>${esc(parts[1])}</em>${esc(parts.slice(2).join(''))}` : esc(doc.title);
const [greeting, ...intro] = doc.intro;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(DOC_NAME)}</title>
<style>
${fontFaces}
@page{size:A4;margin:30mm 18mm 22mm}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:'Space Grotesk',sans-serif;font-size:10.5pt;line-height:1.5;color:${C.text};-webkit-print-color-adjust:exact;print-color-adjust:exact}
a{color:inherit}
p{margin:0 0 2.5mm}
.cover{position:relative;overflow:hidden;background:${C.green};border-radius:4mm;padding:7mm 10mm 6mm;margin-bottom:5mm}
.cover::before{content:'';position:absolute;inset:0;background:url(${ESTAMPA}) 0 0/150mm auto repeat;opacity:.16}
.cover>*{position:relative}
.support{display:flex;align-items:center;gap:3mm;font-size:8pt;letter-spacing:2px;text-transform:uppercase;color:${C.sand};font-weight:600;margin-bottom:4mm}
.support i{display:inline-block;width:8mm;height:2px;background:${C.orangeOnGreen}}
h1{margin:0;font-size:27pt;line-height:1.1;font-weight:700;color:#fff}
h1 em{font-style:normal;color:${C.orangeOnGreen}}
.cover .line{margin-top:3mm;font-size:10.5pt;color:${C.greenGray};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.greet{font-weight:600;color:${C.green}}
.intro{margin-bottom:6mm}
.story{margin-bottom:6mm}
.keep{break-inside:avoid}
.sub{font-size:10pt;letter-spacing:2px;text-transform:uppercase;color:${C.brown};font-weight:500;margin-bottom:1.5mm}
h2{display:flex;gap:3mm;align-items:flex-start;margin:0 0 3mm;font-size:15pt;line-height:1.25;font-weight:600;color:${C.green}}
.num{flex:none;width:7.5mm;height:7.5mm;border-radius:50%;background:${C.orange};color:#fff;font-size:10.5pt;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:.2mm}
.box{margin:3mm 0;padding:3mm 4mm;border-left:3px solid ${C.orange};background:${C.sand};break-inside:avoid}
.box.alert{border-left-color:${C.alert};background:${C.alertBg}}
.lbl{display:block;font-size:8pt;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:${C.brown};margin-bottom:1mm}
.box.alert .lbl{color:${C.alert}}
.src{font-size:8.5pt;line-height:1.45;color:${C.text2}}
.src a{color:${C.text2}}
section.keep{margin-bottom:6mm}
table{width:100%;border-collapse:collapse;font-size:9.5pt;line-height:1.45;break-inside:avoid}
th{background:${C.green};color:#fff;text-align:left;font-weight:600;padding:2mm 3mm}
td{padding:2mm 3mm;vertical-align:top}
tbody tr:nth-child(even) td{background:#FAF6EF}
td:first-child{color:${C.green};font-weight:600;white-space:nowrap}
td:last-child{font-size:8.5pt;color:${C.text2};width:32mm}
td a{color:${C.text2}}
.steps{list-style:none;margin:0;padding:0}
.steps li{display:flex;gap:3mm;align-items:flex-start;margin-bottom:2.5mm}
.step{flex:none;width:7mm;height:7mm;border-radius:50%;background:${C.beige};color:${C.green};font-weight:700;font-size:9.5pt;display:flex;align-items:center;justify-content:center}
.legal{font-size:8.5pt;color:${C.text2};margin-top:2mm}
</style></head><body>
<div class="cover">
  <div class="support"><i></i>EB-2 NIW · All Green News</div>
  <h1>${title}</h1>
  <div class="line">${esc(doc.subtitle)}</div>
</div>
<div class="intro"><p class="greet">${esc(greeting || '')}</p>${intro.map((l) => `<p>${inline(l)}</p>`).join('')}</div>
${stories}
${lists}
${doc.cta ? `<div class="box tip keep"><span class="lbl">${esc(doc.cta.button || 'Care Team')}</span>${inline(doc.cta.text)}</div>` : ''}
${doc.footer ? `<p class="legal">${inline(doc.footer)}</p>` : ''}
</body></html>`;

const fontFace = `<style>@font-face{font-family:'SG';font-weight:400;src:url(${dataUri(`${fontDir}/space-grotesk-latin-400-normal.woff2`, 'font/woff2')}) format('woff2')}
@font-face{font-family:'SG';font-weight:700;src:url(${dataUri(`${fontDir}/space-grotesk-latin-700-normal.woff2`, 'font/woff2')}) format('woff2')}</style>`;
const header = `${fontFace}<div style="width:100%;margin:0 18mm;padding-bottom:2.5mm;border-bottom:1.2px solid ${C.orange};display:flex;align-items:flex-end;justify-content:space-between;gap:6mm;-webkit-print-color-adjust:exact;margin-top:8mm">
${LOGO}<span style="font-family:SG,sans-serif;font-size:7.5pt;letter-spacing:1.5px;text-transform:uppercase;color:${C.brown};text-align:right;white-space:nowrap">${esc(DOC_NAME)}</span></div>`;
const footer = `${fontFace}<div style="width:100%;margin:0 18mm 8mm;padding-top:2mm;border-top:1px solid ${C.beige};display:flex;justify-content:space-between;font-family:SG,sans-serif;font-size:7.5pt;color:${C.text2};-webkit-print-color-adjust:exact">
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
  headerTemplate: header,
  footerTemplate: footer,
});
await browser.close();
console.log(`PDF: ${out}`);
