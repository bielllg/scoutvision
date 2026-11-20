# PROMPT — SCOUTVISION

## Plataforma profissional de análise estatística de futebol

### 1. Objetivo e execução

Desenvolva uma aplicação web completa chamada **ScoutVision**, especializada em análise estatística e visualização de dados do futebol. Construa uma ferramenta para analistas esportivos, observadores técnicos, jornalistas e fãs avançados que permita investigar atletas, comparar desempenhos, acompanhar equipes, explorar competições e identificar padrões estatísticos.

Trabalhe como engenheiro de produto com foco em desenvolvimento full stack, engenharia de dados, análise de futebol e design de aplicações analíticas. Comece inspecionando o workspace, suas instruções, o código, os arquivos de dados e as integrações já configuradas. Reaproveite o que for compatível com o produto. Se a pasta estiver vazia, inicialize o projeto. Implemente e valide os fluxos no ambiente, incluindo ingestão real e navegação no navegador.

Use as skills e ferramentas disponíveis que ajudem em cada etapa, entre elas design de webapps, Next.js/TypeScript, visualização de dados, ingestão, acessibilidade e testes de navegador. Consulte a documentação oficial e os conectores já disponíveis para confirmar formatos, permissões e cobertura. Quando uma ferramenta estiver indisponível, prossiga com uma alternativa compatível. Use autorização existente para acessar provedores e mantenha credenciais no servidor.

**Regra de dados:** publique apenas registros, imagens autorizadas e métricas rastreáveis a uma fonte real ou a um cálculo reproduzível sobre dados reais. Inclua uma base histórica real para rodar localmente sem uma assinatura comercial de dados. A ausência de um campo ou de uma licença de uso deve produzir um estado explícito na aplicação. Valores sintéticos ficam restritos a testes isolados.

### 2. Identidade visual e referências anexas

As duas imagens têm função de **referência visual**. Use a composição, a hierarquia, os componentes e a densidade. Nomes, clubes, idades, números, percentis, histórico, plano e avatar dos mockups têm função ilustrativa e devem ser substituídos por dados verificados ou por estados de cobertura. O texto deste prompt governa os requisitos e a metodologia.

| Referência | O que reproduzir no fluxo |
| --- | --- |
| [Imagem 1 — Comparador](referencias/01-comparador.png) | Sidebar, cabeçalho com recorte, cartões de atletas com cores consistentes, radar e barras espelhadas lado a lado, resumo da temporada e leitura estatística com acesso à metodologia. |
| [Imagem 2 — Perfil do jogador](referencias/02-perfil-jogador.png) | Cabeçalho do atleta e CTA de comparação, quatro indicadores prioritários, radar e campo lado a lado, evolução e últimas partidas abaixo. O percentil aparece no cabeçalho quando a amostra é elegível. |

- Tema escuro como padrão. Fundo grafite `#101719`, painéis cinza-esverdeados, bordas discretas, texto claro e detalhes em verde-lima `#B9ED63`. Use azul-claro como segunda cor analítica e rótulos ou padrões para distinguir séries independentemente da cor.
- Use Inter ou Geist, números tabulares, indicadores grandes, ícones lineares, espaçamento consistente e campos em SVG. Mantenha a densidade das referências no desktop e use divisórias, tipografia e alinhamento para ordenar a leitura.
- Use fotos, escudos e outros ativos com direitos de exibição e atribuição compatíveis. Use iniciais e identidade tipográfica como fallback. Mantenha perfis e estatísticas livres de copy promocional, elementos de apostas e controles decorativos.

### 3. Estrutura principal e navegação

Crie as rotas Dashboard, Jogadores, Equipes, Competições, Comparador, Mapas de calor, Análise avançada, Favoritos e Configurações. Inclua páginas de detalhe de jogadores, equipes e competições, com IDs estáveis em links compartilháveis.

