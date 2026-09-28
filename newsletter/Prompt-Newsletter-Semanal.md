Gere a newsletter semanal da All Green a partir do All Green News da semana de [SEGUNDA dd/mm/aaaa].

ENTRADA
- O relatório interno da semana: "All Green News/AA-MM/AA-MM-DD/All-Green-News-Semana-AA-MM-DD.md".
- Esse relatório é material de SDR. A newsletter vai para leads e clientes, então é outro tom.

SAÍDA
- "newsletter/edicoes/AA-MM-DD/All-Green-Newsletter-AA-MM-DD.md" (pasta com a data da segunda-feira).
- Gere o HTML: node newsletter/newsletter.mjs [arquivo.md]  (opcional: LOGO_URL=<png hospedado> para usar o logo oficial).

REGRAS
- Só entra fato marcado PODE AFIRMAR. PROJEÇÃO só se vier dita como projeção. EM ANDAMENTO diz que ainda não é definitivo. NÃO USAR e ARGUMENTO nunca entram.
- Nada de frase de venda de call ("Como usar na call", "Frase de SDR"). Troque por "O que isso significa para você": uma frase informativa, sem prometer aprovação nem prazo.
- Não invente número. Mantenha data e link de fonte de cada notícia.
- Português do Brasil, frases curtas, sem travessão. Explique a sigla na primeira vez que aparecer (ou evite).
- Notícia ruim entra com honestidade, sem alarmismo.

ESTRUTURA EXATA DO .md
Linha 1: # [Título da edição] | Semana de [dd] a [dd] de [mês] de [aaaa]
Preheader: [uma linha que aparece na prévia do e-mail, até ~110 caracteres]
Edição: AA-MM-DD

[Saudação e um parágrafo curto de abertura]

Para cada uma das 5 notícias:
## [Título curto que já diz a notícia]
Tag: [Imigração | Vistos de trabalho | Câmbio | Engenharia | Agronomia | Saúde | Tecnologia | Economia | Brasil]
[1 a 2 parágrafos com o fato]
**O que isso significa para você:** [uma frase]
Fontes: [links markdown com data, separados por " · "]

## Rápidas da semana
Tipo: lista
- **[Setor]:** [notícia em uma linha]. [Fonte, data](link)   (uma para engenharia, agronomia, saúde e tecnologia)

## Fique de olho na próxima semana
Tipo: lista
- **[Evento]:** [o que muda]

CTA: [pergunta de chamada] | [texto do botão] | [link]
Rodapé: Este conteúdo é informativo e não substitui a análise individual do seu caso. Informações atualizadas em [dd/mm/aaaa].

FINALIZAÇÃO
1. Gere o HTML e abra no navegador (desktop e celular). Confira links, acentos e o botão.
2. Cole o HTML na ferramenta de e-mail (ou importe o arquivo) e envie um teste antes do disparo.
