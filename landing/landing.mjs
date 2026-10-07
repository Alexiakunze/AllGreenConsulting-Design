#!/usr/bin/env node
// Gera a landing semanal em PDF (A4) no padrão da folha timbrada All Green, o mesmo da newsletter.
// uso: node landing/landing.mjs landing/AA-MM-DD/landing.json
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
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
  ok: '#2E7D4F',
  greenGray: '#A9C2BC',
};

const input = process.argv[2];
if (!input) {
  console.error('uso: node landing/landing.mjs landing/AA-MM-DD/landing.json');
  process.exit(1);
}
const dir = dirname(resolve(input));
const d = JSON.parse(readFileSync(input, 'utf8'));

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
const ASSETS = `${HERE}/../newsletter/assets`;
const ESTAMPA = dataUri(`${ASSETS}/estampa-outline-branca.png`, 'image/png');
const LOGO = dataUri(`${ASSETS}/logo-horizontal-verde.png`, 'image/png');

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s = '') =>
  esc(s)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

const DOC_NAME = `Landing · ${d.semana}`;
let n = 0;
const sec = (title, body, cls = '') => `<section class="${cls}"><div class="keep"><h2><span class="num">${++n}</span><span>${esc(title)}</span></h2></div>${body}</section>`;

const noticias = d.noticias
  .map(
    (x) => `<section class="story"><div class="keep"><div class="sub">${esc(x.tag)}</div>
<h2><span class="num">${++n}</span><span>${esc(x.titulo)}</span></h2><p>${esc(x.texto)}</p></div>
<div class="box"><span class="lbl">A leitura</span>${esc(x.leitura)}</div>
<p class="src">Fontes: ${inline(x.fonte)}</p></section>`,
  )
  .join('\n');

const numeros = `<section class="keep"><div class="sub">Os números da semana</div>
<table><thead><tr><th>Número</th><th>O que significa</th></tr></thead><tbody>${d.hero.dados
  .map((s) => `<tr><td>${esc(s.valor)}</td><td>${esc(s.legenda)}</td></tr>`)
  .join('')}</tbody></table></section>`;

const contexto = sec(
  'Também em vigor',
  `<table class="keep"><thead><tr><th>Tema</th><th>O que vale hoje</th></tr></thead><tbody>${d.contexto
    .map((c) => `<tr><td>${esc(c.rotulo)}</td><td>${esc(c.texto)}</td></tr>`)
    .join('')}</tbody></table>`,
  'keep',
);

const niw = sec(
  d.niw.titulo,
  `<p>${esc(d.niw.texto)}</p><ol class="steps">${d.niw.criterios
    .map((c, k) => `<li><span class="step">${k + 1}</span><span>${esc(c)}</span></li>`)
    .join('')}</ol>`,
  'keep',
);

const perfil = sec(
  d.perfil.titulo,
  `<ul class="check">${d.perfil.itens.map((t) => `<li><span class="sq"></span><span>${esc(t)}</span></li>`).join('')}</ul>
<p class="note">Os três primeiros itens são as formas de se qualificar ao EB-2; basta uma delas. A área de atuação ajuda a construir o argumento de importância nacional.</p>`,
  'keep',
);