- Busca global de jogadores, clubes e competições com navegação por teclado e busca insensível a caixa e acentos. Desambigue homônimos com clube ou seleção, posição e competição conforme o recorte.
- Seletor de competição e temporada baseado em cobertura real. Guarde o recorte e os filtros relevantes na URL em páginas navegáveis. Preserve o recorte em passagens do explorador para o perfil, do perfil para o comparador e do perfil para o mapa. Ao mudar o contexto, informe filtros ou atletas que ficaram incompatíveis.
- Use as Configurações para preferências do usuário, gestão de armazenamento local quando aplicável, idioma/formatação e consulta de fontes e cobertura. Exiba ícone de notificações, avatar ou menu de conta somente quando houver uma funcionalidade associada.
- Interface `pt-BR` com formatação local para datas, decimais e milhares. Armazene instantes em UTC quando houver fuso confiável e apresente datas e horários com contexto da competição. Datas sem horário permanecem datas.

### 4. Dashboard principal

Construa a visão geral do recorte com competições em destaque, principais jogadores e equipes, rankings de artilharia, assistências e indicadores defensivos, evolução estatística, partidas recentes e gráficos comparativos por equipe. Permita selecionar métricas e definir o mínimo de jogos ou minutos. Identifique o período, a cobertura, a fonte e a atualização dos dados. Rankings, equipes e partidas devem abrir detalhes ou levar a uma listagem filtrada.

### 5. Explorador de jogadores

Crie catálogo com busca por nome e filtros de posição, idade, clube ou seleção, competição, temporada e minutos. Ofereça ordenação por estatísticas e uma tabela com colunas configuráveis, paginação ou virtualização, ordenação correta de valores ausentes e acesso ao perfil. Mantenha filtros ao retornar do perfil. Indique quantos resultados correspondem ao recorte e ofereça ação para limpar filtros quando a busca retornar vazia.

### 6. Perfil detalhado do jogador

- Cabeçalho com foto autorizada ou iniciais, nome, camisa quando confirmada no recorte, posição, equipe no recorte, idade em data de referência definida e nacionalidade quando registrada. Em caso de transferência, identifique as equipes e os períodos relevantes. Se exibir clube atual, use um campo próprio com data da fonte. Apresente competição, temporada, partidas, minutos e a ação **Comparar jogador**.
- Mostre quatro cards prioritários no topo, adaptados à cobertura. Gols, assistências, xG e minutos seguem a Imagem 2 quando disponíveis. Disponibilize também finalizações, precisão de passes, dribles, desarmes, interceptações, participações em gols e estatísticas por 90 minutos. Inclua xG e xA somente quando a fonte e o nível de detalhe sustentarem a métrica.
- Inclua radar com referência da posição, mapa de ações com link para a tela de mapas, evolução por partida ou rodada e tabela de últimas partidas com link para o histórico completo. Cada linha deve identificar adversário, data, participação e os indicadores selecionados com cobertura. Mostre nota de partida apenas com fonte e metodologia identificadas.
- Permita alternar entre série por partida e acumulada, com unidade e período claros. Uma série de contagens acumuladas, como gols mais assistências, deve ser não decrescente. Para rodadas sem participação ou com cobertura desconhecida, use a representação correspondente no gráfico. Indique tamanho da amostra, minutos e origem de qualquer percentil.

### 7. Mapas de calor e campo interativo

Crie um campo SVG com dimensões proporcionais, áreas, círculo central e direção do ataque. Separe seus modos de visualização em densidade de ações, finalizações, passes por região e eventos individuais, conforme a cobertura. Inclua filtros por atleta, partida, período e tipo de ação. Em eventos suportados, mostre minuto, tipo, desfecho e metadados disponíveis. Filtros e seleção de pontos devem responder sem recarregar a página.

- Valide e normalize o sistema de coordenadas da fonte para o campo exibido. Documente escala, origem e convenção de visualização. Para uma orientação padronizada, aplique somente as transformações exigidas pelo provedor, sem espelhar novamente dados já normalizados. Aplique a mesma convenção às origens, destinos e setas.
- Use somente eventos com coordenadas verificadas naquela partida. Informe a quantidade de eventos plotados e a cobertura da seleção. Chame a densidade de eventos de **Mapa de ações**. Reserve **Posicionamento** para uma fonte com dados posicionais suficientes e identifique as limitações de quadros parciais, como StatsBomb 360.
- Declare o método do mapa, a unidade da escala e se a intensidade é absoluta, relativa ou por 90 minutos. Quando comparar densidades, aplique a mesma escala ou sinalize as escalas independentes. Diferencie recorte sem ações registradas, cobertura espacial ausente e coordenadas inválidas.
- Apresente uma lista navegável de eventos com os mesmos filtros e informações, inclusive em dispositivos de toque. Forneça legenda identificável por texto e valores.

