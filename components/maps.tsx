"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Crosshair, Grid3X3, Layers3 } from "lucide-react";
import type { FieldEvent, Match } from "@/lib/data";
import { csvContent, downloadFile } from "@/lib/export";
import { Pitch } from "./charts";
import { PlayerPicker, type PlayerOption } from "./player-controls";
import { ContextPill, Empty, PageHead, Panel, dateLabel, decimal } from "./ui";

export function Maps({ players, playerId, matchId, invalidMatch, events, matches, revision, updated }: {
  players: PlayerOption[]; playerId: number; matchId?: number; invalidMatch: boolean; events: FieldEvent[]; matches: Match[];
  revision: string; updated: string;
}) {
  const router = useRouter();
  const query = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [interacted, setInteracted] = useState(false);
  const view = query.get("visao");
  const mode = view === "zonas" ? "zones" : view === "eventos" ? "points" : "density";
  const type = mode === "zones" ? "Passe" : query.get("tipo")?.slice(0, 48) || "Todas";
  const selectedPeriod = query.get("periodo");
  const period = selectedPeriod === "1" ? "1º tempo" : selectedPeriod === "2" ? "2º tempo" : selectedPeriod === "prorrogacao" ? "Prorrogação" : "Todos";
  const active = query.get("evento") ?? undefined;
  const [limit, setLimit] = useState(40);
  const player = players.find((entry) => entry.id === playerId);
  const types = [...new Set([...events.map((event) => event.type), "Finalização", "Passe", ...(type === "Todas" ? [] : [type])])].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const filtered = events.filter((event) => (type === "Todas" || event.type === type) &&
    (period === "Todos" || (period === "1º tempo" && event.period === 1) ||
      (period === "2º tempo" && event.period === 2) || (period === "Prorrogação" && event.period >= 3)));
  const focused = filtered.find((event) => event.id === active);
  const matchById = new Map(matches.map((match) => [match.id, match]));
  const matchLabel = (match: Match) => match.home + " × " + match.away + " · " + dateLabel(match.date);

  function change(fields: Record<string, string | null>, navigate = false, reset = true) {
    const next = new URLSearchParams(query.toString());
    next.set("jogador", String(playerId));
    if (reset) { next.delete("evento"); setLimit(40); }
    for (const [key, value] of Object.entries(fields)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const href = "/mapas?" + next.toString();
    if (href === window.location.pathname + window.location.search) return;
    setInteracted(true);
    if (navigate) startTransition(() => router.push(href, { scroll: false }));
    else window.history.pushState(null, "", href);
  }

  function selectEvent(event: FieldEvent) {
    change({ evento: event.id, visao: "eventos", ...(mode === "zones" ? { tipo: "Passe" } : {}) }, false, false);
  }
  function exportEvents() {
    downloadFile(csvContent([
      ["Fonte", "StatsBomb Open Data"], ["Competição", "Copa do Mundo 2022"],
      ["Revisão", revision], ["Importação (UTC)", updated],
      ["Atleta", player?.shortName ?? ""], ["Filtro de ação", type], ["Período", period],
      ["Partida", "Minuto exibido", "Minuto na fonte", "Evento", "X", "Y", "Destino X", "Destino Y", "Desfecho", "xG"],
      ...filtered.map((event) => [event.matchId, event.minute + 1, event.minute, event.type, event.x, event.y, event.endX, event.endY, event.outcome, event.xg]),
    ]), "scoutvision-mapa-de-acoes.csv", "text/csv;charset=utf-8");
  }
  return <div className="stack map-flow" aria-busy={pending}>
    <PageHead section="Mapas de calor" title="Mapa de ações" description="Explore os eventos georreferenciados do jogador durante a competição.">
      <ContextPill />{player && <Link className="button primary" href={"/jogadores/" + player.id}>Ver perfil</Link>}
    </PageHead>
    <Panel title="Filtros de análise" action={<button className="link-button" onClick={exportEvents} disabled={filtered.length === 0}>Exportar eventos</button>}>
      <div className="toolbar scout-map-controls">
        <PlayerPicker players={players} value={playerId} onChange={(id) => change({ jogador: String(id), partida: null }, true)} label="Jogador" />
        <label>Partida<select value={invalidMatch ? "invalida" : matchId ?? ""} onChange={(event) => change({ partida: event.target.value }, true)}>{invalidMatch && <option value="invalida" disabled>Partida fora do recorte</option>}<option value="">Todas as partidas</option>{matches.map((match) => <option key={match.id} value={match.id}>{matchLabel(match)}</option>)}</select></label>
        <label>Tipo de ação<select value={type} onChange={(event) => change({ tipo: event.target.value === "Todas" ? null : event.target.value, ...(mode === "zones" ? { visao: null } : {}) })}><option>Todas</option>{types.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Período<select value={selectedPeriod && period !== "Todos" ? selectedPeriod : ""} onChange={(event) => change({ periodo: event.target.value })}><option value="">Todos</option><option value="1">1º tempo</option><option value="2">2º tempo</option><option value="prorrogacao">Prorrogação</option></select></label>
      </div>
      {pending && <p className="muted" role="status">Atualizando recorte…</p>}
      {invalidMatch && <p className="notice" role="status">O jogador não tem participação registrada nesta partida. Selecione outra partida.</p>}
      <div className="scout-map-presets page-actions">
        <button className="link-button" onClick={() => change({ tipo: "Finalização", visao: "eventos" })}>Ver finalizações</button>
        <button className="link-button" onClick={() => change({ tipo: null, periodo: null, visao: null, partida: null }, Boolean(matchId) || invalidMatch)}>Limpar filtros</button>
      </div>
    </Panel>
    <div className="grid scout-map-grid">
      <Panel title={player?.shortName ?? "Campo de jogo"} description={mode === "density" ? "Densidade relativa · intensidade normalizada no recorte" : mode === "zones" ? "Quantidade de passes pela zona de origem" : "Eventos individuais · coordenadas StatsBomb"} action={<div className="page-actions">
        <button className={"button " + (mode === "density" ? "primary" : "")} onClick={() => change({ visao: null })} aria-pressed={mode === "density"}><Layers3 size={15} />Densidade</button>
        <button className={"button " + (mode === "points" ? "primary" : "")} onClick={() => change({ visao: "eventos" })} aria-pressed={mode === "points"}><Crosshair size={15} />Eventos</button>
        <button className={"button " + (mode === "zones" ? "primary" : "")} onClick={() => change({ visao: "zonas", tipo: "Passe" })} aria-pressed={mode === "zones"}><Grid3X3 size={15} />Zonas de passe</button>
      </div>}>
        {filtered.length ? <Pitch key={[playerId, matchId, type, period, mode].join(":")} mode={mode} events={filtered} selected={active} onSelect={selectEvent} animate={interacted} /> : <Empty title={events.length === 0 ? "Nenhum evento espacial registrado." : "Nenhuma ação corresponde aos filtros."}>Tente ajustar o recorte ou selecione outro jogador.</Empty>}
        {focused && <p className="notice" role="status">{focused.minute + 1}&prime; · {focused.type} · x {decimal(focused.x, 1)} / y {decimal(focused.y, 1)}{focused.xg !== null && " · xG " + decimal(focused.xg, 3)}{focused.outcome && " · " + focused.outcome}</p>}
        <p className="muted scout-map-method">Escala 120 × 80 do provedor. O mapa representa ações observadas. A densidade usa uma suavização gaussiana e é relativa ao maior valor do recorte.</p>
      </Panel>
      <Panel title="Eventos individuais" description={filtered.length + " eventos no recorte"}>
        {filtered.length ? <div className="scout-map-events">
          {filtered.slice(0, limit).map((event) => {
            const match = matchById.get(event.matchId);
            return <button className="scout-event" key={event.id} aria-pressed={event.id === active} onClick={() => selectEvent(event)}>
              <strong>{event.minute + 1}&prime;</strong><span>{event.type}{event.outcome ? " · " + event.outcome : ""}<small className="muted">{match ? match.home + " × " + match.away : ""}</small></span><small className="muted">{event.xg !== null ? "xG " + decimal(event.xg, 2) : ""}</small>
            </button>;
          })}
          {filtered.length > limit && <button className="button" onClick={() => setLimit(limit + 40)}>Carregar mais eventos</button>}
        </div> : <Empty title="Nenhum evento para listar." />}
      </Panel>
    </div>
  </div>;
}
