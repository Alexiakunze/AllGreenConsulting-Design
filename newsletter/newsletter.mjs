#!/usr/bin/env node
// Converte o .md da newsletter semanal em HTML de e-mail (tabelas + estilos inline, 600px).
// uso: node newsletter/newsletter.mjs entrada.md [saida.html]
// Variáveis opcionais: LOGO_URL (PNG hospedado do logo negativo), SITE_URL.
import { readFileSync, writeFileSync } from 'node:fs';

const C = {
  primary: '#12403C',
  dark: '#0C2E2B',
  accent: '#C04E01',
  light: '#EDEAE6',
  sand: '#DCD6CE',
  muted: '#698480',
  text: '#1B2B29',
  white: '#FFFFFF',
};
const FONT = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";

const [, , input, output = input.replace(/\.md$/, '.html')] = process.argv;
if (!input) {
  console.error('uso: node newsletter/newsletter.mjs entrada.md [saida.html]');
  process.exit(1);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s, linkColor = C.primary) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color:${linkColor};text-decoration:underline;">$1</a>`);

// ---------- parse ----------
function parse(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const doc = { title: '', subtitle: '', preheader: '', edition: '', intro: [], sections: [], cta: null, footer: '' };
  const [title, subtitle = ''] = lines.shift().replace(/^#\s+/, '').split('|').map((s) => s.trim());
  Object.assign(doc, { title, subtitle });

  let cur = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let m;
    if ((m = line.match(/^Preheader:\s*(.+)/))) doc.preheader = m[1];
    else if ((m = line.match(/^Edição:\s*(.+)/))) doc.edition = m[1];
    else if ((m = line.match(/^CTA:\s*(.+)/))) {
      const [text, button, url] = m[1].split('|').map((s) => s.trim());
      doc.cta = { text, button, url };
    } else if ((m = line.match(/^Rodapé:\s*(.+)/))) doc.footer = m[1];
    else if ((m = line.match(/^##\s+(.+)/))) {
      cur = { heading: m[1], tag: '', list: false, blocks: [] };
      doc.sections.push(cur);
    } else if (!cur) doc.intro.push(line);
    else if ((m = line.match(/^Tag:\s*(.+)/))) cur.tag = m[1];
    else if (/^Tipo:\s*lista/.test(line)) cur.list = true;
    else if ((m = line.match(/^[-•]\s+(.+)/))) cur.blocks.push({ kind: 'item', text: m[1] });
    else if ((m = line.match(/^Fontes?:\s*(.+)/))) cur.blocks.push({ kind: 'sources', text: m[1] });
    else if ((m = line.match(/^\*\*(.+?):\*\*\s*(.+)/))) cur.blocks.push({ kind: 'highlight', label: m[1], text: m[2] });
    else cur.blocks.push({ kind: 'p', text: line });
  }
  return doc;
}

// ---------- render ----------
const p = (html, style = '') =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${C.text};${style}">${html}</p>`;

function renderBlock(b) {
  switch (b.kind) {
    case 'p':
      return p(inline(b.text));
    case 'highlight':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 16px;"><tr>
<td style="background:${C.light};border-left:4px solid ${C.accent};padding:14px 18px;font-family:${FONT};font-size:15px;line-height:1.55;color:${C.primary};">
<strong style="color:${C.accent};text-transform:uppercase;font-size:12px;letter-spacing:1px;">${esc(b.label)}</strong><br>${inline(b.text)}</td></tr></table>`;
    case 'sources':
      return p(`Fontes: ${inline(b.text, C.muted)}`, `font-size:12px;line-height:1.5;color:${C.muted};`);
    default:
      return '';
  }
}

function renderSection(s, n) {
  const eyebrow = s.list
    ? ''
    : `<p style="margin:0 0 6px;font-family:${FONT};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.accent};font-weight:700;">${String(n).padStart(2, '0')}${s.tag ? ` · ${esc(s.tag)}` : ''}</p>`;
  const items = s.blocks.filter((b) => b.kind === 'item');
  const list = items.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
        .map(
          (b) => `<tr><td valign="top" style="width:18px;padding:0 0 12px;font-family:${FONT};font-size:16px;line-height:1.55;color:${C.accent};font-weight:700;">&#8250;</td>
<td style="padding:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.55;color:${C.text};">${inline(b.text)}</td></tr>`,
        )
        .join('')}</table>`
    : '';
  const bg = s.list ? C.light : C.white;
  return `<tr><td style="background:${bg};padding:28px 40px 12px;${s.list ? '' : `border-top:1px solid ${C.sand};`}">
${eyebrow}<h2 style="margin:0 0 14px;font-family:${FONT};font-size:22px;line-height:1.25;color:${C.primary};font-weight:700;">${esc(s.heading)}</h2>
${s.blocks.filter((b) => b.kind !== 'item').map(renderBlock).join('\n')}${list}</td></tr>`;
}

function render(doc, { logoUrl = process.env.LOGO_URL, siteUrl = process.env.SITE_URL || 'https://allgreenconsulting.com' } = {}) {
  let n = 0;
  const sections = doc.sections.map((s) => renderSection(s, s.list ? 0 : ++n)).join('\n');
  const brand = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="All Green Consulting" width="180" style="display:block;border:0;max-width:180px;height:auto;">`
    : `<span style="font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:1px;color:${C.light};">ALL GREEN</span> <span style="font-family:${FONT};font-size:12px;letter-spacing:3px;color:${C.muted};">CONSULTING</span>`;
  const cta = doc.cta
    ? `<tr><td style="background:${C.primary};padding:36px 40px;text-align:center;">
<p style="margin:0 0 20px;font-family:${FONT};font-size:20px;line-height:1.35;color:${C.light};font-weight:700;">${inline(doc.cta.text, C.light)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td style="background:${C.accent};border-radius:999px;">
<a href="${esc(doc.cta.url)}" style="display:inline-block;padding:14px 32px;font-family:${FONT};font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${C.white};text-decoration:none;">${esc(doc.cta.button)}</a>
</td></tr></table></td></tr>`
    : '';

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(doc.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
<style>@media (max-width:620px){.wrap{width:100%!important}.wrap>tbody>tr>td{padding-left:22px!important;padding-right:22px!important}h1{font-size:28px!important}}</style>
</head>
<body style="margin:0;padding:0;background:${C.sand};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(doc.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${C.white};">
<tr><td style="background:${C.dark};padding:22px 40px;">${brand}</td></tr>
<tr><td style="background:${C.primary};padding:40px 40px 36px;">
<p style="margin:0 0 12px;font-family:${FONT};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${C.accent};font-weight:700;">All Green News · ${esc(doc.subtitle)}</p>
<h1 style="margin:0;font-family:${FONT};font-size:34px;line-height:1.1;color:${C.light};font-weight:700;text-transform:uppercase;letter-spacing:-0.5px;">${esc(doc.title)}</h1>
</td></tr>
<tr><td style="padding:32px 40px 12px;">${doc.intro.map((l) => p(inline(l))).join('\n')}</td></tr>
${sections}
${cta}
<tr><td style="background:${C.dark};padding:24px 40px;">
<p style="margin:0 0 8px;font-family:${FONT};font-size:12px;line-height:1.5;color:${C.muted};">${inline(doc.footer, C.light)}</p>
<p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.5;color:${C.muted};">All Green Consulting · <a href="${esc(siteUrl)}" style="color:${C.light};">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a></p>
</td></tr>
</table></td></tr></table>
</body></html>
`;
}

writeFileSync(output, render(parse(readFileSync(input, 'utf8'))));
console.log(`HTML: ${output}`);