### 8. Comparador de jogadores

Implemente seleção de dois ou mais jogadores via busca e permita abrir uma comparação com o atleta do perfil já selecionado. Para dois atletas, siga a composição da Imagem 1. Em seleções maiores, mantenha a legibilidade por tabela, séries com rótulos e seleção da dupla exibida nas barras espelhadas.

- Ofereça cartões de identificação, radar, barras, valores lado a lado, diferenças absoluta/percentual conforme a unidade, métrica por 90 minutos, resumo de jogos e minutos e filtros por competição, temporada e posição. Permita alterar as métricas exibidas. Preserve a cor e os identificadores do atleta em todos os gráficos da mesma comparação.
- Padronize definição, fonte/modelo, escala e amostra em cada eixo. Permita recortes distintos quando os valores brutos forem comparáveis e identifique o recorte de cada atleta. Invalide diferenças e normalizações compartilhadas quando as populações ou definições não sustentarem a comparação. Exiba o motivo ao lado da métrica.
- Calcule a leitura estatística a partir dos dados visíveis. Cite valores, recorte e amostra. Use linguagem descritiva e registre empates ou cobertura insuficiente. Ações **Salvar comparação**, **Exportar CSV**, **Alterar métricas** e **Ver metodologia** devem funcionar.

### 9. Equipes

Crie páginas de equipes com identidade visual autorizada, retrospecto, jogos, vitórias, empates, derrotas, gols marcados e sofridos, evolução, estatísticas ofensivas e defensivas, distribuição de gols por período, principais jogadores e comparação entre equipes. Para elencos reconstruídos de partidas históricas, use o rótulo **Jogadores registrados no recorte** e deixe clara a cobertura. Quando disponíveis, apresente escalação oficial e formação, distinguindo posição inicial, eventos observados e rastreamento.

### 10. Competições e partidas

Suporte Brasileirão, Premier League, La Liga e demais competições efetivamente cobertas pelas fontes conectadas. Ofereça filtros por temporada, rodada ou fase, resultados, classificação, rankings, métricas de clubes e comparações temporais. Respeite o formato da competição, incluindo grupos e mata-mata. Prefira classificação oficial. Se reconstruir uma classificação, implemente os critérios oficiais daquela edição e identifique-a como calculada. Em mata-mata, distinga placar após o tempo de jogo e disputa por pênaltis.

Disponibilize o detalhe da partida acessível pelo dashboard, equipe, competição, perfil e mapa. Apresente data, fase ou rodada, status, placar, escalações e estatísticas com cobertura. Diferencie agendada, encerrada, adiada e cancelada. Quando a fonte trouxer atualizações durante o jogo, identifique o caráter provisório.

### 11. Análise avançada e metodologia

Crie um ambiente para comparações, distribuições, evolução temporal e correlações, com seleção de métricas, filtros detalhados e exportação. Permita configurar o grupo de referência por posição, competição, temporada e minutos. Exiba `N` válido por métrica ou pela interseção de pares na correlação. Identifique o método usado, o sentido da métrica, os filtros e os pesos de eventuais compostos.

