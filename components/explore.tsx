import { MiniPitch } from "./mini-pitch";
import {
  Activity, ArrowRight, CalendarDays, ExternalLink, Flag, Goal, BarChart3,
  MapPin, Shield, Target, Trophy, UsersRound,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getMatchGoals, getTeamGoalPeriods } from "../lib/data";
import type { Appearance, Match, Team, getData } from "../lib/data";
import { CardStat, ContextPill, Empty, initials, PageHead, Panel } from "./ui";
import { LocalPreferences, Rankings } from "./workspace";

type Data = NonNullable<ReturnType<typeof getData>>;
type DataProps = { data: Data };

const edition = "Copa do Mundo 2022";
const fifa = "https://www.fifa.com/tournaments/mens/worldcup/qatar2022";
const cbf = "https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a/2026";
const statsbomb = "https://github.com/hudl/open-data";
const groups = "ABCDEFGH".split("");
const matchDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "short", timeZone: "UTC",
});
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function dateLabel(date: string) {
  return matchDate.format(new Date(`${date.slice(0, 10)}T00:00:00Z`)).replace(".", "");
}

function Score({ match }: { match: Match }) {
  return (
    <>
      <strong>{match.homeScore} × {match.awayScore}</strong>
      {match.homePenalties != null && match.awayPenalties != null && (
        <small className="muted" style={{ display: "block" }}>{match.homePenalties} × {match.awayPenalties} nos pênaltis</small>
      )}
    </>
  );
}

