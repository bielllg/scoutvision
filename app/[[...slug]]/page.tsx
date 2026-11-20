import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Compare } from "@/components/compare";
import { Competitions, Dashboard, MatchDetail, Settings, Teams } from "@/components/explore";
import { Maps } from "@/components/maps";
import { PageEntrance } from "@/components/page-entrance";
import { Profile } from "@/components/profile";
import { Empty, PageHead, Panel, dateLabel } from "@/components/ui";
import { Analysis, Favorites, Players } from "@/components/workspace";
import { getAppearances, getRequestData, getEvents, getMatchLineups } from "@/lib/data";
import { metricIds, type MetricId } from "@/lib/metrics";
import { getMotionMode } from "@/lib/motion";

export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;
const param = (value: Query[string]) => typeof value === "string" ? value : undefined;

export default async function ScoutPage({ params, searchParams }: {
  params: Promise<{ slug?: string[] }>; searchParams: Promise<Query>;
}) {
  const [{ slug = [] }, query] = await Promise.all([params, searchParams]);
  const [route = "", detail] = slug;
  if (slug.length > 2) notFound();
  const data = getRequestData();
  if (!data) return <>
    <PageHead section="Dados" title="Base histórica indisponível" description="Importe as partidas e estatísticas para começar a análise." />
    <Panel title="Copa do Mundo 2022" description="Dados históricos da StatsBomb">
      <Empty title="A importação inicial ainda não foi concluída.">Execute <code>npm run data:import</code> no workspace e atualize esta página.</Empty>
    </Panel>
  </>;

  const { players, matches, teams, updated } = data;
  const richarlison = players.find((player) => player.shortName === "Richarlison");
  const defaultPlayer = richarlison ?? players.toSorted((a, b) => b.goals - a.goals)[0];

  let content;
  switch (route) {
    case "": content = <Dashboard data={data} />; break;
    case "jogadores": {
      if (!detail) { content = <Players data={data} initialQuery={param(query.q)} />; break; }
      const player = players.find((entry) => String(entry.id) === detail);
      if (!player) notFound();
      content = <Profile player={player} players={players} matches={matches} appearances={getAppearances(player.id)} events={getEvents(player.id)} updated={updated} full={query.partidas === "todas"} series={query.serie === "jogo"} />;
      break;
    }
    case "equipes": {
      if (detail && !teams.some((team) => String(team.id) === detail)) notFound();
      content = <Teams data={data} teamId={detail ? Number(detail) : undefined} comparisonId={Number(param(query.comparar)) || undefined} />;
      break;
    }
    case "competicoes":
      if (detail && !["copa-2022", "brasileirao-2026"].includes(detail)) notFound();
      content = <Competitions data={data} competitionId={detail} round={param(query.rodada)} group={param(query.grupo)} matchGroup={param(query.grupoPartidas)} />;
      break;
    case "partidas": {
      const match = matches.find((entry) => String(entry.id) === detail);
      if (!match) notFound();
      content = <MatchDetail data={data} matchId={match.id} appearances={getMatchLineups(match.id)} />;
      break;
    }
    case "comparador": {
      if (detail) notFound();
      const selected = [...new Set(param(query.jogadores)?.split(",").map(Number) ?? [])]
        .filter((id) => players.some((player) => player.id === id)).slice(0, 4);
      const opponent = players.find((player) => player.shortName === "Olivier Giroud") ??
        players.toSorted((a, b) => b.goals - a.goals).find((entry) => entry.id !== defaultPlayer?.id && entry.role === defaultPlayer?.role);
      const defaults = param(query.jogadores) === undefined && defaultPlayer ? [defaultPlayer.id, ...(opponent ? [opponent.id] : [])] : selected;
      const metrics = [...new Set(param(query.metricas)?.split(",") ?? [])].filter((key): key is MetricId => metricIds.includes(key as MetricId));
      content = <Compare players={players} selected={defaults} metricSelection={metrics} updated={updated} revision={data.revision} />;
      break;
    }
    case "mapas": {
      if (detail) notFound();
      const player = param(query.jogador) === undefined ? defaultPlayer : players.find((entry) => String(entry.id) === param(query.jogador));
      if (!player) notFound();
      const appearances = getAppearances(player.id);
      const playerMatches = matches.filter((match) => appearances.some((entry) => entry.matchId === match.id && entry.played));
      const matchId = playerMatches.find((entry) => String(entry.id) === param(query.partida))?.id;
      const invalidMatch = !matchId && param(query.partida) !== undefined;
      content = <Maps players={players.map(({ id, name, shortName, team, position }) => ({ id, name, shortName, team, position }))} playerId={player.id} matchId={matchId} invalidMatch={invalidMatch} events={invalidMatch ? [] : getEvents(player.id, matchId)} matches={playerMatches} revision={data.revision} updated={updated} />;
      break;
    }
    case "analise": if (detail) notFound(); content = <Analysis data={data} />; break;
    case "favoritos": if (detail) notFound(); content = <Favorites players={players} revision={data.revision} />; break;
    case "configuracoes": if (detail) notFound(); content = <Settings data={data} motion={await getMotionMode()} />; break;
    default: notFound();
  }
  return <>
    <PageEntrance key={slug.join("/")}>{content}</PageEntrance>
    <footer className="scout-data-footer">
      <span>Dados históricos · Importação {dateLabel(updated)}</span>
      <a className="scout-source-logo" href="https://github.com/hudl/open-data"><Image src="/statsbomb.png" width={84} height={14} alt="StatsBomb Open Data" unoptimized /></a><Link href="/configuracoes#cobertura">Fontes e cobertura</Link>
    </footer>
  </>;
}
