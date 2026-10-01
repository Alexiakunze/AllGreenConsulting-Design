#!/usr/bin/env node
// Gera as imagens (1080 × 1350 px) dos posts de LinkedIn a partir de um imagens.json.
// uso: node linkedin/imagens.mjs linkedin/AA-MM-DD/imagens.json
// Cada item: { "arquivo", "kicker", "titulo" (palavra-chave entre *asteriscos*),
//              "dados": [{ "valor", "legenda" }], "fecho", "fonte" }
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const C = {
  green: '#133F38',
  orangeOnGreen: '#F07A2B',
  sand: '#F4EDE2',
  beige: '#E8DCC8',
  greenGray: '#A9C2BC',
};
const AUTOR = process.env.AUTOR || 'Atila Ghidoni · CEO, All Green Consulting';

const input = process.argv[2];
if (!input) {
  console.error('uso: node linkedin/imagens.mjs linkedin/AA-MM-DD/imagens.json');
  process.exit(1);
}
const outDir = dirname(resolve(input));
const items = JSON.parse(readFileSync(input, 'utf8'));

const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(file).toString('base64')}`;
const fontDir = dirname(require.resolve('@fontsource/space-grotesk/package.json')) + '/files';
const fontFaces = [400, 500, 600, 700]
  .map(
    (w) => `@font-face{font-family:'Space Grotesk';font-weight:${w};
src:url(${dataUri(`${fontDir}/space-grotesk-latin-${w}-normal.woff2`, 'font/woff2')}) format('woff2'),
url(${dataUri(`${fontDir}/space-grotesk-latin-ext-${w}-normal.woff2`, 'font/woff2')}) format('woff2');}`,
  )
  .join('\n');
const ESTAMPA = dataUri(`${HERE}/../newsletter/assets/estampa-outline-branca.png`, 'image/png');
const LOGO = dataUri(`${HERE}/assets/logo-horizontal-branca.png`, 'image/png');

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const kw = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');

const page = (it) => `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;font-family:'Space Grotesk',sans-serif;background:${C.green};color:#fff;position:relative;overflow:hidden}
body::before{content:'';position:absolute;inset:0;background:url(${ESTAMPA}) 0 0/420px auto repeat;opacity:.10}
.wrap{position:relative;height:100%;padding:84px 88px 72px;display:flex;flex-direction:column}
.logo{height:62px;width:auto;align-self:flex-start}
.kicker{margin-top:auto;display:flex;align-items:center;gap:22px;font-size:26px;letter-spacing:5px;text-transform:uppercase;color:${C.sand};font-weight:600}
.kicker i{display:block;width:64px;height:5px;background:${C.orangeOnGreen}}
.t{margin-top:34px;font-size:${it.titulo.length > 40 ? 84 : 100}px;line-height:1.05;font-weight:700;letter-spacing:-1.5px}
.t em{font-style:normal;color:${C.orangeOnGreen}}
.dados{margin-top:72px;display:flex;flex-direction:column;gap:30px}
.d{display:flex;gap:30px;align-items:baseline;border-top:2px solid rgba(232,220,200,.25);padding-top:26px}
.v{flex:none;min-width:${it.dados.some((d) => d.valor.length > 9) ? 360 : 300}px;font-size:${it.dados.length > 3 ? 46 : 56}px;font-weight:700;color:${C.orangeOnGreen};letter-spacing:-1px;line-height:1}
.l em{font-style:normal;font-weight:600;color:#fff}
.l{font-size:${it.dados.length > 3 ? 27 : 30}px;line-height:1.3;color:${C.sand}}
.fecho{margin-top:44px;font-size:36px;line-height:1.25;font-weight:600;color:#fff}
.rodape{margin-top:auto;padding-top:40px;display:flex;justify-content:space-between;align-items:flex-end;gap:30px;font-size:21px;color:${C.greenGray}}
.rodape b{font-weight:600;color:${C.sand}}
</style></head><body><div class="wrap">
<img class="logo" src="${LOGO}">
<div class="kicker"><i></i>${esc(it.kicker)}</div>
<div class="t">${kw(it.titulo)}</div>
<div class="dados">${it.dados.map((d) => `<div class="d"><div class="v">${esc(d.valor)}</div><div class="l">${kw(d.legenda)}</div></div>`).join('')}</div>
${it.fecho ? `<div class="fecho">${kw(it.fecho)}</div>` : ''}
<div class="rodape"><b>${esc(AUTOR)}</b><span>${esc(it.fonte)}</span></div>
</div></body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const tab = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
for (const it of items) {
  await tab.setContent(page(it), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  const out = `${outDir}/${it.arquivo}`;
  await tab.screenshot({ path: out });
  console.log(`PNG: ${out}`);
}
await browser.close();