const fechamento = `<div class="box keep cta"><span class="lbl">${esc(d.fechamento.titulo)}</span>${esc(d.fechamento.texto)}
<a class="btn" href="${esc(d.cta_url)}">${esc(d.cta_texto)}</a></div>`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>All Green News | ${esc(d.semana)}</title>
<meta name="description" content="${esc(d.hero.subtitulo)}">
<style>
${font('Space Grotesk', [400, 500, 600, 700])}
@page{size:A4;margin:30mm 18mm 22mm}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:'Space Grotesk',sans-serif;font-size:10.5pt;line-height:1.5;color:${C.text};background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
a{color:inherit}
p{margin:0 0 2.5mm}
.page{max-width:174mm;margin:0 auto}
.cover{position:relative;overflow:hidden;background:${C.green};border-radius:4mm;padding:7mm 10mm 6mm;margin-bottom:5mm}
.cover::before{content:'';position:absolute;inset:0;background:url(${ESTAMPA}) 0 0/150mm auto repeat;opacity:.16}
.cover>*{position:relative}
.support{display:flex;align-items:center;gap:3mm;font-size:8pt;letter-spacing:2px;text-transform:uppercase;color:${C.sand};font-weight:600;margin-bottom:4mm}
.support i{display:inline-block;width:8mm;height:2px;background:${C.orangeOnGreen}}
h1{margin:0;font-size:27pt;line-height:1.1;font-weight:700;color:#fff}
h1 em{font-style:normal;color:${C.orangeOnGreen}}
.cover .line{margin-top:3mm;font-size:10.5pt;color:${C.greenGray}}
.lead{margin-bottom:5mm}
section{margin-bottom:6mm}
.keep{break-inside:avoid}
.sub{font-size:10pt;letter-spacing:2px;text-transform:uppercase;color:${C.brown};font-weight:500;margin-bottom:1.5mm}
h2{display:flex;gap:3mm;align-items:flex-start;margin:0 0 3mm;font-size:15pt;line-height:1.25;font-weight:600;color:${C.green}}
.num{flex:none;width:7.5mm;height:7.5mm;border-radius:50%;background:${C.orange};color:#fff;font-size:10.5pt;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:.2mm}
.box{margin:3mm 0;padding:3mm 4mm;border-left:3px solid ${C.orange};background:${C.sand};break-inside:avoid}
.lbl{display:block;font-size:8pt;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:${C.brown};margin-bottom:1mm}
.src{font-size:8.5pt;line-height:1.45;color:${C.text2}}
.src a{color:${C.text2}}
table{width:100%;border-collapse:collapse;font-size:9.5pt;line-height:1.45;break-inside:avoid}
th{background:${C.green};color:#fff;text-align:left;font-weight:600;padding:2mm 3mm}
td{padding:2mm 3mm;vertical-align:top}
tbody tr:nth-child(even) td{background:#FAF6EF}
td:first-child{color:${C.green};font-weight:600;white-space:nowrap}
.steps{list-style:none;margin:0;padding:0}
.steps li{display:flex;gap:3mm;align-items:flex-start;margin-bottom:2.5mm}
.step{flex:none;width:7mm;height:7mm;border-radius:50%;background:${C.beige};color:${C.green};font-weight:700;font-size:9.5pt;display:flex;align-items:center;justify-content:center}
.check{list-style:none;margin:0 0 2mm;padding:0}
.check li{display:flex;gap:3mm;align-items:flex-start;margin-bottom:2mm}
.sq{flex:none;width:4mm;height:4mm;border:1.5px solid ${C.ok};border-radius:.8mm;margin-top:1mm}
.note{font-size:8.5pt;color:${C.text2}}
.cta .btn{display:table;margin-top:3mm;background:${C.orange};color:#fff;text-decoration:none;font-weight:600;font-size:9.5pt;letter-spacing:.5px;padding:2.2mm 5mm;border-radius:999px}
.legal{font-size:8.5pt;color:${C.text2};margin-top:2mm}
</style></head><body><div class="page">
<div class="cover">
  <div class="support"><i></i>EB-2 NIW · All Green News</div>
  <h1>${inline(d.hero.titulo)}</h1>
  <div class="line">${esc(d.semana)}</div>
</div>
<p class="lead">${esc(d.hero.subtitulo)}</p>
${numeros}
${noticias}
${contexto}
${niw}
${perfil}
${fechamento}
<p class="legal">${esc(d.aviso)}</p>
</div></body></html>`;

const htmlPath = `${dir}/.landing.tmp.html`;
writeFileSync(htmlPath, html);

const fontFace = `<style>${font('SG', [400])}</style>`;
const header = `${fontFace}<div style="width:100%;margin:8mm 18mm 0;padding-bottom:2.5mm;border-bottom:1.2px solid ${C.orange};display:flex;align-items:flex-end;justify-content:space-between;gap:6mm;-webkit-print-color-adjust:exact">
<img src="${LOGO}" style="height:9mm;width:auto;display:block"><span style="font-family:SG,sans-serif;font-size:7.5pt;letter-spacing:1.5px;text-transform:uppercase;color:${C.brown};white-space:nowrap">${esc(DOC_NAME)}</span></div>`;
const footer = `${fontFace}<div style="width:100%;margin:0 18mm 8mm;padding-top:2mm;border-top:1px solid ${C.beige};display:flex;justify-content:space-between;font-family:SG,sans-serif;font-size:7.5pt;color:${C.text2};-webkit-print-color-adjust:exact">
<span>All Green Consulting · Dúvidas? Fale com o seu Care Team</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const pdfPath = `${dir}/landing.pdf`;
await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true, headerTemplate: header, footerTemplate: footer });
await browser.close();
rmSync(htmlPath);
console.log(`PDF: ${pdfPath}`);
