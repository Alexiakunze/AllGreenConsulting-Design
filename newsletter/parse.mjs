// Lê o .md da newsletter semanal (formato em Prompt-Newsletter-Semanal.md).
export function parse(md) {
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
      const [text, button = '', url = ''] = m[1].split('|').map((s) => s.trim());
      doc.cta = { text, button, url };
    } else if ((m = line.match(/^Rodapé:\s*(.+)/))) doc.footer = m[1];
    else if ((m = line.match(/^##\s+(.+)/))) {
      cur = { heading: m[1], tag: '', list: false, stat: null, blocks: [] };
      doc.sections.push(cur);
    } else if (!cur) doc.intro.push(line);
    else if ((m = line.match(/^Tag:\s*(.+)/))) cur.tag = m[1];
    else if ((m = line.match(/^Destaque:\s*(.+)/))) {
      const [value, caption = ''] = m[1].split('|').map((s) => s.trim());
      cur.stat = { value, caption };
    } else if (/^Tipo:\s*lista/.test(line)) cur.list = true;
    else if ((m = line.match(/^[-•]\s+(.+)/))) cur.blocks.push({ kind: 'item', text: m[1] });
    else if ((m = line.match(/^Fontes?:\s*(.+)/))) cur.blocks.push({ kind: 'sources', text: m[1] });
    else if ((m = line.match(/^\*\*(.+?):\*\*\s*(.+)/)))
      cur.blocks.push({ kind: 'highlight', label: m[1], text: m[2], alert: /^atenção/i.test(m[1]) });
    else cur.blocks.push({ kind: 'p', text: line });
  }
  return doc;
}
