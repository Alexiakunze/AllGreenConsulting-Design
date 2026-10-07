#!/usr/bin/env node
// Gera a landing page semanal (HTML autônomo + PDF de página única) a partir de landing.json.
// uso: node landing/landing.mjs landing/AA-MM-DD/landing.json
import { readFileSync, writeFileSync } from 'node:fs';
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
const fonts = [400, 500, 600, 700]
  .map(
    (w) => `@font-face{font-family:'Space Grotesk';font-weight:${w};font-display:swap;
src:url(${dataUri(`${fontDir}/space-grotesk-latin-${w}-normal.woff2`, 'font/woff2')}) format('woff2'),
url(${dataUri(`${fontDir}/space-grotesk-latin-ext-${w}-normal.woff2`, 'font/woff2')}) format('woff2');}`,
  )
  .join('\n');
const ASSETS = `${HERE}/../newsletter/assets`;
const ESTAMPA = dataUri(`${ASSETS}/estampa-outline-branca.png`, 'image/png');
const LOGO = dataUri(`${ASSETS}/logo-horizontal-verde.png`, 'image/png');
const LOGO_CLARO = dataUri(`${HERE}/../linkedin/assets/logo-horizontal-offwhite.png`, 'image/png');

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s = '') =>
  esc(s)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
