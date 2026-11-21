"use client";

import {
  ArrowDown, ArrowDownUp, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Columns3, Copy, Download,
  Heart, Plus, RotateCcw, Search, SlidersHorizontal, Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { getData, Player } from "../lib/data";
import { csvContent, downloadFile } from "../lib/export";
import { per90, ratio } from "../lib/metrics";
import { usePersonal } from "../lib/personal";
import { ContextPill, Empty, PageHead, Panel } from "./ui";

type Data = NonNullable<ReturnType<typeof getData>>;
type Metric = {
  label: string;
  unit: string;
  value: (player: Player) => number | null;
};

const edition = "Copa do Mundo 2022";
const source = "StatsBomb Open Data";
const formatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const pageSizes = [20, 40, 60] as const;
const preferencesKey = "scoutvision-player-page-size";
const analysisMinSample = 10;
const minutesMax = 800;

function format(value: number | null) {
  return value == null ? "—" : formatter.format(value);
}

function ageAtKickoff(birthDate: string | null) {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  return 2022 - year - Number(month > 11 || (month === 11 && day > 20));
}

const metrics = {
  goals: { label: "Gols", unit: "gols", value: (p) => p.goals },
  assists: { label: "Assistências", unit: "assistências", value: (p) => p.assists },
  minutes: { label: "Minutos", unit: "minutos", value: (p) => p.minutes },
  games: { label: "Jogos", unit: "partidas", value: (p) => p.games },
  xg: { label: "xG", unit: "gols esperados", value: (p) => p.xg },
  shots: { label: "Finalizações", unit: "chutes", value: (p) => p.shots },
  pass: { label: "Precisão de passes", unit: "%", value: (p) => ratio(p.completed, p.passes) },
  tackles: { label: "Desarmes", unit: "desarmes", value: (p) => p.tackles },
  interceptions: { label: "Interceptações", unit: "interceptações", value: (p) => p.interceptions },
  dribbles: { label: "Dribles", unit: "dribles", value: (p) => p.dribbles },
  carries: { label: "Conduções", unit: "conduções", value: (p) => p.carries },
  progress: { label: "Conduções progressivas", unit: "conduções progressivas", value: (p) => p.progressiveCarries },
  xgAssisted: { label: "xG assistido", unit: "gols esperados assistidos", value: (p) => p.xgAssisted },
  age: { label: "Idade", unit: "anos", value: (p) => ageAtKickoff(p.birthDate) },
} satisfies Record<string, Metric>;

type MetricKey = keyof typeof metrics;
const metricKeys = Object.keys(metrics) as MetricKey[];
const initialColumns: MetricKey[] = ["games", "minutes", "goals", "assists", "xg", "shots"];

function rankBy(a: Player, b: Player, key: MetricKey, ascending = false) {
  const first = metrics[key].value(a);
  const second = metrics[key].value(b);
  if (first == null || second == null) return Number(first == null) - Number(second == null);
  return (ascending ? first - second : second - first)
    || b.minutes - a.minutes || a.name.localeCompare(b.name, "pt-BR");
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR").trim();
}

function playerLabel(player: Player) {
  return player.shortName || player.name;
}

function listPositions(players: Player[]) {
  return [...new Set(players.map((player) => player.role || player.position).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function SourceNote({ updated }: { updated: string }) {
  return <p className="muted">{source} · {edition} · Importado em {new Date(updated).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>;
}

function containsMetric(value: string): value is MetricKey {
  return Object.hasOwn(metrics, value);
}

function wholeNumber(raw: string | null, fallback: number, min: number, max: number) {
  if (raw === null || !/^\d+$/.test(raw)) return fallback;
  return Math.max(min, Math.min(max, Number(raw)));
}

function rewriteUrl(next: URLSearchParams) {
  const search = next.toString();
  window.history.replaceState(null, "", `${location.pathname}${search ? `?${search}` : ""}`);
}

function setParam(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

function subscribeToPageSize(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(preferencesKey, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(preferencesKey, listener);
  };
}

function playerPageSize() {
  try {
    return pageSizes.find((size) => String(size) === localStorage.getItem(preferencesKey)) ?? pageSizes[0];
  } catch {
    return pageSizes[0];
  }
}

function usePageSize() {
  return useSyncExternalStore(subscribeToPageSize, playerPageSize, () => pageSizes[0]);
}

function subscribeMotion(update: () => void) {
  window.addEventListener("scout-motion-change", update);
  return () => window.removeEventListener("scout-motion-change", update);
}

export function LocalPreferences({ initialMotion }: { initialMotion: "full" | "system" }) {
  const motion = useSyncExternalStore(subscribeMotion, () => document.documentElement.dataset.motion ?? initialMotion, () => initialMotion);
  const pageSize = usePageSize();
  const [notice, setNotice] = useState("");

  function changePageSize(value: string | null) {
    try {
      if (value === null) localStorage.removeItem(preferencesKey);
      else localStorage.setItem(preferencesKey, value);
      window.dispatchEvent(new Event(preferencesKey));
      setNotice(value === null ? "Preferência restaurada." : "Preferência atualizada.");
    } catch {
      setNotice("O navegador bloqueou o armazenamento da preferência.");
    }
  }

  return (
    <div className="stack">
      <label className="field">Jogadores por página
        <select value={pageSize} onChange={(event) => changePageSize(event.target.value)}>
          {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <label className="field">Animações da interface
        <select value={motion} onChange={(event) => {
          const mode = event.target.value;
          document.cookie = `scout-motion=${mode}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
          document.documentElement.dataset.motion = mode;
          window.dispatchEvent(new Event("scout-motion-change"));
        }}>
          <option value="full">Completas</option>
          <option value="system">Seguir o sistema</option>
        </select>
      </label>
      <div className="toolbar">
        <button className="button" type="button" disabled={pageSize === pageSizes[0]} onClick={() => changePageSize(null)}><RotateCcw size={15} /> Restaurar padrão</button>
        <Link className="button" href="/favoritos">Gerenciar itens salvos <ArrowRight size={15} /></Link>
      </div>
      {notice && <small role="status" className="muted">{notice}</small>}
    </div>
  );
}

export function CopySnapshot({ description }: { description: string }) {
  const [notice, setNotice] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(description);
      setNotice("Identificação da base copiada.");
    } catch {
      setNotice("Cópia automática indisponível. Selecione o texto abaixo para copiar.");
    }
  }

  return (
    <div className="stack">
      <div><button type="button" className="button" onClick={copy}><Copy size={15} /> Copiar identificação da base</button></div>
      {notice && <small role="status" className="muted">{notice}</small>}
      {notice.includes("indisponível") && <p className="notice" style={{ overflowWrap: "anywhere" }}>{description}</p>}
    </div>
  );
}

export function Rankings({ players }: { players: Player[] }) {
  const [metric, setMetric] = useState<MetricKey>("goals");
  const [minutes, setMinutes] = useState(0);
  const [games, setGames] = useState(1);
  const ranked = players.filter((p) => p.minutes >= minutes && p.games >= games && metrics[metric].value(p) != null)
    .sort((a, b) => rankBy(a, b, metric)).slice(0, 5);

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 10 }}>
        <label>Métrica <select value={metric} onChange={(event) => setMetric(event.target.value as MetricKey)}>
          {(["goals", "assists", "tackles", "interceptions", "shots", "xg"] as const).map((key) =>
            <option key={key} value={key}>{metrics[key].label}</option>)}
        </select></label>
        <label>Mín. minutos <input type="number" value={minutes} min={0} max={minutesMax} onChange={(event) => setMinutes(wholeNumber(event.target.value, 0, 0, minutesMax))} style={{ width: 68 }} /></label>
        <label>Mín. jogos <input type="number" value={games} min={1} max={7} onChange={(event) => setGames(wholeNumber(event.target.value, 1, 1, 7))} style={{ width: 64 }} /></label>
      </div>
      {ranked.length ? (
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Ranking de jogadores">
          <table>
            <thead><tr><th scope="col">Jogador</th><th scope="col">Seleção</th><th scope="col" className="numeric">{metrics[metric].label}</th></tr></thead>
            <tbody>{ranked.map((player) => (
              <tr key={player.id}>
                <td><Link href={`/jogadores/${player.id}`}>{playerLabel(player)}</Link></td>
                <td className="muted">{player.team}</td><td className="positive numeric"><strong>{format(metrics[metric].value(player))}</strong></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <Empty title="Nenhum atleta elegível">Reduza o corte de jogos ou minutos.</Empty>}
    </>
  );
}

export function Players({ data, initialQuery }: { data: Data; initialQuery?: string }) {
  const params = useSearchParams();
  const pageSize = usePageSize();
  const [personal, updatePersonal] = usePersonal();
  const [filterNotice, setFilterNotice] = useState("");
  const query = params.get("q") ?? (params.size === 0 ? initialQuery ?? "" : "");
  const teams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const positions = listPositions(data.players);
  const team = teams.find(({ id }) => String(id) === params.get("equipe"));
  const position = positions.find((entry) => entry === params.get("posicao")) ?? "";
  const participation = ["jogou", "sem-minutos"].find((entry) => entry === params.get("participacao")) ?? "";
  const minutes = wholeNumber(params.get("min"), 0, 0, minutesMax);
  const age = wholeNumber(params.get("idade"), 0, 0, 70);
  const rawMetric = params.get("ordem")?.replace(/^-/, "") ?? "";
  const metric = containsMetric(rawMetric) ? rawMetric : "minutes";
  const ascending = containsMetric(rawMetric) && Boolean(params.get("ordem")?.startsWith("-"));
  const rawPage = wholeNumber(params.get("pagina"), 1, 1, data.players.length || 1);
  const visible = params.has("colunas")
    ? [...new Set((params.get("colunas") ?? "").split(",").filter(containsMetric))]
    : initialColumns;
  const ageCoverage = data.players.some((player) => ageAtKickoff(player.birthDate) !== null);
  const normalized = normalize(query);
  const results = data.players.filter((player) => {
    if (normalized && !normalize(`${player.name} ${player.shortName}`).includes(normalized)) return false;
    if (team && player.teamId !== team.id) return false;
    if (position && (player.role || player.position) !== position) return false;
    if (participation === "jogou" && player.games === 0) return false;
    if (participation === "sem-minutos" && player.games > 0) return false;
    if (minutes && player.minutes < minutes) return false;
    const playerAge = ageAtKickoff(player.birthDate);
    return !ageCoverage || !age || (playerAge !== null && playerAge <= age);
  }).sort((a, b) => rankBy(a, b, metric, ascending));
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.min(rawPage, pages);
  const rows = results.slice((page - 1) * pageSize, page * pageSize);

  function change(key: string, value: string) {
    const next = new URLSearchParams(location.search);
    if (key === "colunas" || (key === "q" && initialQuery)) next.set(key, value);
    else setParam(next, key, value);
    if (key !== "pagina") next.delete("pagina");
    setFilterNotice("");
    rewriteUrl(next);
  }

  function saveFilter() {
    const saved = new URLSearchParams();
    setParam(saved, "q", query.trim());
    setParam(saved, "equipe", team ? String(team.id) : "");
    setParam(saved, "posicao", position);
    setParam(saved, "participacao", participation);
    setParam(saved, "min", minutes ? String(minutes) : "");
    setParam(saved, "idade", ageCoverage && age ? String(age) : "");
    setParam(saved, "ordem", containsMetric(rawMetric) && (metric !== "minutes" || ascending) ? `${ascending ? "-" : ""}${metric}` : "");
    if (visible.join(",") !== initialColumns.join(",")) saved.set("colunas", visible.join(","));
    const search = saved.toString();
    const href = search ? `/jogadores?${search}` : "/jogadores";
    if (personal.filters.some((filter) => filter.href === href)) {
      setFilterNotice("Este filtro já está salvo.");
      return;
    }
    const context = [query.trim(), team?.name, position, participation === "jogou" ? "Com participação" : participation === "sem-minutos" ? "Sem participação" : "", minutes ? `${minutes}+ min` : "", ageCoverage && age ? `Até ${age} anos` : "", saved.has("ordem") ? metrics[metric].label : ""]
      .filter(Boolean).join(" · ");
    updatePersonal((current) => ({
      ...current, filters: [...current.filters, { id: crypto.randomUUID(), name: context || "Todos os jogadores", href }],
    }));
    setFilterNotice("Filtro salvo neste dispositivo.");
  }

  return (
    <>
      <PageHead section="Jogadores" title="Jogadores" description="Busque e explore o desempenho dos atletas no torneio.">
        <ContextPill />
        <Link className="button primary" href="/comparador">Abrir comparador <ArrowRight size={16} /></Link>
      </PageHead>
      <Panel title="Explorador de jogadores" description={`${formatter.format(results.length)} atletas no recorte`} action={
        <button type="button" className="button" onClick={saveFilter}><Plus size={15} /> Salvar filtro</button>
      }>
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <label>
            <span>Nome</span>
            <input type="search" placeholder="Buscar jogador" maxLength={100} value={query} onChange={(event) => change("q", event.target.value)} />
          </label>
          <label>
            <span>Seleção</span>
            <select value={team?.id ?? ""} onChange={(event) => change("equipe", event.target.value)}>
              <option value="">Todas</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </label>
          <label>
            <span>Participação</span>
            <select value={participation} onChange={(event) => change("participacao", event.target.value)}>
              <option value="">Todos os inscritos</option>
              <option value="jogou">Jogou no torneio</option>
              <option value="sem-minutos">Sem participação</option>
            </select>
          </label>
          <label>
            <span>Posição</span>
            <select value={position} onChange={(event) => change("posicao", event.target.value)}>
              <option value="">Todas</option>
              {positions.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <label>
            <span>Mín. minutos</span>
            <input type="number" min={0} max={minutesMax} value={minutes || ""} placeholder="0" onChange={(event) => change("min", event.target.value)} style={{ width: 80 }} />
          </label>
          <label>
            <span>Idade até</span>
            <input type="number" min={16} max={70} value={ageCoverage && age ? age : ""} placeholder={ageCoverage ? "Todas" : "Sem dados"} disabled={!ageCoverage} aria-describedby="idade-nota" onChange={(event) => change("idade", event.target.value)} style={{ width: 90 }} />
          </label>
          <span id="idade-nota" hidden>{ageCoverage
            ? "Idade em 20 de novembro de 2022. Idades indisponíveis são omitidas quando o filtro é aplicado."
            : "Datas de nascimento indisponíveis neste recorte."}</span>
          <details>
            <summary className="button"><Columns3 size={15} /> Colunas</summary>
            <div className="toolbar" style={{ padding: 8 }}>
              {metricKeys.map((key) => (
                <label style={{ display: "flex", alignItems: "center" }} key={key}><input style={{ width: "auto" }} type="checkbox" checked={visible.includes(key)} onChange={() => change(
                  "colunas", (visible.includes(key) ? visible.filter((item) => item !== key) : [...visible, key]).join(","),
                )} /> {metrics[key].label}</label>
              ))}
            </div>
          </details>
        </div>
        <p className="muted" role="status">{filterNotice}</p>
        {rows.length ? (
          <>
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Catálogo de jogadores">
              <table>
                <thead><tr><th scope="col">Jogador</th><th scope="col">Seleção</th><th scope="col">Posição</th>
                  {visible.map((key) => (
                    <th key={key} scope="col" className="numeric" aria-sort={key === metric ? ascending ? "ascending" : "descending" : undefined}>
                      <button className="link-button" type="button" onClick={() => change("ordem", key === metric && !ascending ? `-${key}` : key)}>
                        {metrics[key].label}{key === metric ? ascending ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowDownUp size={12} />}
                      </button>
                    </th>
                  ))}
                </tr></thead>
                <tbody>{rows.map((player) => (
                  <tr key={player.id}>
                    <td><Link href={`/jogadores/${player.id}`}>{playerLabel(player)}</Link></td>
                    <td><Link href={`/equipes/${player.teamId}`}>{player.team}</Link></td>
                    <td className="muted">{player.position || player.role || "—"}</td>
                    {visible.map((key) => <td key={key} className={key === "goals" ? "numeric positive" : "numeric"}>{format(metrics[key].value(player))}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="toolbar toolbar-spread">
              <span className="muted" role="status">Página {page} de {pages} · {rows.length} atletas exibidos</span>
              <div className="toolbar">
                <button type="button" className="button" disabled={page === 1} onClick={() => change("pagina", String(page - 1))}><ChevronLeft size={15} /> Anterior</button>
                <button type="button" className="button" disabled={page === pages} onClick={() => change("pagina", String(page + 1))}>Próxima <ChevronRight size={15} /></button>
              </div>
            </div>
          </>
        ) : (
          <Empty title="Nenhum jogador encontrado">
            <p>Altere a busca ou os filtros para ampliar o recorte.</p>
            <Link className="button" href="/jogadores"><Search size={15} /> Limpar filtros</Link>
          </Empty>
        )}
      </Panel>
      <SourceNote updated={data.updated} />
    </>
  );
}

type Point = { player: Player; x: number; y: number };

function pearson(points: Point[]) {
  if (points.length < analysisMinSample) return null;
  const meanX = points.reduce((sum, row) => sum + row.x, 0) / points.length;
  const meanY = points.reduce((sum, row) => sum + row.y, 0) / points.length;
  let varianceX = 0;
  let varianceY = 0;
  let covariance = 0;
  for (const row of points) {
    const dx = row.x - meanX;
    const dy = row.y - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  return varianceX > 0 && varianceY > 0 ? covariance / Math.sqrt(varianceX * varianceY) : null;
}

function scatterMax(values: number[]) {
  const maximum = Math.max(0, ...values);
  if (maximum <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(maximum));
  return Math.ceil(maximum / magnitude) * magnitude;
}

function Scatter({ points, xLabel, yLabel, chartRef, attribution, seriesKey }: {
  points: Point[];
  xLabel: string;
  yLabel: string;
  chartRef: React.Ref<SVGSVGElement>;
  attribution: string;
  seriesKey: string;
}) {
  const maxX = scatterMax(points.map((point) => point.x));
  const maxY = scatterMax(points.map((point) => point.y));
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg ref={chartRef} xmlns="http://www.w3.org/2000/svg" className="chart" width="100%" viewBox="0 0 620 318" role="img" aria-label={`Gráfico de dispersão de ${yLabel} por ${xLabel}; ${points.length} atletas. Valores na tabela de dados.`}>
      <desc>{attribution}</desc>
      {ticks.map((tick) => (
        <g key={tick} fontSize="12" fill="#a8b9b1" textAnchor="middle">
          <path d={`M48 ${263 - tick * 235}H596 M${48 + tick * 548} 28V263`} stroke="#344641" fill="none" />
          <text x={48 + tick * 548} y="285">{format(maxX * tick)}</text>
          <text x="31" y={267 - tick * 235}>{format(maxY * tick)}</text>
        </g>
      ))}
      <g key={seriesKey} className="scout-scatter-reveal">
        {points.map(({ player, x, y }) => (
          <circle key={player.id} cx={48 + x / maxX * 548} cy={263 - y / maxY * 235} r="4" fill="#b9ed63" fillOpacity=".67" stroke="#cdeaa0" strokeWidth=".75">
            <title>{`${playerLabel(player)} · ${xLabel}: ${format(x)} · ${yLabel}: ${format(y)}`}</title>
          </circle>
        ))}
      </g>
      <text x="322" y="308" fill="#a8b9b1" fontSize="12" textAnchor="middle">{xLabel}</text>
      <text x="48" y="16" fill="#a8b9b1" fontSize="12">{yLabel}</text>
    </svg>
  );
}

function Distribution({ points, label }: { points: Point[]; label: string }) {
  if (!points.length) return <Empty title="Nenhuma observação disponível" />;
  const values = points.map(({ x }) => x).sort((a, b) => a - b);
  const low = values[0];
  const high = values[values.length - 1];
  const bins = low === high ? 1 : Math.min(8, Math.ceil(Math.sqrt(values.length)));
  const step = (high - low) / bins;
  const counts = Array.from({ length: bins }, () => 0);
  for (const value of values) counts[step === 0 ? 0 : Math.min(bins - 1, Math.floor((value - low) / step))] += 1;
  const peak = Math.max(...counts);
  const median = (values[Math.floor((values.length - 1) / 2)] + values[Math.floor(values.length / 2)]) / 2;

  return (
    <>
      <p className="muted">Mediana de {label.toLocaleLowerCase("pt-BR")}: <strong className="positive">{format(median)}</strong></p>
      <ul className="stack" aria-label={`Distribuição de ${label} por intervalo`} style={{ gap: 7, listStyle: "none", padding: 0, marginTop: 10 }}>
        {counts.map((count, index) => {
          const from = low + index * step;
          const to = from + step;
          const interval = step === 0 ? format(from) : `${format(from)} a ${format(to)}`;
          return (
            <li key={index} className="toolbar" style={{ display: "grid", gridTemplateColumns: "minmax(80px, 105px) 1fr auto", gap: 10 }}>
              <span className="muted" title={`${index === bins - 1 ? "Intervalo final inclusivo" : "Limite superior exclusivo"}: ${from} a ${to}`}>{interval}</span>
              <span className="bar-track" aria-hidden="true"><span className="scout-ranking-bar" style={{ width: `${100 * count / peak}%` }} /></span>
              <strong>{count} {count === 1 ? "atleta" : "atletas"}</strong>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function Analysis({ data, timeline }: { data: Data; timeline: ReactNode }) {
  const params = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const chartRef = useRef<SVGSVGElement>(null);
  const analysisMetrics = metricKeys.filter((key) => key !== "age" || data.players.some((player) => ageAtKickoff(player.birthDate) !== null));
  const positions = listPositions(data.players);
  const x = analysisMetrics.find((key) => key === params.get("x")) ?? "shots";
  const y = analysisMetrics.find((key) => key === params.get("y")) ?? "xg";
  const role = positions.find((position) => position === params.get("posicao")) ?? "";
  const minutes = wholeNumber(params.get("min"), 180, 0, minutesMax);
  const normalizeVolume = params.get("por90") === "1";
  const seriesKey = JSON.stringify([x, y, role, minutes, normalizeVolume]);

  function updateAnalysis(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(null, "", "/analise" + (next.size ? "?" + next : ""));
  }
  const canNormalize = (key: MetricKey) => !["minutes", "games", "age", "pass"].includes(key);
  const getLabel = (key: MetricKey) => `${metrics[key].label}${normalizeVolume && canNormalize(key) ? " por 90" : key === "pass" ? " (%)" : ""}`;
  const xLabel = getLabel(x);
  const yLabel = getLabel(y);
  const points = data.players.flatMap((player) => {
    if (player.minutes < minutes || player.games === 0 || (role && (player.role || player.position) !== role)) return [];
    const rawX = metrics[x].value(player);
    const rawY = metrics[y].value(player);
    const xValue = normalizeVolume && canNormalize(x) ? per90(rawX, player.minutes) : rawX;
    const yValue = normalizeVolume && canNormalize(y) ? per90(rawY, player.minutes) : rawY;
    return xValue !== null && yValue !== null ? [{ player, x: xValue, y: yValue }] : [];
  }).sort((a, b) => b.x - a.x || b.y - a.y || a.player.name.localeCompare(b.player.name, "pt-BR"));
  const coefficient = pearson(points);
  const bestX = points[0];
  const bestY = [...points].sort((first, second) => second.y - first.y)[0];
  const attribution = `${edition} · ${source} · Revisão ${data.revision} · Importado em ${data.updated} · ${role || "Todas as posições"} · Mínimo de ${minutes} min · N = ${points.length}`;

  function exportAnalysis() {
    const units = (key: MetricKey) => `${metrics[key].unit}${normalizeVolume && canNormalize(key) ? " por 90 minutos" : ""}`;
    const rows = [
      ["Jogador", "Seleção", "Posição", "Minutos", xLabel, yLabel, "Unidade X", "Unidade Y", "Competição", "Temporada", "Fonte", "Revisão", "Importado em", "Posição filtrada", "Corte de minutos", "Método"],
      ...points.map(({ player, x: xValue, y: yValue }) => [
        playerLabel(player), player.team, player.position, player.minutes, xValue, yValue,
        units(x), units(y), edition, "2022", source, data.revision, data.updated, role || "Todas", minutes, "Pearson em pares completos",
      ]),
    ];
    downloadFile(csvContent(rows), "scoutvision-analise.csv", "text/csv;charset=utf-8");
  }

  async function exportChart() {
    if (!chartRef.current) return;
    const svg = chartRef.current.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("width", "620");
    svg.setAttribute("height", "381");
    svg.setAttribute("viewBox", "0 0 620 381");
    const background = document.createElementNS(svg.namespaceURI, "rect");
    background.setAttribute("width", "620");
    background.setAttribute("height", "381");
    background.setAttribute("fill", "#182122");
    svg.prepend(background);
    const credit = document.createElementNS(svg.namespaceURI, "text");
    credit.setAttribute("x", "310");
    credit.setAttribute("y", "335");
    credit.setAttribute("text-anchor", "middle");
    credit.setAttribute("font-size", "10");
    credit.setAttribute("fill", "#a8b9b1");
    credit.textContent = `${source} · ${edition} · N = ${points.length} · ${role || "Todas as posições"} · ${minutes}+ min`;
    svg.append(credit);
    try {
      const response = await fetch("/statsbomb.png");
      if (response.ok) {
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        const badgeBackground = document.createElementNS(svg.namespaceURI, "rect");
        badgeBackground.setAttribute("x", "240");
        badgeBackground.setAttribute("y", "346");
        badgeBackground.setAttribute("width", "140");
        badgeBackground.setAttribute("height", "27");
        badgeBackground.setAttribute("rx", "3");
        badgeBackground.setAttribute("fill", "#fff");
        svg.append(badgeBackground);
        const logo = document.createElementNS(svg.namespaceURI, "image");
        logo.setAttribute("href", dataUrl);
        logo.setAttribute("x", "247");
        logo.setAttribute("y", "349");
        logo.setAttribute("width", "126");
        logo.setAttribute("height", "21");
        svg.append(logo);
      }
    } catch {
      // A atribuição em texto permanece no arquivo se o ativo estiver indisponível.
    }
    downloadFile(new XMLSerializer().serializeToString(svg), "scoutvision-dispersao.svg", "image/svg+xml");
  }

  return (
    <>
      <PageHead section="Análise" title="Análise avançada" description="Explore a distribuição de duas métricas e a correlação na mesma amostra.">
        <ContextPill />
        <button type="button" className="button primary" onClick={exportAnalysis} disabled={!points.length}><Download size={16} /> Exportar CSV</button>
      </PageHead>
      <Panel title="Amostra e métricas" action={<SlidersHorizontal size={18} />}>
        <div className="toolbar">
          <label>Eixo X <select value={x} onChange={(event) => updateAnalysis("x", event.target.value)}>{analysisMetrics.map((key) => <option key={key} value={key}>{metrics[key].label}</option>)}</select></label>
          <label>Eixo Y <select value={y} onChange={(event) => updateAnalysis("y", event.target.value)}>{analysisMetrics.map((key) => <option key={key} value={key}>{metrics[key].label}</option>)}</select></label>
          <label>Posição <select value={role} onChange={(event) => updateAnalysis("posicao", event.target.value)}><option value="">Todas</option>{positions.map((position) => <option key={position}>{position}</option>)}</select></label>
          <label>Mín. minutos <input type="number" min={0} max={minutesMax} value={minutes} onChange={(event) => updateAnalysis("min", String(wholeNumber(event.target.value || "0", 180, 0, minutesMax)))} style={{ width: 85 }} /></label>
          <label style={{ display: "flex", alignItems: "center" }}><input style={{ width: "auto" }} type="checkbox" checked={normalizeVolume} onChange={(event) => updateAnalysis("por90", event.target.checked ? "1" : "")} /> Volumes por 90</label>
        </div>
      </Panel>
      <div className="split" style={{ marginTop: 16 }}>
        <Panel title="Dispersão de atletas" description={`${xLabel} × ${yLabel} · N = ${points.length}`} action={
          <button className="link-button" type="button" onClick={exportChart} disabled={!points.length}><Download size={14} /> Baixar SVG</button>
        }>
          {points.length ? <Scatter points={points} xLabel={xLabel} yLabel={yLabel} chartRef={chartRef} attribution={attribution} seriesKey={seriesKey} /> : <Empty title="Nenhum par de dados disponível">Altere as métricas ou amplie a amostra.</Empty>}
        </Panel>
        <Panel title="Correlação de Pearson" description={`${points.length} pares de valores válidos`}>
          <p className="positive" style={{ fontSize: 44, fontWeight: 700, margin: "8px 0" }}>{format(coefficient)}</p>
          <p className="muted">{coefficient === null
            ? `O cálculo exige pelo menos ${analysisMinSample} atletas e variação nos dois eixos.`
            : "O coeficiente varia de −1 a 1 e mede associação linear dentro deste recorte."}</p>
          {bestX && <p><Link className="link-button" href={`/jogadores/${bestX.player.id}`}>{playerLabel(bestX.player)}</Link> · {format(bestX.x)} em {xLabel}</p>}
          {bestY && <p><Link className="link-button" href={`/jogadores/${bestY.player.id}`}>{playerLabel(bestY.player)}</Link> · {format(bestY.y)} em {yLabel}</p>}
        </Panel>
      </div>
      <div style={{ marginTop: 16 }}>
        <Panel title="Distribuição do eixo X" description={`${xLabel} · mesma amostra da análise`}>
          <Distribution key={seriesKey} points={points} label={xLabel} />
        </Panel>
      </div>
      <div style={{ marginTop: 16 }}>
        <Panel title="Dados do gráfico" description={`${points.length} atletas · em ordem do eixo X`} action={points.length > 15 ? <button className="button" type="button" onClick={() => setExpanded(!expanded)}>{expanded ? "Mostrar 15" : "Mostrar todos"}</button> : null}>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Valores do gráfico de dispersão">
            <table>
              <thead><tr><th>Atleta</th><th>Seleção</th><th>Minutos</th><th>{xLabel}</th><th>{yLabel}</th></tr></thead>
              <tbody>{(expanded ? points : points.slice(0, 15)).map((point) => (
                <tr key={point.player.id}><td><Link href={`/jogadores/${point.player.id}`}>{playerLabel(point.player)}</Link></td><td>{point.player.team}</td><td>{point.player.minutes}</td><td>{format(point.x)}</td><td>{format(point.y)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
      </div>
      <div style={{ marginTop: 16 }}>{timeline}</div>
      <SourceNote updated={data.updated} />
    </>
  );
}

export function Favorites({ players, revision }: { players: Player[]; revision?: string }) {
  const [personal, updatePersonal] = usePersonal();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const byId = new Map(players.map((player) => [player.id, player]));
  const favorites = personal.favorites.flatMap((id) => byId.get(id) ?? []);

  function createCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = name.trim();
    if (!title) return;
    updatePersonal((current) => ({
      ...current, collections: [...current.collections, {
        id: crypto.randomUUID(), name: title, players: selected.filter((id) => current.favorites.includes(id)),
      }],
    }));
    setName("");
    setSelected([]);
    setNotice("Coleção salva.");
  }

  return (
    <>
      <PageHead section="Espaço de trabalho" title="Favoritos" description="Atletas, coleções, comparações e filtros salvos neste navegador.">
        <Link className="button primary" href="/jogadores"><Search size={16} /> Buscar atletas</Link>
      </PageHead>
      {notice && <p className="muted" role="status">{notice}</p>}
      <div className="split">
        <Panel title="Atletas favoritos" description={`${favorites.length} atletas neste recorte`} action={<Heart size={18} />}>
          {favorites.length ? (
            <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {favorites.map((player) => (
                <li key={player.id} className="toolbar" style={{ justifyContent: "space-between" }}>
                  <div><Link href={`/jogadores/${player.id}`}>{playerLabel(player)}</Link><small className="muted" style={{ display: "block" }}>{player.team}</small></div>
                  <button type="button" className="button" aria-label={`Remover ${playerLabel(player)} dos favoritos`} onClick={() => {
                    updatePersonal((current) => ({ ...current, favorites: current.favorites.filter((id) => id !== player.id) }));
                    setNotice("Atleta removido dos favoritos.");
                  }}><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          ) : <Empty title="Nenhum jogador favorito">Use a opção de favoritar no perfil de um atleta.</Empty>}
        </Panel>
        <Panel title="Comparações salvas" description={revision ? `Recalculadas sobre os dados da revisão ${revision.slice(0, 8)}` : "Recalculadas sobre a revisão importada"}>
          {personal.comparisons.length ? (
            <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {personal.comparisons.map((comparison) => {
                const title = comparison.players.map((id) => byId.get(id)).flatMap((player) => player ? [playerLabel(player)] : []).join(" × ") || "Comparação";
                const query = new URLSearchParams({ jogadores: comparison.players.join(","), metricas: comparison.metrics.join(",") });
                if (comparison.pair) query.set("dupla", comparison.pair.join(","));
                const updatedRevision = revision && comparison.revision && revision !== comparison.revision;
                return (
                  <li key={comparison.id} className="toolbar" style={{ justifyContent: "space-between" }}>
                    <div><Link href={`/comparador?${query}`}>{title}</Link><small className="muted" style={{ display: "block" }}>{new Date(comparison.date).toLocaleDateString("pt-BR")}{updatedRevision ? ` · Salva na revisão ${comparison.revision?.slice(0, 8)}` : ""}</small></div>
                    <button type="button" className="button" aria-label={`Remover comparação ${title}`} onClick={() => {
                      updatePersonal((current) => ({ ...current, comparisons: current.comparisons.filter((item) => item.id !== comparison.id) }));
                      setNotice("Comparação removida.");
                    }}><Trash2 size={15} /></button>
                  </li>
                );
              })}
            </ul>
          ) : <Empty title="Nenhuma comparação salva"><Link className="link-button" href="/comparador">Abrir comparador <ArrowRight size={14} /></Link></Empty>}
        </Panel>
      </div>
      <div className="split" style={{ marginTop: 16 }}>
        <Panel title="Coleções" description="Organize favoritos por lista.">
          <form onSubmit={createCollection} className="stack" style={{ marginBottom: 12 }}>
            <div className="toolbar">
              <label htmlFor="new-collection">Nome da coleção</label>
              <input id="new-collection" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required placeholder="Nova coleção" />
              <button className="button" type="submit"><Plus size={15} /> Criar</button>
            </div>
            {favorites.length > 0 && (
              <details>
                <summary>Selecionar atletas favoritos</summary>
                <div className="toolbar" style={{ marginTop: 8 }}>
                  {favorites.map((player) => <label key={player.id}><input type="checkbox" checked={selected.includes(player.id)} onChange={() => setSelected((current) => current.includes(player.id) ? current.filter((id) => id !== player.id) : [...current, player.id])} /> {playerLabel(player)}</label>)}
                </div>
              </details>
            )}
          </form>
          {personal.collections.map((collection) => (
            <div className="toolbar" key={collection.id} style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <details>
                <summary>{collection.name} · {collection.players.length}</summary>
                {[...new Set([...collection.players, ...personal.favorites])].flatMap((id) => byId.get(id) ?? []).map((player) => (
                  <div key={player.id} className="toolbar">
                    <input type="checkbox" style={{ width: "auto" }} aria-label={`${playerLabel(player)} em ${collection.name}`} checked={collection.players.includes(player.id)} onChange={() => {
                      updatePersonal((current) => ({
                        ...current,
                        collections: current.collections.map((item) => item.id !== collection.id ? item : {
                          ...item, players: item.players.includes(player.id)
                            ? item.players.filter((id) => id !== player.id) : [...item.players, player.id],
                        }),
                      }));
                      setNotice("Coleção atualizada.");
                    }} />
                    <Link className="link-button" href={`/jogadores/${player.id}`}>{playerLabel(player)}</Link>
                  </div>
                ))}
              </details>
              <button type="button" className="button" aria-label={`Remover coleção ${collection.name}`} onClick={() => {
                updatePersonal((current) => ({ ...current, collections: current.collections.filter((item) => item.id !== collection.id) }));
                setNotice("Coleção removida.");
              }}><Trash2 size={15} /></button>
            </div>
          ))}
        </Panel>
        <Panel title="Filtros salvos" description="Recortes do explorador de jogadores">
          {personal.filters.length ? (
            <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {personal.filters.map((filter) => (
                <li key={filter.id} className="toolbar" style={{ justifyContent: "space-between" }}>
                  <Link href={/^\/jogadores(?:\?|$)/.test(filter.href) ? filter.href : "/jogadores"}>{filter.name}</Link>
                  <button type="button" className="button" aria-label={`Remover filtro ${filter.name}`} onClick={() => {
                    updatePersonal((current) => ({ ...current, filters: current.filters.filter((item) => item.id !== filter.id) }));
                    setNotice("Filtro removido.");
                  }}><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          ) : <Empty title="Nenhum filtro salvo">Salve o recorte no explorador de jogadores.</Empty>}
        </Panel>
      </div>
    </>
  );
}