| Indicador | Regra operacional |
| --- | --- |
| Taxa por 90 | `90 × soma dos eventos / soma dos minutos elegíveis`, no mesmo conjunto de partidas. Se houver cobertura parcial, calcule sobre o subconjunto com numerador e denominador conhecidos e mostre quantos jogos e minutos foram cobertos. Zero com observação válida é zero. Sem denominador positivo, a taxa é indisponível. Defina a convenção de minutos por provedor, documentando acréscimos, prorrogação e substituições, e exclua a disputa por pênaltis. |
| Precisão de passes | `100 × passes completos / passes tentados`, usando o mesmo universo de eventos. Assinale ausência de tentativas ou cobertura insuficiente. Agregue numeradores e denominadores antes de calcular o percentual. |
| Gols e assistências | Aplique a definição da fonte, deduplique eventos e trate gols contra e disputas por pênaltis de forma explícita. Calcule participações em gols por soma dos dois componentes dentro da mesma cobertura. |
| xG e xA | Defina fonte, modelo, nível de granularidade e inclusão de pênaltis. Some xG de finalizações quando houver dados por chute e evite combinar modelos sem equivalência. Use xA publicado pelo provedor quando disponível. Se computar o xG dos chutes gerados por passes vinculados, apresente a métrica como **xG assistido** e documente o vínculo e a cobertura. |
| Percentil e radar | Defina coorte, minutos mínimos e limite de amostra por indicador. Use uma convenção publicada para empates e orientação da escala. Exiba o `N` elegível e os eixos observados. Use valores ausentes como lacunas e impeça o preenchimento do polígono quando os eixos faltantes produzirem uma área enganosa. Um eixo composto exige métricas, pesos e regra de cobertura publicados. |
| Diferença entre atletas | Identifique a base de referência. Para uma métrica de contagem ou taxa, use `100 × (B − A) / abs(A)` quando `A` for diferente de zero e ambos os valores forem comparáveis. Compare percentuais em pontos percentuais. Desabilite a diferença relativa com base igual a zero e mostre a diferença absoluta quando aplicável. |
| Progressão, defesa e correlação | Use a definição de cada ação do fornecedor ou documente os limiares e a unidade da sua derivação. Distinga volume de ações e eficiência. Para correlações, declare Pearson ou Spearman, aplique o mínimo de amostra definido e trate séries sem variância como indefinidas. Evite leitura causal. |

Adote um dicionário de métricas compartilhado por interface, relatórios e exportação. Inclua nome, definição, unidade, fonte/modelo, versão, granularidade, sentido, cobertura e regra de arredondamento. Use os valores sem arredondamento para computar e ordenar. Para a primeira análise, use como padrão 180 minutos em torneios curtos, 450 em ligas e 10 jogadores elegíveis por eixo, com limites ajustáveis e visíveis. Calcule o percentil como `100 × (número de resultados piores + 0,5 × número de resultados empatados) / N` quando o atleta pertence à coorte, considerando o sentido de cada indicador e contando o próprio atleta entre os empates. Para perfis fora da coorte, indique o motivo e marque o percentil como indisponível. Mostre a média na unidade em que é calculada e calcule novamente o grupo ao alterar o recorte.

### 12. Favoritos e relatórios

Implemente favoritos de atletas, coleções, comparações salvas e filtros personalizados com persistência após recarga. Para uso individual, identifique explicitamente o armazenamento no dispositivo. Quando a aplicação oferecer contas, mantenha os dados no banco por usuário e valide propriedade em todas as operações. Se houver login por link, use um provedor real configurado, com estados e erros testados.

Exporte tabelas CSV em UTF-8 com cabeçalhos e escaping apropriado para planilhas, e relatórios individuais e de comparação em PDF. Permita exportar gráficos em formato adequado. Cada exportação deve refletir filtros, período, alcance da exportação, unidades, fonte, atualização e metodologia, com atribuição conforme a licença. Preserve a diferença entre zero e dado ausente. Para relatórios salvos, exponha a versão ou data dos dados e deixe claro quando a comparação foi recalculada. Exporte somente campos com permissão de redistribuição.

### 13. Interações, responsividade e acessibilidade