const cta = (cls = '') => `<a class="btn ${cls}" href="${esc(d.cta_url)}">${esc(d.cta_texto)}</a>`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>All Green News | ${esc(d.semana)}</title>
<meta name="description" content="${esc(d.hero.subtitulo)}">
<style>
${fonts}
:root{--green:${C.green};--orange:${C.orange};--orange-g:${C.orangeOnGreen};--sand:${C.sand};--beige:${C.beige};--brown:${C.brown};--text:${C.text};--text2:${C.text2}}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Space Grotesk',sans-serif;font-size:17px;line-height:1.6;color:var(--text);background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
a{color:inherit}
.wrap{max-width:1120px;margin:0 auto;padding:0 32px}
.tex{position:relative;overflow:hidden;background:var(--green)}
.tex::before{content:'';position:absolute;inset:0;background:url(${ESTAMPA}) 0 0/900px auto repeat;opacity:.12;pointer-events:none}
.tex>*{position:relative}
.btn{display:inline-block;background:var(--orange);color:#fff;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:.5px;padding:15px 28px;border-radius:999px;transition:background .2s}
.btn:hover{background:#a84a0c}
.btn.light{background:var(--orange-g)}
.sub{font-size:13px;letter-spacing:2.5px;text-transform:uppercase;color:var(--brown);font-weight:600;margin-bottom:12px}
h2{font-size:34px;line-height:1.15;font-weight:600;color:var(--green);letter-spacing:-.5px}
/* topo */
header.top{border-bottom:1.5px solid var(--orange)}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;height:84px}
header.top img{height:40px;width:auto;display:block}
header.top .btn{padding:11px 22px;font-size:14px}
/* hero */
.hero{padding:88px 0 0}
.hero .kick{display:flex;align-items:center;gap:14px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:var(--sand);font-weight:600}
.hero .kick i{display:block;width:40px;height:3px;background:var(--orange-g)}
.hero h1{margin-top:22px;max-width:860px;font-size:58px;line-height:1.05;font-weight:700;color:#fff;letter-spacing:-1.5px}
.hero h1 em{font-style:normal;color:var(--orange-g)}
.hero p.lead{margin-top:22px;max-width:680px;font-size:19px;color:${C.greenGray}}
.hero .actions{margin-top:34px}
.stats{margin-top:72px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid rgba(232,220,200,.25)}
.stat{padding:30px 28px 40px 0}
.stat+.stat{padding-left:28px;border-left:1px solid rgba(232,220,200,.25)}
.stat b{display:block;font-size:44px;line-height:1;font-weight:700;color:var(--orange-g);letter-spacing:-1px}
.stat span{display:block;margin-top:12px;font-size:15px;line-height:1.45;color:var(--sand)}
/* notícias */
section.news{padding:96px 0 40px}
.news .head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:44px}
.news .head p{max-width:420px;color:var(--text2);font-size:16px}
.card{display:grid;grid-template-columns:72px 1fr;gap:28px;padding:40px 0;border-top:1px solid var(--beige);break-inside:avoid}
.num{width:52px;height:52px;border-radius:50%;background:var(--orange);color:#fff;font-weight:700;font-size:20px;display:flex;align-items:center;justify-content:center}
.card h3{font-size:26px;line-height:1.2;font-weight:600;color:var(--green);margin:4px 0 14px}
.card .body{display:grid;grid-template-columns:1.25fr 1fr;gap:36px;align-items:start}
.read{background:var(--sand);border-left:4px solid var(--orange);padding:20px 24px;font-size:16px;line-height:1.55}
.read .lbl{display:block;font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:var(--brown);font-weight:600;margin-bottom:6px}
.src{margin-top:14px;font-size:13px;color:var(--text2)}
/* contexto */
.ctx{padding:24px 0 96px}
.ctx .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.ctx .item{background:#FAF6EF;border:1px solid var(--beige);border-radius:14px;padding:24px}
.ctx .item b{display:block;font-size:13px;letter-spacing:2.5px;text-transform:uppercase;color:var(--brown);margin-bottom:8px;font-weight:600}
.ctx .item p{font-size:15px;line-height:1.55}
/* niw */
.niw{padding:96px 0}
.niw .grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start}
.niw h2{color:#fff}
.niw .sub{color:var(--sand)}
.niw p{color:${C.greenGray};margin-top:18px}
.steps{list-style:none;display:grid;gap:18px}
.steps li{display:grid;grid-template-columns:44px 1fr;gap:16px;align-items:start;background:rgba(244,237,226,.06);border:1px solid rgba(232,220,200,.18);border-radius:14px;padding:20px;color:#fff;font-size:16px}
.steps .n{width:36px;height:36px;border-radius:50%;background:var(--beige);color:var(--green);font-weight:700;display:flex;align-items:center;justify-content:center}
/* perfil */
.perfil{padding:96px 0}
.perfil .grid{display:grid;grid-template-columns:1fr 1.2fr;gap:64px;align-items:start}
.check{list-style:none;display:grid;gap:14px}
.check li{display:grid;grid-template-columns:28px 1fr;gap:14px;align-items:start;font-size:17px}
.check li::before{content:'';width:20px;height:20px;border:2px solid var(--ok,${C.ok});border-radius:4px;margin-top:3px}
.note{margin-top:22px;font-size:14px;color:var(--text2)}
/* fechamento */
.closing{padding:88px 0;text-align:center}
.closing h2{color:#fff;font-size:42px;max-width:760px;margin:0 auto}
.closing p{margin:18px auto 34px;max-width:620px;color:${C.greenGray};font-size:18px}
footer{padding:44px 0 56px;border-top:1px solid var(--beige)}
footer .wrap{display:grid;grid-template-columns:auto 1fr;gap:40px;align-items:start}
footer img{height:34px}
footer p{font-size:13px;color:var(--text2);line-height:1.6}
@media (max-width:860px){
  .wrap{padding:0 20px}
  .hero{padding-top:56px}.hero h1{font-size:38px}
  .stats,.ctx .grid,.niw .grid,.perfil .grid,.card .body{grid-template-columns:1fr}
  .stat+.stat{padding-left:0;border-left:0;border-top:1px solid rgba(232,220,200,.25)}
  .card{grid-template-columns:1fr;gap:12px}
  .news .head{flex-direction:column;align-items:flex-start}
  h2{font-size:28px}.closing h2{font-size:30px}
  footer .wrap{grid-template-columns:1fr}
  header.top .btn{display:none}
}
</style></head><body>
<header class="top"><div class="wrap"><img src="${LOGO}" alt="All Green Consulting">${cta()}</div></header>

<section class="hero tex"><div class="wrap">
  <div class="kick"><i></i>${esc(d.hero.kicker)}</div>
  <h1>${inline(d.hero.titulo)}</h1>
  <p class="lead">${esc(d.hero.subtitulo)}</p>
  <div class="actions">${cta('light')}</div>
  <div class="stats">${d.hero.dados.map((s) => `<div class="stat"><b>${esc(s.valor)}</b><span>${esc(s.legenda)}</span></div>`).join('')}</div>
</div></section>

<section class="news"><div class="wrap">
  <div class="head"><div><div class="sub">As notícias da semana</div><h2>O que mudou e o que isso significa</h2></div>
  <p>Cada fato tem data e fonte. Proposta é tratada como proposta; projeção, como projeção.</p></div>
  ${d.noticias
    .map(
      (n, i) => `<article class="card"><div class="num">${i + 1}</div><div>
    <div class="sub">${esc(n.tag)}</div><h3>${esc(n.titulo)}</h3>
    <div class="body"><p>${esc(n.texto)}</p><div class="read"><span class="lbl">A leitura</span>${esc(n.leitura)}</div></div>
    <p class="src">Fontes: ${inline(n.fonte)}</p></div></article>`,
    )
    .join('\n')}
</div></section>

<section class="ctx"><div class="wrap"><div class="sub">Também em vigor</div>
  <div class="grid">${d.contexto.map((c) => `<div class="item"><b>${esc(c.rotulo)}</b><p>${esc(c.texto)}</p></div>`).join('')}</div>
</div></section>

<section class="niw tex"><div class="wrap"><div class="grid">
  <div><div class="sub">EB-2 NIW</div><h2>${esc(d.niw.titulo)}</h2><p>${esc(d.niw.texto)}</p></div>
  <ol class="steps">${d.niw.criterios.map((c, i) => `<li><span class="n">${i + 1}</span><span>${esc(c)}</span></li>`).join('')}</ol>
</div></div></section>

<section class="perfil"><div class="wrap"><div class="grid">
  <div><div class="sub">Elegibilidade</div><h2>${esc(d.perfil.titulo)}</h2></div>
  <div><ul class="check">${d.perfil.itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  <p class="note">Os três primeiros itens são as formas de se qualificar ao EB-2; basta uma delas. A área de atuação ajuda a construir o argumento de importância nacional.</p></div>
</div></div></section>

<section class="closing tex"><div class="wrap">
  <h2>${esc(d.fechamento.titulo)}</h2><p>${esc(d.fechamento.texto)}</p>${cta('light')}
</div></section>

<footer><div class="wrap"><img src="${LOGO}" alt="All Green Consulting"><p>${esc(d.aviso)}</p></div></footer>
</body></html>`;

const htmlPath = `${dir}/index.html`;
writeFileSync(htmlPath, html);
console.log(`HTML: ${htmlPath}`);

// PDF: página única com a landing inteira na largura de desktop.
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
const pdfPath = `${dir}/landing.pdf`;
await page.pdf({ path: pdfPath, width: '1280px', height: `${height + 2}px`, printBackground: true, pageRanges: '1' });
await browser.close();
console.log(`PDF: ${pdfPath}`);