function MatchTable({ matches, label = "Partidas" }: { matches: Match[]; label?: string }) {
  if (!matches.length) return <Empty title="Nenhuma partida neste recorte" />;

  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={label}>
      <table aria-label={label}>
        <thead><tr><th>Data</th><th>Partida</th><th>Placar</th><th>Fase</th></tr></thead>
        <tbody>
          {matches.map((match) => (
            <tr key={match.id}>
              <td style={{ whiteSpace: "nowrap" }}>{dateLabel(match.date)}</td>
              <td><Link prefetch={false} href={`/partidas/${match.id}`}>{match.home} × {match.away}</Link></td>
              <td style={{ whiteSpace: "nowrap" }}><Score match={match} /></td>
              <td className="muted">{match.stage}{match.group ? ` · ${match.group}` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Source({ data }: DataProps) {
  const imported = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeZone: "America/Sao_Paulo",
  }).format(new Date(data.updated));

  return (
    <p className="muted">
      <a href={statsbomb}>StatsBomb Open Data</a> · 20 nov–18 dez 2022 · Importado em {imported}
    </p>
  );
}

export function Dashboard({ data }: DataProps) {
  const matches = [...data.matches].sort((a, b) => b.date.localeCompare(a.date) || b.round - a.round);
  const final = matches.find((match) => match.stage === "Final");
  const totalGoals = matches.reduce((sum, match) => sum + match.homeScore + match.awayScore, 0);
  const scoringTeams = [...data.teams].sort((a, b) => b.gf - a.gf || a.ga - b.ga).slice(0, 5);

  return (
    <>
      <PageHead section="Visão geral" title="Dashboard" description="Desempenho individual e coletivo no recorte selecionado.">
        <ContextPill />
        <Link className="button primary" href="/jogadores"><UsersRound size={16} /> Explorar jogadores</Link>
      </PageHead>
      {final && (
        <section className="panel split world-cup-banner" aria-labelledby="world-cup-title">
          <div className="world-cup-copy">
            <p className="eyebrow"><Trophy size={15} /> Mundial masculino · Catar</p>
            <h2 id="world-cup-title">Copa do Mundo 2022</h2>
            <p className="world-cup-final">Final · {final.home} × {final.away}</p>
            <div className="toolbar">
              <span className="pill world-cup-score"><Score match={final} /></span>
              <Link className="button" href={`/partidas/${final.id}`}>Ver final <ArrowRight size={16} /></Link>
            </div>
          </div>
          <div className="world-cup-illustration"><MiniPitch /></div>
        </section>
      )}
      <div className="stats-grid" style={{ marginTop: 16 }}>
        <CardStat label="Seleções" value={number.format(data.teams.length)} detail="Participantes no torneio" icon={<Shield size={17} />} />
        <CardStat label="Jogadores" value={number.format(data.players.filter((player) => player.games > 0).length)} detail="Com participação registrada" icon={<UsersRound size={17} />} />
        <CardStat label="Partidas" value={number.format(matches.length)} detail="Da fase de grupos à final" icon={<CalendarDays size={17} />} />
        <CardStat label="Gols" value={number.format(totalGoals)} detail="Sem disputas de pênaltis" icon={<Goal size={17} />} />
      </div>
      <div className="split" style={{ marginTop: 16 }}>
        <Panel title="Líderes do torneio" description="Ranking de jogadores" action={<Link className="link-button" href="/jogadores">Ver catálogo <ArrowRight size={14} /></Link>}>
          <Rankings players={data.players} />
        </Panel>
        <Panel title="Gols por seleção" description="Cinco melhores ataques · gols no placar" action={<Link className="link-button" href="/equipes">Ver equipes <ArrowRight size={14} /></Link>}>
          <div className="stack">
            {scoringTeams.map((team) => (
              <div key={team.id}>
                <div className="toolbar" style={{ justifyContent: "space-between" }}>
                  <Link prefetch={false} href={`/equipes/${team.id}`}>{team.name}</Link><strong className="positive">{team.gf}</strong>
                </div>
                <div aria-hidden="true" style={{ height: 6, background: "#263130", borderRadius: 6, overflow: "hidden", marginTop: 5 }}>
                  <div className="scout-ranking-bar" style={{ height: "100%", width: `${100 * team.gf / (scoringTeams[0]?.gf || 1)}%`, background: "#b9ed63", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="split" style={{ marginTop: 16 }}>
        <Panel title="Evolução dos gols" description="Gols acumulados durante o torneio">
          <GoalEvolution matches={matches} />
        </Panel>
        <Panel title="Últimas partidas" description="Resultados do recorte histórico" action={<Link className="link-button" href="/competicoes/copa-2022#partidas">Ver partidas <ArrowRight size={14} /></Link>}>
          <MatchTable matches={matches.slice(0, 5)} />
        </Panel>
      </div>
      <Source data={data} />
    </>
  );
}

function GoalEvolution({ matches, teamId }: { matches: Match[]; teamId?: number }) {
  const ordered = [...matches].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  if (!ordered.length) return <Empty title="Nenhum jogo neste recorte" />;
  const days = new Map<string, number>();
  for (const match of ordered) {
    const goals = teamId ? match.homeId === teamId ? match.homeScore : match.awayScore : match.homeScore + match.awayScore;
    days.set(match.date, (days.get(match.date) ?? 0) + goals);
  }
  const points: { date: string; total: number }[] = [];
  let total = 0;
  for (const [date, goals] of days) {
    total += goals;
    points.push({ date, total });
  }
  const maximum = Math.max(1, total);
  const firstDate = Date.parse(points[0].date);
  const duration = Math.max(1, Date.parse(points.at(-1)!.date) - firstDate);
  const x = (date: string) => 34 + 458 * (Date.parse(date) - firstDate) / duration;
  const y = (goals: number) => 140 - goals * 113 / maximum;
  const path = points.map((point, index) => `${index ? "L" : "M"} ${x(point.date)} ${y(point.total)}`).join(" ");
  const tickCount = Math.min(4, maximum);

  return (
    <>
      <svg viewBox="0 0 520 171" width="100%" className="chart" role="img" aria-label={`Gols acumulados de ${dateLabel(points[0].date)} a ${dateLabel(points.at(-1)!.date)}: ${total} ao fim do recorte`}>
        {Array.from({ length: tickCount + 1 }, (_, index) => {
          const goals = Math.round(index * maximum / tickCount);
          return (
            <g key={index}>
              <path d={`M34 ${y(goals)}H492`} stroke="#334540" />
              <text x="29" y={y(goals) + 3} textAnchor="end" fontSize="10" fill="#a6b6ae">{goals}</text>
            </g>
          );
        })}
        <g className="scout-line-reveal">
          <path d={`${path} L ${x(points.at(-1)!.date)} 140 H34 Z`} fill="#b9ed63" fillOpacity=".09" />
          <path d={path} stroke="#b9ed63" strokeWidth="2.5" fill="none" />
        </g>
        <text x="34" y="160" fill="#a6b6ae" fontSize="10">{dateLabel(points[0].date)}</text>
        {points.length > 1 && <text x="492" y="160" fill="#a6b6ae" fontSize="10" textAnchor="end">{dateLabel(points.at(-1)!.date)}</text>}
      </svg>
      <details>
        <summary>Valores por data</summary>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Evolução dos gols por data">
          <table><thead><tr><th>Data</th><th>Gols acumulados</th></tr></thead><tbody>
            {points.map((point) => <tr key={point.date}><td>{dateLabel(point.date)}</td><td>{point.total}</td></tr>)}
          </tbody></table>
        </div>
      </details>
    </>
  );
}

function TeamTable({ teams }: { teams: Team[] }) {
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Estatísticas das seleções">
      <table>
        <thead><tr><th>Seleção</th><th>Jogos</th><th>Vitórias</th><th>Empates</th><th>Derrotas</th><th>Gols pró</th><th>Gols contra</th><th>Saldo</th></tr></thead>
        <tbody>{teams.map((team) => (
          <tr key={team.id}>
            <td><Link prefetch={false} href={`/equipes/${team.id}`}>{team.name}</Link></td>
            <td>{team.games}</td><td>{team.wins}</td><td>{team.draws}</td><td>{team.losses}</td>
            <td className="positive">{team.gf}</td><td>{team.ga}</td><td>{team.gf - team.ga}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function Teams({ data, teamId, comparisonId }: DataProps & { teamId?: number; comparisonId?: number }) {
  const team = teamId ? data.teams.find((entry) => entry.id === teamId) : undefined;
  const sortedTeams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  if (teamId && !team) {
    return <Empty title="Equipe indisponível"><Link href="/equipes" className="link-button">Voltar às equipes</Link></Empty>;
  }

  if (!team) {
    const ranked = [...data.teams].sort((a, b) => b.gf - a.gf || a.ga - b.ga);
    return (
      <>
        <PageHead section="Equipes" title="Equipes" description="Desempenho das seleções no torneio."><ContextPill /></PageHead>
        <Panel title="Seleções" description="Ordenadas por gols marcados · resultados antes da disputa por pênaltis">
          <TeamTable teams={ranked} />
        </Panel>
        <Source data={data} />
      </>
    );
  }

  const comparison = data.teams.find((entry) => entry.id === comparisonId && entry.id !== team.id);
  const players = data.players.filter((player) => player.teamId === team.id && player.games > 0).sort((a, b) => b.minutes - a.minutes);
  const matches = data.matches.filter((match) => match.homeId === team.id || match.awayId === team.id).sort((a, b) => b.date.localeCompare(a.date));
  const goalPeriods = getTeamGoalPeriods(team.id);
  const peak = Math.max(1, ...goalPeriods.map((interval) => interval.goals));

  return (
    <>
      <PageHead section="Equipes" title={team.name} description="Retrospecto, elenco e jogos no torneio.">
        <ContextPill />
        <Link href={`/jogadores?equipe=${team.id}`} className="button primary"><UsersRound size={16} /> Ver jogadores</Link>
      </PageHead>
      <div className="stats-grid">
        <CardStat label="Jogos" value={team.games} detail={`${team.wins}V · ${team.draws}E · ${team.losses}D`} icon={<CalendarDays size={17} />} />
        <CardStat label="Gols marcados" value={team.gf} detail="Gols no placar" icon={<Goal size={17} />} />
        <CardStat label="Gols sofridos" value={team.ga} detail="Gols no placar" icon={<Shield size={17} />} />
        <CardStat label="Saldo de gols" value={team.gf - team.ga} detail="Exclui disputas de pênaltis" icon={<Activity size={17} />} />
      </div>
      <div className="split" style={{ marginTop: 16 }}>
        <Panel title="Evolução ofensiva" description="Gols marcados acumulados na campanha">
          <GoalEvolution matches={matches} teamId={team.id} />
        </Panel>
        <Panel title="Gols por período" description="Inclui gols contra a favor da seleção e prorrogação">
          <div className="stack">
            {goalPeriods.map(({ label, goals: value }) => (
              <div key={label}>
                <div className="toolbar" style={{ justifyContent: "space-between" }}><span>{label}</span><strong className="positive">{value}</strong></div>
                <div aria-hidden="true" style={{ height: 5, background: "#263130", borderRadius: 6, overflow: "hidden", marginTop: 4 }}>
                  <div className="scout-ranking-bar" style={{ height: "100%", width: `${100 * value / peak}%`, background: "#b9ed63", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="split" style={{ marginTop: 16 }}>
        <Panel title="Jogos da seleção" description="Histórico da campanha"><MatchTable matches={matches} /></Panel>
        <Panel title="Jogadores registrados no recorte" description="Atletas utilizados, em ordem de minutos" action={<Link className="link-button" href={`/jogadores?equipe=${team.id}`}>Ver todos <ArrowRight size={14} /></Link>}>
          <div className="table-wrap" role="region" aria-label="Jogadores utilizados" tabIndex={0}>
            <table>
              <thead><tr><th>Jogador</th><th>Minutos</th><th>Gols</th><th>Assist.</th></tr></thead>
              <tbody>{players.slice(0, 8).map((player) => (
                <tr key={player.id}><td><Link prefetch={false} href={`/jogadores/${player.id}`}>{player.shortName || player.name}</Link></td><td>{player.minutes}</td><td>{player.goals}</td><td>{player.assists}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
      </div>
      <div style={{ marginTop: 16 }}>
        <Panel title="Comparação de equipes" description="Totais no torneio. A duração das campanhas varia.">
          <form action={`/equipes/${team.id}`} method="get" className="toolbar" style={{ marginBottom: 12 }}>
            <label htmlFor="team-compare">Comparar com</label>
            <select name="comparar" id="team-compare" defaultValue={comparison?.id ?? ""}>
              <option value="">Selecione uma equipe</option>
              {sortedTeams.filter((entry) => entry.id !== team.id).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
            <button className="button" type="submit">Comparar</button>
          </form>
          {comparison && <TeamTable teams={[team, comparison]} />}
        </Panel>
      </div>
      <Source data={data} />
    </>
  );
}

function GroupTable({ data, group }: DataProps & { group: string }) {
  const matches = data.matches.filter((match) => match.group === group);
  const included = new Set(matches.flatMap((match) => [match.homeId, match.awayId]));
  const sortStats = (a: { points: number; gf: number; ga: number }, b: { points: number; gf: number; ga: number }) =>
    b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf;
  const totals = (teamId: number, rows: Match[]) => {
    let gf = 0;
    let ga = 0;
    let points = 0;
    let games = 0;
    for (const match of rows) {
      if (match.homeId !== teamId && match.awayId !== teamId) continue;
      const home = match.homeId === teamId;
      const scored = home ? match.homeScore : match.awayScore;
      const conceded = home ? match.awayScore : match.homeScore;
      games += 1;
      gf += scored;
      ga += conceded;
      points += scored > conceded ? 3 : scored === conceded ? 1 : 0;
    }
    return { games, gf, ga, points };
  };

  const teams = data.teams.filter((team) => included.has(team.id))
    .map((team) => ({ ...team, ...totals(team.id, matches) }));
  const preliminary = teams.map((team) => {
    const tied = new Set(teams.filter((other) => sortStats(team, other) === 0).map((other) => other.id));
    const relevant = matches.filter((match) => tied.has(match.homeId) && tied.has(match.awayId));
    return { ...team, direct: totals(team.id, relevant) };
  });
  const standings = preliminary.sort((a, b) => sortStats(a, b) || sortStats(a.direct, b.direct));
  const tieUnresolved = standings.some((team, index) => index > 0
    && sortStats(team, standings[index - 1]) === 0
    && sortStats(team.direct, standings[index - 1].direct) === 0);

  if (!standings.length) return <Empty title="Grupo indisponível" />;

  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={`Classificação do grupo ${group}`}>
      <table>
        <thead><tr><th>Pos.</th><th>Seleção</th><th>J</th><th>GP</th><th>GC</th><th>SG</th><th>PTS</th></tr></thead>
        <tbody>{standings.map((team, index) => (
          <tr key={team.id}>
            <td>{tieUnresolved ? "—" : index + 1}</td>
            <td><Link prefetch={false} href={`/equipes/${team.id}`}>{team.name}</Link></td>
            <td>{team.games}</td><td>{team.gf}</td><td>{team.ga}</td><td>{team.gf - team.ga}</td><td className="positive"><strong>{team.points}</strong></td>
          </tr>
        ))}</tbody>
      </table>
      {tieUnresolved && <p className="muted">Use a tabela oficial da FIFA para a posição final das equipes empatadas.</p>}
    </div>
  );
}

export function Competitions({ data, competitionId, round, group, matchGroup }: DataProps & {
  competitionId?: string;
  round?: string;
  group?: string;
  matchGroup?: string;
}) {
  if (competitionId && competitionId !== "copa-2022" && competitionId !== "brasileirao-2026") {
    return <Empty title="Competição indisponível"><Link className="link-button" href="/competicoes">Voltar às competições</Link></Empty>;
  }

  if (competitionId === "brasileirao-2026") {
    return (
      <>
        <PageHead section="Competições" title="Brasileirão Série A 2026" description="Cobertura da competição" />
        <Panel title="Fonte oficial" description="Classificação, partidas e documentos na Confederação Brasileira de Futebol">
          <p className="muted">O recorte local ainda não tem dados importados desta competição.</p>
          <a className="button" href={cbf}>Consultar a CBF <ExternalLink size={15} /></a>
        </Panel>
      </>
    );
  }

  if (!competitionId) {
    return (
      <>
        <PageHead section="Competições" title="Competições" description="Edições e fontes disponíveis." />
        <div className="split">
          <Panel title={edition} description="Catar · edição masculina">
            <p className="toolbar"><span className="pill positive">{data.matches.length} partidas</span><span className="pill">{data.teams.length} seleções</span></p>
            <Link href="/competicoes/copa-2022" className="button primary">Explorar competição <ArrowRight size={16} /></Link>
          </Panel>
          <Panel title="Copa do Mundo 2018" description="Rússia · calendário e placares históricos">
            <Link href="/competicoes/copa-2018" className="button">Ver resultados e comparar edições <ArrowRight size={16} /></Link>
          </Panel>
          <Panel title="Brasileirão Série A 2026" description="CBF · fonte oficial externa">
            <p className="muted">Jogos, classificação e documentos disponíveis na CBF.</p>
            <Link href="/competicoes/brasileirao-2026" className="button">Ver cobertura <ArrowRight size={16} /></Link>
          </Panel>
        </div>
      </>
    );
  }

  const selectedGroup = group && groups.includes(group) ? group : "A";
  const rounds = [...new Set(data.matches.filter((match) => match.group).map((match) => match.round))].sort((a, b) => a - b);
  const phases = [...new Set(data.matches.map((match) => match.stage))];
  const selectedMatchGroup = matchGroup && groups.includes(matchGroup) ? matchGroup : "";
  const selectedRound = phases.includes(round ?? "") || rounds.some((value) => String(value) === round) ? round ?? "" : "";
  const games = data.matches.filter((match) =>
    (!selectedMatchGroup || match.group === selectedMatchGroup) &&
    (!selectedRound || match.stage === selectedRound || (match.group && String(match.round) === selectedRound)))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHead section="Competições" title={edition} description="Catar · 20 de novembro a 18 de dezembro de 2022.">
        <Link className="button" href="/competicoes/copa-2018">Comparar com 2018</Link>
        <a className="button" href={fifa}>Fonte oficial FIFA <ExternalLink size={15} /></a>
      </PageHead>
      <div className="split">
        <Panel title={`Classificação · Grupo ${selectedGroup}`} description="Calculada pelos resultados da fase de grupos">
          <nav className="toolbar" aria-label="Grupos da Copa" style={{ marginBottom: 12 }}>
            {groups.map((item) => (
              <Link key={item} href={"?" + new URLSearchParams({ grupo: item, ...(selectedRound && { rodada: selectedRound }), ...(selectedMatchGroup && { grupoPartidas: selectedMatchGroup }) })} className={`button${selectedGroup === item ? " primary" : ""}`} aria-current={selectedGroup === item ? "true" : undefined}>{item}</Link>
            ))}
          </nav>
          <GroupTable data={data} group={selectedGroup} />
        </Panel>
        <Panel title="Ranking de jogadores" description="Métricas do torneio" action={<Link className="link-button" href="/jogadores">Ver jogadores <ArrowRight size={14} /></Link>}>
          <Rankings players={data.players} />
        </Panel>
      </div>
      <div id="partidas" style={{ marginTop: 16 }}>
        <Panel title="Partidas" description={`${games.length} resultados · fase de grupos e eliminatórias`}>
          <form action="/competicoes/copa-2022#partidas" method="get" className="toolbar" style={{ marginBottom: 12 }}>
            <input type="hidden" name="grupo" value={selectedGroup} />
            <label htmlFor="match-stage">Fase ou rodada</label>
            <select key={selectedRound} name="rodada" id="match-stage" defaultValue={selectedRound}>
              <option value="">Todas as fases</option>
              <optgroup label="Fases">{phases.map((option) => <option key={option}>{option}</option>)}</optgroup>
              <optgroup label="Rodadas da fase de grupos">{rounds.map((number) => <option key={number} value={number}>Rodada {number}</option>)}</optgroup>
            </select>
            <label htmlFor="match-group">Grupo das partidas</label>
            <select key={"grupo-" + selectedMatchGroup} name="grupoPartidas" id="match-group" defaultValue={selectedMatchGroup}>
              <option value="">Todos os grupos e fases</option>
              {groups.map((item) => <option key={item} value={item}>Grupo {item}</option>)}
            </select>
            <button className="button" type="submit">Filtrar</button>
            {(selectedMatchGroup || selectedRound) && <Link className="link-button" href={"?grupo=" + selectedGroup + "#partidas"}>Limpar filtros</Link>}
          </form>
          <MatchTable matches={games} />
        </Panel>
      </div>
      <Source data={data} />
    </>
  );
}

export function MatchDetail({ data, matchId, appearances }: DataProps & { matchId: number; appearances: Appearance[] }) {
  const match = data.matches.find((entry) => entry.id === matchId);
  if (!match) return <Empty title="Partida indisponível"><Link className="link-button" href="/competicoes/copa-2022#partidas">Ver partidas</Link></Empty>;

  const players = new Map(data.players.map((player) => [player.id, player]));
  const goals = getMatchGoals(match.id);
  const fixturesSource = `${statsbomb}/blob/${data.revision}/data/events/${match.id}.json`;

  return (
    <>
      <PageHead section="Partidas" title={`${match.home} × ${match.away}`} description={`${dateLabel(match.date)} de 2022 · ${match.stage}${match.group ? ` · Grupo ${match.group}` : ""}`}>
        <ContextPill />
        <a className="button" href={fixturesSource}>Eventos da fonte <ExternalLink size={15} /></a>
      </PageHead>
      <section className="panel" aria-label="Placar final" style={{ textAlign: "center", padding: 22, background: "linear-gradient(115deg, #21372b, #1b2526)" }}>
        <p className="eyebrow">Encerrada</p>
        <div className="toolbar" style={{ justifyContent: "center", gap: "clamp(8px, 3vw, 32px)" }}>
          <Link href={`/equipes/${match.homeId}`}><span className="avatar" aria-hidden="true">{initials(match.home)}</span> {match.home}</Link>
          <div style={{ fontSize: "clamp(24px, 4vw, 44px)", whiteSpace: "nowrap" }}><Score match={match} /></div>
          <Link href={`/equipes/${match.awayId}`}><span className="avatar" aria-hidden="true">{initials(match.away)}</span> {match.away}</Link>
        </div>
        {match.stadium && <p className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={14} />{match.stadium}</p>}
      </section>
      <div style={{ marginTop: 16 }}>
        <Panel title="Gols da partida" description="Eventos de gol no tempo de jogo">
          {goals.length ? (
            <ul className="toolbar" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {goals.map((goal) => {
                const player = goal.playerId != null ? players.get(goal.playerId) : undefined;
                const team = goal.teamId === match.homeId ? match.home : match.away;
                const minute = `${goal.minute + 1}′`;
                const playerName = player ? player.shortName || player.name : null;
                const label = goal.ownGoal ? `Gol contra a favor de ${team}${playerName ? ` · ${playerName}` : ""}` : playerName ?? team;
                return <li key={goal.id}>{player && !goal.ownGoal ? (
                  <Link className="button" href={"/mapas?" + new URLSearchParams({ jogador: String(player.id), partida: String(match.id), visao: "eventos", tipo: "Finalização", evento: goal.id })}><Target size={15} /> {label} · {minute}</Link>
                ) : <span className="pill">{label} · {minute}</span>}</li>;
              })}
            </ul>
          ) : <p className="muted">Nenhum gol individual no registro da partida.</p>}
        </Panel>
      </div>
      <div className="split" style={{ marginTop: 16 }}>
        {[
          { id: match.homeId, name: match.home, formation: match.homeFormation },
          { id: match.awayId, name: match.away, formation: match.awayFormation },
        ].map((team) => {
          const lineup = appearances.filter((row) => row.teamId === team.id)
            .sort((a, b) => Number(b.starter) - Number(a.starter) || (a.shirt ?? 99) - (b.shirt ?? 99));
          return (
            <Panel key={team.id} title={team.name} description="Escalação e participações" action={team.formation ? <span className="pill" title="Formação inicial">{team.formation}</span> : undefined}>
              <div className="table-wrap" tabIndex={0} role="region" aria-label={`Escalação de ${team.name}`}>
                <table>
                  <thead><tr><th>Jogador</th><th>Situação</th><th>Min.</th><th>Gols</th><th>xG</th></tr></thead>
                  <tbody>{lineup.map((row) => {
                    const player = players.get(row.playerId);
                    return (
                      <tr key={row.playerId}>
                        <td>{row.shirt ?? "—"} {player && <Link prefetch={false} href={`/jogadores/${player.id}`}>{player.shortName || player.name}</Link>}</td>
                        <td>{row.starter ? "Titular" : row.played ? "Entrou" : "Banco"}</td>
                        <td>{row.minutes}</td><td>{row.goals}</td><td>{row.xg == null ? "—" : number.format(row.xg)}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
              {lineup.length === 0 && <Empty title="Escalação indisponível" />}
            </Panel>
          );
        })}
      </div>
      <Source data={data} />
    </>
  );
}

export function Settings({ data, motion }: DataProps & { motion: "full" | "system" }) {
  return (
    <>
      <PageHead section="Espaço de trabalho" title="Configurações" description="Cobertura, metodologia e armazenamento.">
        <Link className="button" href="#cobertura">Cobertura dos dados</Link>
        <Link className="button" href="#metodologia">Metodologia</Link>
      </PageHead>
      <div className="split scout-settings-grid">
        <div id="cobertura" style={{ scrollMarginTop: 24 }}>
          <Panel title="Cobertura dos dados" description={`StatsBomb Open Data · Copa do Mundo 2022 · ${number.format(data.eventCount)} eventos espaciais`} action={<BarChart3 size={19} />}>
          <a className="source-badge" href={statsbomb}>
            <Image src="/statsbomb.png" width={84} height={14} alt="StatsBomb Open Data" unoptimized />
          </a>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Matriz de cobertura">
            <table>
              <thead><tr><th>Granularidade</th><th>Disponibilidade</th></tr></thead>
              <tbody>
                <tr><td>Resultados e calendário histórico</td><td className="positive">{data.matches.length} partidas</td></tr>
                <tr><td>Escalações e participações</td><td className="positive">Importadas</td></tr>
                <tr><td>Datas de nascimento</td><td className="muted">{data.players.some((player) => player.birthDate) ? "Conforme jogador" : "Indisponíveis"}</td></tr>
                <tr><td>Eventos, coordenadas e xG por chute</td><td className="positive">Conforme evento</td></tr>
                <tr><td>xA do provedor e rastreamento contínuo</td><td className="muted">Indisponíveis</td></tr>
                <tr><td>Brasileirão Série A 2026</td><td><Link className="link-button" href="/competicoes/brasileirao-2026">Referência oficial</Link></td></tr>
                <tr><td>Copa do Mundo 2018</td><td><Link className="link-button" href="/competicoes/copa-2018">Resultados de 64 partidas</Link></td></tr>
              </tbody>
            </table>
          </div>
          <dl className="stack">
            <div><dt>Revisão importada</dt><dd className="muted" style={{ margin: "4px 0 0", overflowWrap: "anywhere" }}><a className="link-button" href={`${statsbomb}/commit/${data.revision}`}><code>{data.revision}</code> <ExternalLink size={13} /></a></dd></div>
            <div><dt>Importação local</dt><dd className="muted" style={{ margin: "4px 0 0" }}><time dateTime={data.updated}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(data.updated))} · horário de Brasília</time></dd></div>
            {data.sourceUpdated && <div><dt>Último carimbo de atualização do provedor</dt><dd className="muted" style={{ margin: "4px 0 0" }}><time dateTime={data.sourceUpdated}>{data.sourceUpdated.slice(0, 10).split("-").reverse().join("/")}</time></dd></div>}
          </dl>
          </Panel>
        </div>
        <Panel title="Preferências e privacidade" action={<Flag size={19} />}>
          <dl>
            <dt>Idioma e números</dt><dd className="muted" style={{ margin: "4px 0 14px" }}>Português do Brasil · pt-BR</dd>
            <dt>Armazenamento de favoritos</dt><dd className="muted" style={{ margin: "4px 0 14px" }}>Neste navegador e dispositivo</dd>
          </dl>
          <LocalPreferences initialMotion={motion} />
        </Panel>
      </div>
      <div id="metodologia" style={{ marginTop: 16, scrollMarginTop: 24 }}>
        <Panel title="Metodologia" description="Regras usadas nos perfis, gráficos e comparações" action={<a href={`${statsbomb}/tree/${data.revision}/doc`} className="link-button">Dicionário da fonte <ExternalLink size={14} /></a>}>
          <dl className="stack">
            <div><dt><strong>Minutos e métricas por 90</strong></dt><dd className="muted" style={{ margin: "4px 0 0" }}>Somamos os intervalos por jogador no relógio nominal de 45 + 45 minutos e, quando houver prorrogação, 15 + 15. Os acréscimos e a disputa de pênaltis ficam fora do denominador. As taxas usam os minutos sem arredondar. A interface arredonda apenas a exibição. Sem minutos positivos, a taxa aparece como indisponível.</dd></div>
            <div><dt><strong>Gols, assistências e precisão de passes</strong></dt><dd className="muted" style={{ margin: "4px 0 0" }}>Gols e assistências seguem os eventos da StatsBomb no tempo de jogo. Gols contra contam no placar da equipe beneficiada. Precisão de passes é o total de passes completos dividido pelo total de tentativas. Sem tentativas, a precisão é indisponível.</dd></div>
            <div><dt><strong>xG e xG assistido</strong></dt><dd className="muted" style={{ margin: "4px 0 0" }}>Somamos o xG publicado pela StatsBomb nas finalizações, incluindo pênaltis durante a partida. xG assistido soma o xG dos chutes ligados a passes de criação. O vínculo vem dos identificadores da fonte.</dd></div>
            <div><dt><strong>Desarmes e interceptações</strong></dt><dd className="muted" style={{ margin: "4px 0 0" }}>Os totais mostram as ações bem-sucedidas na StatsBomb. As tentativas sem sucesso continuam disponíveis no mapa de eventos.</dd></div>
            <div><dt><strong>Zonas de passe</strong></dt><dd className="muted" style={{ margin: "4px 0 0" }}>O campo é dividido em nove zonas. Cada passe com coordenadas é contado uma vez, na zona de origem, qualquer que seja o resultado.</dd></div>
            <div><dt><strong>Progressão e orientação do campo</strong></dt><dd className="muted" style={{ margin: "4px 0 0" }}>Uma condução é progressiva quando avança 10 ou mais unidades no eixo longitudinal da StatsBomb. O campo usa a escala 120 × 80 da origem e a orientação fornecida, com ataque da esquerda para a direita. O mapa descreve onde ocorreram as ações observadas.</dd></div>
            <div><dt><strong>Percentis e amostra</strong></dt><dd className="muted" style={{ margin: "4px 0 0" }}>O grupo de referência usa a mesma função no torneio, pelo menos 180 minutos e um mínimo de 10 valores por indicador. O percentil é 100 × (resultados inferiores + metade dos empatados, incluindo o atleta) ÷ tamanho da amostra. Lacunas indicam ausência de uma estimativa elegível.</dd></div>
            <div><dt><strong>Classificação de grupos</strong></dt><dd className="muted" style={{ margin: "4px 0 0" }}>Calculada com 3 pontos por vitória e 1 por empate, usando saldo, gols marcados e confronto direto como desempates. A FIFA fornece critérios adicionais de conduta e sorteio. <a className="link-button" href="https://www.fifa.com/es/articles/criterios-de-desempate-fase-de-grupos-copa-mundial-qatar-2022/">Regulamento da fase de grupos <ExternalLink size={13} /></a></dd></div>
          </dl>
        </Panel>
      </div>
      <Source data={data} />
    </>
  );
}
