// Gera o PDF (A4) da newsletter a partir do HTML. uso: node newsletter/pdf.mjs arquivo.html [saida.pdf]
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
const html = resolve(process.argv[2]);
const out = process.argv[3] || html.replace(/\.html$/, '.pdf');
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.goto('file://' + html, { waitUntil: 'networkidle' });
await p.addStyleTag({ content: '@page{size:A4;margin:0} .wrap>tbody>tr{break-inside:avoid} body{-webkit-print-color-adjust:exact;background:#FFFFFF!important} body>table,body>table>tbody>tr>td{background:#FFFFFF!important;padding:0!important}' });
await p.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '0', bottom: '0' }, scale: 1.2 });
await b.close();
console.log(`PDF: ${out}`);