- Use sidebar fixa e gráficos/tabelas lado a lado no desktop, com navegação recolhível e painéis empilhados no celular. Garanta leitura em 390 px, sem rolagem horizontal da página. Tabelas mais largas podem ter rolagem interna identificada. Valide também desktop e larguras intermediárias.
- Implemente carregamento, vazio por filtros, recorte sem cobertura, erro com recuperação e dados desatualizados quando houver um snapshot anterior. Diferencie visualmente `0`, indisponibilidade e dado parcial. Um erro de provedor deve preservar os filtros atuais e apresentar opção para tentar novamente quando apropriada.
- Use transições curtas, tooltips por teclado e toque, skeletons em regiões que carregam e feedback visível para seleção, salvamento e exportação. Respeite `prefers-reduced-motion`.
- Aplique WCAG 2.2 AA aos fluxos principais. Garanta contraste, ordem e visibilidade de foco, operação por teclado, rótulos, retorno de foco em diálogos, alternativas tabulares ou textuais dos gráficos e comunicação de alterações relevantes a leitores de tela. Consulte o [padrão WCAG 2.2](https://www.w3.org/TR/WCAG22/).

### 14. Stack, fontes reais e cobertura

Stack sugerida para um projeto novo: Next.js com React e TypeScript, Tailwind CSS, shadcn/ui, Lucide, Recharts ou Apache ECharts, campo em SVG com D3 onde ajudar nas escalas ou transformações e PostgreSQL. Aproveite a stack existente quando ela atender ao escopo. Prefira uma biblioteca principal para gráficos e um sistema de componentes compartilhado.

| Fonte | Uso no ScoutVision | Validação de cobertura |
| --- | --- | --- |
| StatsBomb Open Data | Base histórica real para partida, equipes/seleções, jogadores, escalações, eventos de campo e xG de finalizações quando disponível. Use a Copa do Mundo masculina de 2022 (`competition_id=43`, `season_id=106`) para validar o fluxo inicial sem uma API paga. Fixe uma revisão dos dados para importações reproduzíveis. | Confirme os arquivos por partida e a cobertura por campo. Confira termos de uso e atribuição, incluindo o logotipo da fonte quando aplicável. Valide as permissões comerciais e de redistribuição antes de publicar. [Repositório e termos](https://github.com/hudl/open-data) · [Catálogo de competições](https://github.com/hudl/open-data/blob/master/data/competitions.json) · [Partidas da Copa de 2022](https://github.com/hudl/open-data/blob/master/data/matches/43/106.json) |
| CBF | Referência oficial de jogos, resultados, classificação e documentos de partida para o Brasileirão Série A 2026. Use integração autorizada, dados obtidos por meios permitidos ou link de atribuição conforme a forma de acesso. | Verifique a edição, situação da partida, escopo e permissão de uso. Registre a proveniência por campo. [Série A 2026 na CBF](https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a/2026) |
| Sportmonks ou API-Football | Adapte um provedor com acesso já autorizado para calendário, elencos, escalações, minutos e estatísticas de jogadores conforme plano e competição. Sportmonks documenta xG por jogador e partida para acessos compatíveis. | Descubra cobertura, histórico, campos, granularidade, limites e permissões com a integração. A habilitação de escalação ou xG agregado não comprova coordenadas de eventos, tracking ou xG por chute. [Sportmonks — cobertura do Brasileirão](https://www.sportmonks.com/football-api/serie-a-api-brazil/) · [Sportmonks — métricas esperadas](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/expected/endpoints) · [API-Football — documentação](https://www.api-football.com/documentation-v3) |

- Sem credenciais comerciais, inicialize com o recorte histórico real que tiver cobertura verificada e identifique a fonte na aplicação. Se o Brasileirão estiver conectado apenas a jogos e classificação, entregue essa visualização com o seu escopo e mostre ausência de cobertura profissional nos recortes de jogadores e mapas. Mantenha os datasets históricos e correntes com seletores e rótulos próprios.
- Publique uma matriz de cobertura por fonte, competição, temporada e granularidade, com estado para partidas, escalações, minutos, métricas tradicionais, xG/xA, eventos georreferenciados e ativos. Use dados de ingestão para declarar partidas/eventos cobertos, parcialidade e data da última sincronização bem-sucedida. Evite fazer consultas comerciais a cada abertura de tela.
- Para validação inicial, consulte a partida Brasil x Sérvia (`3857258`). Placar de 2 a 0 e dois gols de Richarlison constam nas fontes do recorte. Use as localizações e o campo `shot.statsbomb_xg` do arquivo real para comprovar o pipeline de finalizações. [Registro de eventos da partida](https://github.com/hudl/open-data/blob/master/data/events/3857258.json)

### 15. Arquitetura e operação

- Modele provedores, competições, temporadas, equipes, jogadores, vínculos por período, partidas, participações e escalações, eventos, estatísticas, cobertura e sincronizações. Registre a granularidade de tabelas e chaves únicas. Inclua preferências, favoritos e comparações persistentes na camada adequada ao modo de uso.
- Use identificadores externos com namespace do provedor e mapeamento explícito para os IDs internos. Aplique a seleção de fonte por campo com regras de precedência, validade e compatibilidade, sem juntar atletas ou partidas automaticamente só pelo nome. Preserve histórico de transferências e trate correções da fonte como novos dados de ingestão com rastreabilidade.
- Organize o fluxo em conectores, validação, normalização, persistência, cálculo de métricas e apresentação. Guarde fonte, identificador original, versão, observação e atualização conforme necessário. Controle as definições no catálogo de métricas e mantenha agregados associados à revisão base. Use snapshots brutos somente quando permitidos.
- Implemente importação inicial e sincronização incremental idempotentes, com chaves únicas, validação de esquema, paginação, lotes, backoff e limites de concorrência. Isole falhas parciais e preserve o snapshot válido até que seja substituído de forma consistente. Corrija partidas alteradas pelo provedor e invalide os agregados afetados. Use índices para filtros recorrentes e limite consultas de eventos por recorte.
- Carregue dados no servidor a partir da persistência e mantenha APIs comerciais, segredos e rotinas de sincronização fora do cliente. Inclua `.env.example` sem credenciais, migrações, importação reproduzível e logs de status de ingestão sem dados sensíveis. Valide e limite parâmetros de consultas, exportações e mutações. Proteja sessões e o acesso aos dados privados se houver contas.

### 16. Ordem de implementação e verificação

1. Inspecione o workspace e valide fontes, termos, cobertura e credenciais já disponíveis. Defina o contrato de dados, a amostra histórica inicial e as rotas principais.
2. Importe a competição histórica verificada. Complete o fluxo **Explorador → Perfil → Comparador → Mapa**, com persistência e exportação, antes de expandir o catálogo de métricas. Valide o placar e os eventos de Brasil x Sérvia contra os arquivos originais.
3. Entregue dashboard, equipes, competições, partidas, análise avançada, favoritos e configurações. Integre os provedores correntes autorizados que estiverem disponíveis e valide os estados sem cobertura e de erro. Mantenha as diferenças entre as fontes no mesmo produto visíveis.
4. Execute build, lint, checagem de tipos e testes das fórmulas, da importação e dos fluxos principais. Valide no navegador, em desktop e celular, e revise o percurso por teclado.

**Critérios de aceite**

- Uma instalação limpa roda conforme o README e importa uma competição real sem depender de credencial paga. Uma segunda importação da mesma revisão preserva a contagem sem duplicar registros.
- É possível localizar um jogador real, abrir seu perfil, comparar com outro, alterar métricas, abrir a metodologia, salvar a comparação, recarregar e reabri-la. O recorte permanece correto ao navegar para o mapa.
- Brasil x Sérvia da Copa de 2022 exibe `2 × 0`, os gols de Richarlison e os eventos de finalização de origem verificável. Uma competição ou partida com cobertura espacial ausente mostra o estado correspondente.
- Testes cobrem pelo menos o tratamento de zero e ausência, agregação por 90 minutos, percentis com empates, denominador zero, coordenadas e direção de ataque, recorte de transferências e exportações. A evolução acumulada passa por uma verificação de monotonicidade para contagens.
- Os filtros, estados de erro e vazio, links de detalhes, configurações, operação por teclado e controles e gráficos responsivos funcionam. Ações que dependam de um provedor indisponível apresentam o estado real. Todos os números principais têm origem identificável.
- Entregue o código rodável e um README com requisitos, comandos, importação histórica, cobertura e método de atualização. No resumo final, informe os fluxos verificados, as fontes realmente conectadas, os testes executados e as limitações de acesso ou cobertura observadas no ambiente.
