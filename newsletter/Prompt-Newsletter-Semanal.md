Gere a newsletter semanal da All Green a partir do All Green News da semana de [SEGUNDA dd/mm/aaaa].

ENTRADA
- O relatório interno da semana: "All Green News/AA-MM/AA-MM-DD/All-Green-News-Semana-AA-MM-DD.md".
- Esse relatório é material de SDR. A newsletter ("All Letter's") vai para os clientes, quem já tem processo com a All Green. Fale com eles ("você"), abrindo com "Prezado(a) imigrante,".

SAÍDA
- "newsletter/edicoes/AA-MM-DD/All-Green-Newsletter-AA-MM-DD.md" (pasta com a data da segunda-feira).
- E-mail: node newsletter/newsletter.mjs [arquivo.md]  (opcional: LOGO_URL=<png hospedado> para usar o logo oficial).
- PDF A4 no padrão All Letter's: node newsletter/print.mjs [arquivo.md]  (no Mac: CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").

REGRAS
- Só entra fato marcado PODE AFIRMAR. PROJEÇÃO só se vier dita como projeção. EM ANDAMENTO diz que ainda não é definitivo. NÃO USAR e ARGUMENTO nunca entram.
- Nada de frase de venda de call ("Como usar na call", "Frase de SDR"). Troque por "O que isso significa para você": uma frase informativa, sem prometer aprovação nem prazo.
- Notícia que pode afetar o processo do cliente (retrogressão, nova exigência, taxa) usa "**Atenção:**" no lugar de "O que isso significa para você" (vira caixa vermelha) e sempre manda falar com o Care Team antes de agir.
- Confira o Visa Bulletin mais recente antes de fechar a edição. Se saiu depois do relatório da semana, ele entra como notícia 1.
- Não invente número. Mantenha data e link de fonte de cada notícia.
- Português do Brasil, frases curtas, sem travessão. Explique a sigla na primeira vez que aparecer (ou evite).
- Notícia ruim entra com honestidade, sem alarmismo.

ESTRUTURA EXATA DO .md
Linha 1: # [Título da edição] | Semana de [dd] a [dd] de [mês] de [aaaa]
Preheader: [uma linha que aparece na prévia do e-mail, até ~110 caracteres]
Edição: AA-MM-DD

Prezado(a) imigrante,

[Um parágrafo curto de abertura]

Para cada uma das 4 ou 5 notícias:
## [Título curto que já diz a notícia]
Tag: [Imigração | Vistos de trabalho | Câmbio | Engenharia | Agronomia | Saúde | Tecnologia | Economia | Brasil]
Destaque: [número ou data curta, ex.: R$ 5,16] | [legenda de uma linha]
[1 a 2 parágrafos com o fato]
**O que isso significa para você:** [uma ou duas frases]   (ou **Atenção:** [..] quando for alerta)
Fontes: [links markdown com data, separados por " · "]

## Rápidas da semana
Tipo: lista
- **[Setor]:** [notícia em uma linha]. [Fonte, data](link)   (uma para engenharia, agronomia, saúde e tecnologia)

## Fique de olho nas próximas semanas
Tipo: lista
- **[Evento]:** [o que muda]

CTA: [pergunta de fechamento] | Fale com o seu Care Team
Rodapé: Este conteúdo é informativo e não substitui a análise individual do seu caso. Informações atualizadas em [dd/mm/aaaa].

FINALIZAÇÃO
1. Gere o HTML e o PDF. Abra os dois e confira: capa, destaques, caixas, tabela inteira na página, rodapé com número de página. O PDF deve caber em 3 páginas; se passar, enxugue o texto, não a fonte.
2. Cole o HTML na ferramenta de e-mail (ou importe o arquivo) e envie um teste antes do disparo.
