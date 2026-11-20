"use client";

import Link from "next/link";
import { Download, Link2, Plus, Save, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Player } from "@/lib/data";
import { csvContent, downloadFile, downloadReport } from "@/lib/export";
import { defaultMetrics, difference, metricDefinitions, metricIds, radarValues, type MetricId } from "@/lib/metrics";
import { usePersonal } from "@/lib/personal";
import { Radar } from "./charts";
import { PlayerPicker } from "./player-controls";
import { ContextPill, PageHead, Panel, dateLabel, decimal, initials, integer } from "./ui";

const colors = ["#b9ed63", "#87d0e8", "#efba79", "#d0a8ee"];

export function Compare({ players, selected, metricSelection, updated, revision }: {
  players: Player[]; selected: number[]; metricSelection: MetricId[]; updated: string; revision: string;
}) {
  const query = useSearchParams();
  const [selection, setSelection] = useState<(number | null)[]>(selected.length >= 2 ? selected : [selected[0] ?? null, null]);
  const [metrics, setMetrics] = useState<MetricId[]>(metricSelection.length ? metricSelection : defaultMetrics);
  const [filter, setFilter] = useState("Todas");
  const [feedback, setFeedback] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [, update] = usePersonal();
  const current = selection.flatMap((id) => {
    const player = players.find((entry) => entry.id === id);
    return player ? [player] : [];
  });
  const shortlist = filter === "Todas" ? players : players.filter((player) => player.role === filter);
  const commonRole = current.length > 0 && current.every((player) => player.role === current[0].role) ? current[0].role : null;
  const axes = current.map((player) => radarValues(player, players));
  const pairs = current.flatMap((player, index) => current.slice(index + 1).map((other) => [player, other] as const));
  const pair = pairs.find(([a, b]) => a.id + "," + b.id === query.get("dupla")) ?? pairs[0];
  const [displayFirst, displaySecond] = pair ?? [];
  const context = "Copa do Mundo 2022 · Importado em " + dateLabel(updated);
  const summary = [
    ["Partidas", "games"],
    ["Gols", "goals"],
    ["Assistências", "assists"],
    ["Minutos", "minutes"],
  ] as const;

  function comparisonPath(nextSelection: (number | null)[], nextMetrics: MetricId[], pairValue?: string) {
    const search = new URLSearchParams();
    const ids = nextSelection.filter((entry): entry is number => entry !== null);
    search.set("jogadores", ids.join(","));
    search.set("metricas", nextMetrics.join(","));
    if (pairValue && pairValue.split(",").every((id) => ids.includes(Number(id)))) search.set("dupla", pairValue);
    return "/comparador?" + search.toString();
  }

  function sync(nextSelection: (number | null)[], nextMetrics: MetricId[]) {
    setSelection(nextSelection);
    setMetrics(nextMetrics);
    setFeedback("");
    window.history.replaceState(null, "", comparisonPath(nextSelection, nextMetrics, query.get("dupla") ?? undefined));
  }

  async function copyLink() {
    try {
      const path = comparisonPath(selection, metrics, query.get("dupla") ?? undefined);
      await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
      setFeedback("Link da comparação copiado.");
    } catch {
      setFeedback("O navegador não liberou a área de transferência. Copie o endereço desta página.");
    }
  }

  function save() {
    const ids = current.map((player) => player.id);
    update((personal) => ({
      ...personal,
      comparisons: [{ id: crypto.randomUUID(), players: ids, metrics, date: new Date().toISOString(), revision, pair: pair ? [pair[0].id, pair[1].id] : undefined },
        ...personal.comparisons.filter((entry) => entry.players.join(",") !== ids.join(",") || entry.metrics.join(",") !== metrics.join(","))],
    }));
    setFeedback("Comparação salva neste dispositivo.");
  }

  const rows = metrics.map((key) => {
    const metric = metricDefinitions[key];
    return [metric.name + (metric.unit ? " (" + metric.unit + ")" : ""), ...current.map((player) => metric.value(player))];
  });

  function exportCsv() {
    downloadFile(csvContent([
      ["Competição", "Copa do Mundo 2022"], ["Fonte", "StatsBomb Open Data"], ["Importação (UTC)", updated],
      ["Revisão", revision],
      ["Metodologia", "Taxa por 90 = 90 × total ÷ minutos; precisão = passes completos ÷ tentados × 100"],
      ["Indicador", ...current.map((player) => player.shortName)], ...rows,
      ...summary.map(([label, key]) => [label, ...current.map((player) => player[key])]),
    ]), "scoutvision-comparacao.csv", "text/csv;charset=utf-8");
  }

  async function exportPdf() {
    setReportBusy(true);
    try {
      setFeedback("Preparando relatório…");
      await downloadReport(current.map((player) => player.shortName).join(" vs. "), context, [
        ...rows.map(([label, ...values]) => String(label) + ": " + values.map((value) => decimal(typeof value === "number" ? value : null)).join(" | ")),
        ...summary.map(([label, key]) => label + ": " + current.map((player) => integer.format(player[key])).join(" | ")),
        "Metodologia: total × 90 ÷ minutos; precisão = passes completos ÷ tentados × 100.",
        "Revisão dos dados: " + revision,
      ]);
      setFeedback("Relatório PDF gerado.");
    } catch {
      setFeedback("Falha ao gerar o PDF. Tente novamente.");
    } finally {
      setReportBusy(false);
    }
  }

  return <div className="stack compare-flow">
    <PageHead section="Comparador" title="Comparar jogadores" description="Explore diferenças técnicas e o desempenho dos atletas no mesmo recorte.">
      <ContextPill /><button className="button primary" disabled={current.length < 2} onClick={save}><Save size={16} />Salvar comparação</button>
    </PageHead>
    <div role="status" className={feedback ? "notice" : undefined} hidden={!feedback}>{feedback} {feedback.startsWith("Comparação salva") && <Link href="/favoritos">Ver favoritos</Link>}</div>
    <div className="compare-grid grid scout-compare-identity">
      {selection.map((id, index) => {
        const player = players.find((entry) => entry.id === id);
        const color = player ? colors[current.indexOf(player)] : "#a2b5ae";
        return <article className="panel player-card scout-compare-card" key={index} style={{ "--athlete": color } as React.CSSProperties}>
          <div className="scout-card-content">
            <span className="avatar" aria-hidden>{player ? initials(player.shortName) : "–"}</span>
            <div>
              <span className="eyebrow">{player?.position ?? "Comparador"}</span>
              <h2>{player ? <Link href={"/jogadores/" + id}>{player.shortName}</Link> : "Selecionar atleta"}</h2>
              <div className="muted">{player ? player.team + " · " + integer.format(player.minutes) + " min" : "Busque um jogador da competição"}</div>
            </div>
          </div>
          <details className="scout-picker-details" open={!player ? true : undefined}>
            <summary>{player ? "Trocar atleta" : "Buscar atleta"}</summary>
            <PlayerPicker players={[...(player && !shortlist.some((entry) => entry.id === player.id) ? [player] : []), ...shortlist].filter((entry) => entry.id === id || !selection.includes(entry.id))} value={id} label={"Buscar atleta " + (index + 1)} onChange={(value) => sync(selection.map((entry, slot) => slot === index ? value : entry), metrics)} />
          </details>
          {selection.length > 2 && <button className="scout-remove" onClick={() => sync(selection.filter((_, slot) => slot !== index), metrics)} aria-label={"Remover atleta " + (index + 1)}><X size={15} /></button>}
        </article>;
      })}
    </div>
    <div className="toolbar scout-compare-toolbar">
      <label>Posição para busca <select value={filter} onChange={(event) => setFilter(event.target.value)}>{["Todas", ...new Set(players.map((player) => player.role))].map((role) => <option key={role}>{role}</option>)}</select></label>
      <div className="scout-compare-actions"><button className="button" disabled={selection.length >= 4} onClick={() => sync([...selection, null], metrics)}><Plus size={15} />Adicionar atleta</button>
      <button className="button" disabled={current.length < 2} onClick={copyLink}><Link2 size={15} />Copiar link</button></div>
    </div>
    <div className="grid scout-comparison-main">
      <Panel title="Comparação de características" description={commonRole ? "Percentis · " + commonRole + " · mínimo de 180 min" : "Radar disponível para atletas da mesma posição"} action={<span className="link-button">Percentil</span>}>
        {commonRole ? <Radar labels={axes[0].map((axis) => axis.label)} counts={axes[0].map((axis) => axis.count)} series={current.map((player, index) => ({ label: player.shortName, values: axes[index].map((axis) => axis.value) }))} />
          : <div className="empty">Selecione atletas com a mesma posição principal para habilitar o radar compartilhado.</div>}
      </Panel>
      <Panel title="Indicadores frente a frente" description="Comparação direta no mesmo torneio" action={<details className="scout-metric-selector">
        <summary className="link-button">Alterar métricas</summary>
        <fieldset><legend>Métricas exibidas</legend>{metricIds.map((key) => <label key={key}>
          <input type="checkbox" checked={metrics.includes(key)} disabled={metrics.length === 1 && metrics.includes(key)} onChange={(event) => sync(selection, event.target.checked ? [...metrics, key] : metrics.filter((entry) => entry !== key))} />{metricDefinitions[key].name}
        </label>)}</fieldset>
      </details>}>
        {current.length > 2 && <label className="scout-pair">Dupla em destaque <select value={pair?.map((player) => player.id).join(",")} onChange={(event) => {
          window.history.replaceState(null, "", comparisonPath(selection, metrics, event.target.value));
        }}>{pairs.map(([player, other]) => <option key={player.id + "-" + other.id} value={player.id + "," + other.id}>{player.shortName + " × " + other.shortName}</option>)}</select></label>}
        {displayFirst && displaySecond && <p className="scout-compare-scale muted">Cada linha usa a maior taxa da dupla como referência. A precisão usa escala de 0 a 100%.</p>}
        {displayFirst && displaySecond ? <div className="scout-bars">{metrics.map((key) => {
          const metric = metricDefinitions[key];
          const a = metric.value(displayFirst), b = metric.value(displaySecond);
          const ceiling = metric.unit === "%" ? 100 : Math.max(a ?? 0, b ?? 0, 0.01);
          const delta = difference(a, b);
          return <div className="scout-metric-row" key={key}>
            <div className="scout-bar-label"><strong style={{ color: colors[current.indexOf(displayFirst)] }}>{decimal(a, metric.digits) + (a === null ? "" : metric.unit)}</strong><span>{metric.name}</span><strong style={{ color: colors[current.indexOf(displaySecond)] }}>{decimal(b, metric.digits) + (b === null ? "" : metric.unit)}</strong></div>
            <div className="scout-meter" aria-hidden><i><b className="scout-meter-fill" style={{ transform: "scaleX(" + (a ?? 0) / ceiling + ")", background: colors[current.indexOf(displayFirst)] }} /></i><i><b className="scout-meter-fill" style={{ transform: "scaleX(" + (b ?? 0) / ceiling + ")", background: colors[current.indexOf(displaySecond)] }} /></i></div>
            <small className="muted">{delta === null ? "Diferença indisponível" : metric.unit === "%" ? "Diferença: " + signed(delta.absolute, 2) + " p.p." : "Diferença: " + signed(delta.absolute, 3) + (delta.relative === null ? " · variação relativa indisponível" : " · " + signed(delta.relative, 1) + "%")}</small>
          </div>;
        })}</div> : <div className="empty">Selecione dois atletas para comparar os indicadores.</div>}
      </Panel>
    </div>
    <div className="grid scout-comparison-detail">
      <Panel title="Resumo da competição" description={context} action={<div className="page-actions"><button className="link-button" disabled={current.length < 2} onClick={exportCsv}>Exportar CSV</button><button className="link-button" disabled={current.length < 2 || reportBusy} onClick={exportPdf}><Download size={14} />{reportBusy ? "Preparando…" : "PDF"}</button></div>}>
        {current.length ? <div className="table-wrap"><table><thead><tr><th>Indicador</th>{current.map((player) => <th key={player.id}>{player.shortName}</th>)}</tr></thead>
          <tbody>{summary.map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{current.map((player, index) => <td style={{ color: colors[index] }} key={player.id}>{integer.format(player[key])}</td>)}</tr>)}
            {current.length > 2 && rows.map(([label, ...values]) => <tr key={label}><th scope="row">{label}</th>{values.map((value, index) => <td key={index}>{decimal(typeof value === "number" ? value : null)}</td>)}</tr>)}</tbody>
        </table></div> : <div className="empty">Os totais aparecem ao selecionar um atleta.</div>}
      </Panel>
      <Panel title="Leitura estatística" action={<Link className="link-button" href="/configuracoes#metodologia">Ver metodologia</Link>}>
        <div className="scout-reading">{displayFirst && displaySecond ? metrics.slice(0, 3).map((key) => {
          const metric = metricDefinitions[key];
          const a = metric.value(displayFirst), b = metric.value(displaySecond);
          const describe = (value: number) => decimal(value, metric.digits) + metric.unit;
          const higher = a !== null && b !== null && a > b ? displayFirst : displaySecond;
          return <p key={key}><strong>{metric.name}</strong> {a === null || b === null ? "tem cobertura insuficiente." : a === b ? "está empatado em " + describe(a) + "." : "é maior para " + higher.shortName + " (" + describe(Math.max(a, b)) + " ante " + describe(Math.min(a, b)) + ")."}</p>;
        }) : <p className="muted">Escolha dois atletas para gerar a leitura.</p>}
          <small className="muted">Fonte: StatsBomb Open Data · Copa do Mundo 2022</small>
        </div>
      </Panel>
    </div>
  </div>;
}

function signed(value: number, digits: number) {
  if (value > 0 && value < 0.5 * 10 ** -digits) return "< " + decimal(10 ** -digits, digits);
  if (value < 0 && value > -0.5 * 10 ** -digits) return "> −" + decimal(10 ** -digits, digits);
  return (value > 0 ? "+" : "") + decimal(value, digits);
}
