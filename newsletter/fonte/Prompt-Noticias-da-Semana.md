Gere o All Green News da semana de [SEGUNDA dd/mm/aaaa] a [DOMINGO dd/mm/aaaa].

CONTEXTO
Sou SDR da All Green Consulting, consultoria brasileira de green card EB-2 NIW, e estou me preparando para ser closer. Este material é meu apoio de conteúdo nas calls com leads brasileiros. As pastas ficam em "All Green/All Green News/". As ferramentas de PDF ficam em "All Green News/_ferramentas/" (leia o LEIA-ME.md de lá antes de começar).

PASTAS E NOMES
- Pasta do mês: "AA-MM" (ex.: 26-10). Use o mês da segunda-feira da semana.
- Pasta da semana, dentro da pasta do mês: "AA-MM-DD" com a data da segunda-feira (ex.: 26-10-05).
- Arquivos da semana: "All-Green-News-Semana-AA-MM-DD.md" e ".pdf".
- Resumo do mês, na pasta do mês: "All-Green-News-AA-MM-Resumo-Mensal.md" e ".pdf".
- Antes de pesquisar, leia a semana anterior e o resumo mensal mais recente, para não repetir notícia velha e para saber o que precisa de atualização.

O QUE PESQUISAR (use agentes em paralelo, um por frente)
1. Imigração e EB-2 NIW: Visa Bulletin (Brasil = "Rest of World"), USCIS (políticas, alertas, tempos de processamento, taxas, dados de aprovação do NIW), Departamento de Estado e consulados, H-1B, Gold Card, carga pública, decisões judiciais, projetos de lei.
2. Deportações e economia: números do ICE e do DHS, impacto fiscal, Fed, Census, CBO, Previdência, falta de mão de obra.
3. Engenharia: por que os EUA precisam (déficit, infraestrutura, energia, data centers, chips, ordens executivas).
4. Agronomia: por que os EUA precisam (USDA, segurança alimentar, água, fertilizantes, soja/China, veterinários).
5. Saúde: por que os EUA precisam (HRSA, AAMC, enfermagem, áreas carentes, Physician NIW, licenças estaduais).
6. Tecnologia: por que os EUA precisam (BLS, IA, cyber, CISA, layoffs com os dois lados, H-1B).
7. Brasil: emigração, pesquisas sobre quem quer sair, vistos EB para brasileiros, câmbio.

REGRAS
- Só entra o que está válido hoje. Se algo foi revogado, derrubado, suspenso ou substituído, diga o status atual ou deixe de fora.
- Todo fato tem data e link da fonte. Não invente número. Se não achou, diga que não achou.
- Priorize o que foi publicado na semana. O que é anterior mas ainda está em vigor vai só na seção de contexto.
- Marque fonte secundária quando não conseguir confirmar na fonte original.
- Cada fato leva uma etiqueta: PODE AFIRMAR, PROJEÇÃO, EM ANDAMENTO, ARGUMENTO ou NÃO USAR.
- Seja honesto com notícia ruim (retrogressão, queda de aprovação, layoffs): traga e diga como falar dela.
- Português do Brasil, frases diretas, sem travessão.

ESTRUTURA EXATA DO ARQUIVO DA SEMANA
Linha 1: # All Green News | Semana de [dd] a [dd] de [mês] de [aaaa]
Linha 2: ### As notícias da semana que servem de argumento de venda · EB-2 NIW · Big Four
Linha 3: Atualizado em [data de hoje]. Cobre o que saiu entre segunda [dd/mm] e domingo [dd/mm], mais o contexto da semana anterior que ainda está em vigor. Etiquetas: PODE AFIRMAR · PROJEÇÃO · EM ANDAMENTO · ARGUMENTO · NÃO USAR (ver o resumo mensal).

## AS 5 NOTÍCIAS DA SEMANA
Para cada uma das 5 mais úteis para a venda:
### [n]. [Título curto que já diz a notícia]
Tabela com colunas: O que aconteceu | Data | Etiqueta
**Como usar na call:** "[frase pronta para falar ao lead]"
Fontes: [links no formato markdown, com data]

## TAMBÉM NA SEMANA (BIG FOUR)
Tabela com colunas: Setor | Notícia | Data | Fonte (pelo menos uma linha para engenharia, agronomia, saúde e tecnologia)

## CONTEXTO DA SEMANA ANTERIOR (AINDA EM VIGOR)
Tabela com colunas: O que | Data | Por que importa
Fontes: [links]

## O QUE FICAR DE OLHO NA PRÓXIMA SEMANA ([segunda] a [domingo])
Tabela com colunas: Evento | Data | O que muda

### Frase da semana
**Frase de SDR:** "[uma frase que resume a semana e puxa para o protocolo do I-140]"

RESUMO MENSAL
- Se o resumo do mês ainda não existe, crie a partir do resumo do mês anterior, atualizando tudo que mudou.
- Se já existe, atualize: troque dados vencidos, acrescente o que a semana trouxe de relevante, ajuste as partes "O que não dizer" e "Fontes" e mude a data de "Atualizado em".
- Mantenha a mesma estrutura de partes do resumo anterior.

FINALIZAÇÃO
1. Rode o glossário em cada arquivo alterado: python3 glossary.py [arquivo.md] "GLOSSÁRIO DE SIGLAS" (o script substitui o glossário antigo, se houver) (no mensal, use "PARTE [n] — GLOSSÁRIO DE SIGLAS"). Se aparecer sigla nova que o script não conhece, acrescente ao glossary.py.
2. Gere os PDFs com build.sh. Rodapé da semana: "All Green News · Semana [dd] a [dd/mm/aaaa]". Rodapé do mês: "All Green News · Resumo mensal · [Mês aaaa]".
3. Abra as imagens das páginas geradas e confira: capa, tabelas inteiras na página, destaques verdes. Corrija o que estiver quebrado.
4. Me entregue os PDFs e um resumo curto das 5 notícias e do que mudou no mensal.
