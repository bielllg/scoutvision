# ScoutVision

Aplicação local de scouting e análise de futebol com dados históricos reais. O recorte instalado é a **Copa do Mundo masculina de 2022**. Perfis, classificações por grupo, comparações e mapas são derivados da mesma base.

## Executar localmente

Requisitos: Node.js 24.13 ou superior, npm e acesso ao GitHub na primeira importação.

~~~shell
npm ci
npm run data:import
npm run dev -- --port 3030
~~~

Abra [ScoutVision](http://localhost:3030). Para conferir a aplicação com um caso conhecido, abra [Brasil x Sérvia](http://localhost:3030/partidas/3857258), [perfil de Richarlison](http://localhost:3030/jogadores/3280) e [comparador](http://localhost:3030/comparador).

A importação fixa uma revisão pública da StatsBomb, baixa escalações e eventos de 64 partidas e persiste o recorte em SQLite, em **.data/scoutvision.sqlite**. A mesma revisão é reutilizada nas próximas execuções. O arquivo pode ser redirecionado com **SCOUTVISION_DB_PATH** no ambiente do importador e do servidor. O serviço local roda offline depois da importação.

## Cobertura e metodologia

- O recorte contém 32 seleções e 829 atletas listados. A posição principal resulta do tempo observado por posição nas escalações. As datas de nascimento ficam indisponíveis na fonte instalada.
- O mapa usa coordenadas dos eventos observados no sistema StatsBomb 120 × 80, com ataque para a direita. O xG usa o modelo por finalização da StatsBomb. O xG assistido usa vinculadores entre passes e finalizações.
- O comparador usa minutos nominais de jogo e a mesma amostra por atleta. Os percentis usam jogadores da mesma posição com pelo menos 180 minutos, exigindo 10 observações por métrica. As regras completas ficam em **Configurações → Metodologia**.
- A edição de 2026 do Brasileirão tem ligação para a tabela oficial da CBF. A instalação atual tem cobertura analítica local para a Copa de 2022. [Tabela oficial da CBF](https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a/2026)
- Favoritos, coleções, filtros e comparações ficam no navegador atual. Para publicar ou redistribuir análises, observe os termos e a atribuição da fonte. [StatsBomb Open Data](https://github.com/hudl/open-data)
- Use **Copiar link** no comparador para compartilhar atletas, métricas e a dupla em destaque. O mapa preserva o recorte no endereço e oferece densidade, eventos individuais e contagem de passes por zona de origem. As exportações do mapa e do comparador incluem a revisão da fonte.

## Verificar

~~~shell
npm run typecheck
npm run lint
npm test
npm run build
~~~

O teste histórico roda quando o arquivo SQLite já foi importado. Consulte **PROMPT-SCOUTVISION.md** para a especificação e **referencias/** para as duas referências visuais.
