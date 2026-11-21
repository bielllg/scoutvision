import Link from "next/link";
import archive from "../data/world-cup-2018.json";
import type { Match } from "@/lib/data";
import { Evolution } from "./charts";
import { PageHead, Panel } from "./ui";

type Result = Pick<Match, "id" | "date" | "home" | "away" | "homeScore" | "awayScore">;
const totalGoals = (matches: Result[]) => matches.reduce((total, game) => total + game.homeScore + game.awayScore, 0);

export function TournamentTimeline({ matches, year }: { matches: Result[]; year: string }) {
  const dates = new Map<string, number>();
  for (const match of matches) {
    dates.set(match.date, (dates.get(match.date) ?? 0) + match.homeScore + match.awayScore);
  }
  let total = 0;
  const rows = [];
  for (const [date, goals] of Array.from(dates.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    total += goals;
    rows.push({ id: rows.length, label: date.slice(5).split("-").reverse().join("/"), value: total });
  }
  return (
    <Panel title={`Evolução de gols · ${year}`} description="Gols acumulados por dia com partidas, excluindo disputas por pênaltis">
      <Evolution rows={rows} label={`Evolução de gols na Copa de ${year}, com ${total} gols ao fim do torneio`}
        valuesLabel="Valores por dia" />
    </Panel>
  );
}

export function WorldCupArchive({ matches2022, stage }: { matches2022: Match[]; stage?: string }) {
  const stages = Array.from(new Set(archive.matches.map((match) => match.stage)));
  const filter = stages.find((entry) => entry === stage);
  const matches = filter ? archive.matches.filter((match) => match.stage === filter) : archive.matches;
  return (
    <div className="stack">
      <PageHead section="Competições" title="Copa do Mundo 2018" description="Rússia · resultados das 64 partidas">
        <Link className="button" href="/competicoes/copa-2022">Ver Copa de 2022</Link>
      </PageHead>
      <div className="split">
        <Panel title="Comparação entre edições" description="Gols no tempo de jogo, incluindo a prorrogação">
          <table>
            <thead><tr><th scope="col">Indicador</th><th scope="col">2018</th><th scope="col">2022</th></tr></thead>
            <tbody>
              <tr><th scope="row">Partidas</th><td>{archive.matches.length}</td><td>{matches2022.length}</td></tr>
              <tr><th scope="row">Gols</th><td>{totalGoals(archive.matches)}</td><td>{totalGoals(matches2022)}</td></tr>
              <tr><th scope="row">Gols por partida</th><td>{(totalGoals(archive.matches) / archive.matches.length).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td><td>{(totalGoals(matches2022) / matches2022.length).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td></tr>
            </tbody>
          </table>
        </Panel>
        <TournamentTimeline matches={archive.matches} year="2018" />
      </div>
      <Panel title="Resultados de 2018" description={`${matches.length} ${matches.length === 1 ? "partida" : "partidas"} · placares sem disputas por pênaltis`}>
        <form className="toolbar" action="/competicoes/copa-2018" method="get">
          <label htmlFor="wc2018-stage">Fase da Copa de 2018</label>
          <select id="wc2018-stage" name="fase" key={filter} defaultValue={filter ?? ""}>
            <option value="">Todas as fases</option>
            {stages.map((entry) => <option key={entry}>{entry}</option>)}
          </select>
          <button className="button" type="submit">Filtrar resultados</button>
        </form>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Placares de 2018">
          <table>
            <thead><tr><th scope="col">Data</th><th scope="col">Partida</th><th scope="col">Placar</th><th scope="col">Fase</th></tr></thead>
            <tbody>{matches.map((match) => (
              <tr key={match.id}><td><time dateTime={match.date}>{match.date.split("-").reverse().join("/")}</time></td>
                <td>{match.home} × {match.away}</td><td>{match.homeScore} × {match.awayScore}</td><td>{match.stage}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="muted">Cobertura de 2018 nesta página: calendário, fases e placares. <a className="link-button" href={archive.source}>StatsBomb Open Data</a></p>
      </Panel>
    </div>
  );
}
