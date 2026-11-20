import Link from "next/link";
import { ArrowUpRight, ChartNoAxesCombined, Clock3, Crosshair, Share2 } from "lucide-react";
import type { Appearance, FieldEvent, Match, Player } from "@/lib/data";
import { participationSeries, per90, radarValues, ratio } from "@/lib/metrics";
import { Evolution, Pitch, Radar } from "./charts";
import { PlayerActions } from "./player-controls";
import { CardStat, ContextPill, Empty, PageHead, Panel, dateLabel, decimal, initials, integer } from "./ui";

export function Profile({ player, players, matches, appearances, events, updated, full, series }: {
  player: Player; players: Player[]; matches: Match[]; appearances: Appearance[]; events: FieldEvent[];
  updated: string; full: boolean; series: boolean;
}) {
  const axes = radarValues(player, players);
  const offensive = axes.find((axis) => axis.key === "shots");
  const minutes = integer.format(player.minutes);
  const chronological = appearances.filter((entry) => entry.played)
    .flatMap((entry) => {
      const match = matches.find((game) => game.id === entry.matchId);
      return match ? [{ entry, match, opponent: match.homeId === entry.teamId ? match.away : match.home }] : [];
    }).sort((a, b) => a.match.date.localeCompare(b.match.date));
  const values = participationSeries(chronological.map(({ entry }) => entry), !series);
  const evolution = chronological.map(({ match, opponent }, index) => ({ id: match.id, label: opponent, value: values[index] }));
  const exportDetails = [
    { name: "Finalizações", value: player.shots, rate: per90(player.shots, player.minutes) },
    { name: "Precisão nos passes", value: player.passes, rate: ratio(player.completed, player.passes), percent: true },
    { name: "Dribles completos", value: player.dribbles, rate: per90(player.dribbles, player.minutes) },
    { name: "Desarmes", value: player.tackles, rate: per90(player.tackles, player.minutes) },
    { name: "Interceptações", value: player.interceptions, rate: per90(player.interceptions, player.minutes) },
    { name: "Participações em gols", value: player.goals + player.assists, rate: per90(player.goals + player.assists, player.minutes) },
    { name: "Conduções progressivas", value: player.progressiveCarries, rate: per90(player.progressiveCarries, player.minutes) },
    { name: "xG assistido", value: player.xgAssisted, rate: per90(player.xgAssisted, player.minutes) },
  ];
  const age = player.birthDate ? ageAt(player.birthDate, "2022-11-20") : null;
  return <div className="stack profile-flow">
    <PageHead section="Jogadores" title="Perfil do jogador" description="Análise técnica e desempenho na competição selecionada.">
      <ContextPill /><Link className="button primary" href={"/comparador?jogadores=" + player.id}><ChartNoAxesCombined size={16} />Comparar jogador</Link>
    </PageHead>
    <section className="panel scout-player-hero" aria-label="Identificação do atleta">
      <div className="scout-player-id">
        <span className="avatar scout-profile-avatar" aria-hidden>{initials(player.shortName)}</span>
        <div>
          <p className="eyebrow positive">{player.position}{player.shirt !== null && " · Camisa " + player.shirt}</p>
          <h2>{player.shortName}{player.shirt !== null && <span> #{String(player.shirt).padStart(2, "0")}</span>}</h2>
          <p className="scout-player-meta">
            <Link href={"/equipes/" + player.teamId}>{player.team}</Link>
            <span>Copa do Mundo 2022</span>{age !== null && <span>{age} anos na abertura</span>}
            {player.country && player.country !== player.team && <span>{player.country}</span>}
          </p>
          {player.name !== player.shortName && <small className="muted">{player.name}</small>}
        </div>
      </div>
      {offensive?.value !== null && offensive?.value !== undefined && <div className="scout-percentile">
        <span>Percentil de finalizações por 90</span><strong>{decimal(offensive.value, 0)}</strong>
        <small>{offensive.count} atletas · {player.role} · mínimo 180 min</small>
      </div>}
    </section>
    {player.games === 0 && <p className="notice">Atleta listado nas escalações da competição, sem participação em campo registrada.</p>}
    <div className="grid stats-grid">
      <CardStat label="Gols" value={integer.format(player.goals)} detail={decimal(per90(player.goals, player.minutes)) + " por 90 min"} icon={<Crosshair size={17} />} />
      <CardStat label="Assistências" value={integer.format(player.assists)} detail={decimal(per90(player.assists, player.minutes)) + " por 90 min"} icon={<Share2 size={17} />} />
      <CardStat label="xG · gols esperados" value={decimal(player.xg)} detail={player.xg === null ? "Indisponível para este recorte" : "Modelo de finalizações StatsBomb"} icon={<ChartNoAxesCombined size={17} />} />
      <CardStat label="Minutos" value={minutes} detail={player.games + " partidas em campo"} icon={<Clock3 size={17} />} />
    </div>
    <div className="grid scout-profile-chart-grid">
      <Panel title="Perfil estatístico" description="Percentis entre atletas da mesma posição" action={<Link className="link-button" href="/configuracoes#metodologia">Metodologia</Link>}>
        <Radar labels={axes.map((axis) => axis.label)} counts={axes.map((axis) => axis.count)} series={[{ label: player.shortName, values: axes.map((axis) => axis.value) }]} reference />
      </Panel>
      <Panel title="Mapa de ações" description="Densidade relativa de eventos registrados" action={<Link className="link-button" href={"/mapas?jogador=" + player.id}>Ver mapa completo <ArrowUpRight size={14} /></Link>}>
        {events.length ? <Pitch events={events} /> : <Empty title="Nenhuma ação georreferenciada no recorte." />}
        {events.some((event) => event.type === "Finalização") && <Link className="link-button scout-shot-link" href={"/mapas?jogador=" + player.id + "&visao=eventos&tipo=Finaliza%C3%A7%C3%A3o"}>Ver finalizações <ArrowUpRight size={14} /></Link>}
      </Panel>
    </div>
    <div className="grid scout-profile-detail-grid">
      <Panel title="Evolução do desempenho" description={series ? "Gols e assistências por partida" : "Participações em gols acumuladas"} action={<Link className="link-button" href={"?serie=" + (series ? "acumulada" : "jogo") + (full ? "&partidas=todas" : "")}> {series ? "Ver acumulado" : "Ver por partida"}</Link>}>
        <Evolution label={series ? "Participações por partida" : "Participações em gols acumuladas"} rows={evolution} />
      </Panel>
      <Panel title={full ? "Histórico de partidas" : "Últimas partidas"} action={chronological.length > 4 && <Link className="link-button" href={"?partidas=" + (full ? "recentes" : "todas") + (series ? "&serie=jogo" : "")}>{full ? "Ver recentes" : "Ver todas"}</Link>}>
        {chronological.length ? <div className="table-wrap"><table><thead><tr><th>Partida</th><th>Min</th><th>Gols</th><th>xG</th></tr></thead>
          <tbody>{chronological.toReversed().slice(0, full ? undefined : 4).map(({ entry, match, opponent }) => <tr key={match.id}>
            <th scope="row"><Link href={"/partidas/" + match.id}>vs. {opponent}</Link><br /><small className="muted">{dateLabel(match.date)}</small></th><td>{integer.format(entry.minutes)}</td><td>{entry.goals}</td><td>{decimal(entry.xg)}</td>
          </tr>)}</tbody></table></div> : <Empty title="Nenhuma participação registrada." />}
      </Panel>
    </div>
    <Panel title="Indicadores da competição" description="Totais observados e taxas por tempo em campo" action={<div className="page-actions"><PlayerActions player={player} updated={updated} /></div>}>
      <div className="table-wrap"><table><thead><tr><th>Indicador</th><th>Total</th><th>Taxa</th></tr></thead>
        <tbody>{exportDetails.map((row) => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.percent ? player.completed + " / " + player.passes : decimal(row.value)}</td><td>{row.rate === null ? "—" : decimal(row.rate) + (row.percent ? "%" : " por 90")}</td></tr>)}</tbody>
      </table></div>
    </Panel>
  </div>;
}

function ageAt(birthDate: string, cutoff: string) {
  const years = Number(cutoff.slice(0, 4)) - Number(birthDate.slice(0, 4));
  return years - Number(cutoff.slice(5) < birthDate.slice(5));
}
