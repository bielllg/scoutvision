import type { FieldEvent } from "@/lib/data";
import { density, fieldCoordinates, passZones } from "@/lib/metrics";
import { decimal } from "./ui";

const colors = ["#b9ed63", "#87d0e8", "#efba79", "#d0a8ee"];

function radarPoint(index: number, value: number, count: number) {
  const angle = 2 * Math.PI * index / count - Math.PI / 2;
  return [180 + Math.cos(angle) * value, 142 + Math.sin(angle) * value];
}

export function Radar({ labels, series, reference = false, counts }: {
  labels: string[];
  series: { label: string; values: (number | null)[] }[];
  reference?: boolean;
  counts?: number[];
}) {
  const positions = (values: number[], radius = 0.99) => values.map((value, index) => radarPoint(index, value * radius, labels.length).join(",")).join(" ");
  const available = series.some((entry) => entry.values.some((value) => value !== null));
  return <div className="radar-container">
    <svg viewBox="0 0 360 278" className="scout-radar" role="img" aria-label="Gráfico radar de percentis por métrica">
      {[25, 50, 75, 100].map((radius) => <polygon key={radius} points={positions(labels.map(() => radius))} fill="none" stroke="#364a42" strokeWidth="0.9" />)}
      {labels.map((label, index) => {
        const [x, y] = radarPoint(index, 100, labels.length);
        const [lx, ly] = radarPoint(index, 122, labels.length);
        const anchor = lx > 188 ? "start" : lx < 172 ? "end" : "middle";
        return <g key={label}>
          <line x1="180" y1="142" x2={x} y2={y} stroke="#364a42" strokeWidth="0.9" />
          <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="central" fill="#a8bbb2" fontSize="10">{label}</text>
        </g>;
      })}
      {reference && available && <polygon points={positions(labels.map(() => 50))} fill="#aec3b01c" stroke="#739284" strokeDasharray="4 3" />}
      {series.map((entry, seriesIndex) => {
        const color = colors[seriesIndex % colors.length];
        return <g key={entry.label} className="scout-line-reveal">
          {entry.values.every((value): value is number => value !== null) && <polygon points={positions(entry.values)} fill={color + "30"} stroke={color} strokeWidth="2.4" />}
          {entry.values.map((value, index) => {
            if (value === null) return null;
            const [cx, cy] = radarPoint(index, value * 0.99, labels.length);
            return <circle key={labels[index]} cx={cx} cy={cy} r="3.2" fill={color}><title>{entry.label + " · " + labels[index] + " · P" + decimal(value, 0)}</title></circle>;
          })}
        </g>;
      })}
    </svg>
    {!available && <p className="scout-chart-message">A amostra deste recorte não atinge o mínimo para o radar.</p>}
    <div className="chart-legend scout-legend">
      {series.map((entry, index) => <span key={entry.label}><i style={{ background: colors[index % colors.length] }} />{entry.label}</span>)}
      {reference && available && <span><i style={{ background: "#739284" }} />Referência da posição</span>}
    </div>
    {available && <details className="chart-details"><summary>Dados do radar</summary>
      <div className="table-wrap"><table><thead><tr><th>Métrica</th>{series.map((entry) => <th key={entry.label}>{entry.label}</th>)}{counts && <th>Jogadores</th>}</tr></thead>
        <tbody>{labels.map((label, index) => <tr key={label}><th scope="row">{label}</th>{series.map((entry) => <td key={entry.label}>{entry.values[index] === null ? "—" : "P" + decimal(entry.values[index], 0)}</td>)}{counts && <td>{counts[index]}</td>}</tr>)}</tbody></table></div>
    </details>}
  </div>;
}

function heatColor(value: number) {
  const hue = Math.round(108 - 74 * Math.pow(value, 1.45));
  return "hsl(" + hue + " 88% " + Math.round(43 + 18 * value) + "%)";
}

const palette = ["#415f42", "#7eac45", "#bfd649", "#ffb448"];

export function Pitch({ events, mode = "density", onSelect, selected, animate = false }: {
  events: FieldEvent[];
  mode?: "density" | "points" | "zones";
  onSelect?: (event: FieldEvent) => void;
  selected?: string;
  animate?: boolean;
}) {
  const valid = events.filter(({ x, y }) => fieldCoordinates(x, y));
  const cells = mode === "density" && valid.length ? density(valid) : [];
  const zones = mode === "zones" ? passZones(valid) : [];
  const peak = Math.max(1, ...zones.map((zone) => zone.count));
  return <div className="scout-pitch">
    <svg viewBox="0 0 120 80" role="img" aria-label={(mode === "density" ? "Densidade relativa de ações" : mode === "zones" ? "Origem dos passes por zona" : "Localização de ações") + ". Ataque para a direita."}>
      <rect width="120" height="80" fill="#203f33" />
      {[0, 30, 60, 90].map((x) => <rect key={x} x={x} width="15" height="80" fill="#25483a" />)}
      <g className={"scout-pitch-layer" + (animate ? " is-updated" : "")}>
        <g style={{ filter: "blur(1.15px)" }}>{cells.map((cell, index) => cell.value >= 0.025 && <rect key={index} x={cell.x - 1.5} y={cell.y - 40 / 26} width="3.02" height={80 / 26 + 0.02} opacity={Math.min(0.94, 0.13 + cell.value).toFixed(4)} fill={heatColor(cell.value)} />)}</g>
        {zones.map(({ column, row, count }) => <g key={row * 3 + column}>
          <rect x={column * 40} y={row * 80 / 3} width="40" height={80 / 3} fillOpacity={(0.62 * count / peak).toFixed(4)} fill="#b9ed63" stroke="#a6bdab" strokeOpacity=".65" strokeDasharray="1 1" strokeWidth=".3" />
          <text x={column * 40 + 20} y={(row + 0.5) * 80 / 3} textAnchor="middle" dominantBaseline="central" fontSize="4" fontWeight="700" fill="#fff" stroke="#172b20" strokeWidth=".8" paintOrder="stroke">{count}</text>
        </g>)}
      </g>
      <g fill="none" stroke="#9bbca7" strokeOpacity=".62" strokeWidth=".36" pointerEvents="none">
        <rect x=".8" y=".8" width="118.4" height="78.4" />
        <line x1="60" x2="60" y1=".8" y2="79.2" />
        <circle cx="60" cy="40" r="10" />
        <circle cx="60" cy="40" r=".45" fill="#9bbca7" />
        <path d="M.8 18 H18 V62 H.8 M119.2 18 H102 V62 H119.2 M.8 30 H6.8 V50 H.8 M119.2 30 H113.2 V50 H119.2 M18 32 A10 10 0 0 1 18 48 M102 32 A10 10 0 0 0 102 48" />
        <circle cx="12" cy="40" r=".45" fill="#9bbca7" /><circle cx="108" cy="40" r=".45" fill="#9bbca7" />
      </g>
      {mode === "points" && valid.map((event) => {
        const active = event.id === selected;
        const color = active ? "#fff" : event.outcome === "Gol" ? "#ffe799" : "#b9ed63";
        return <g key={event.id} onClick={onSelect ? () => onSelect(event) : undefined} className={onSelect ? "pitch-event" : undefined}>
          {active && event.endX !== null && event.endY !== null && fieldCoordinates(event.endX, event.endY) && <path d={"M" + event.x + "," + event.y + " L" + event.endX + "," + event.endY} stroke="#ebfdce" strokeDasharray="1 1" strokeWidth=".6" />}
          <circle cx={event.x} cy={event.y} r={active ? 1.8 : 1.05} fill={color} stroke="#182b20" strokeWidth=".4">
            <title>{event.type + " · " + (event.minute + 1) + " min" + (event.outcome ? " · " + event.outcome : "")}</title>
          </circle>
        </g>;
      })}
    </svg>
    <div className="scout-pitch-foot"><span>Direção do ataque →</span>
      {mode === "density" && valid.length > 0 && <span className="heat-scale">Menor {palette.map((color) => <i key={color} style={{ background: color }} />)} Maior</span>}
      <span>{valid.length.toLocaleString("pt-BR")} ações</span>
    </div>
    {zones.length > 0 && <details className="chart-details scout-zone-legend"><summary>Passes por zona</summary>
      <div className="table-wrap"><table><thead><tr><th>Faixa</th><th>Defesa</th><th>Meio</th><th>Ataque</th></tr></thead><tbody>
        {["Esquerda", "Centro", "Direita"].map((label, row) => <tr key={label}><th scope="row">{label}</th>{zones.slice(row * 3, row * 3 + 3).map((zone) => <td key={zone.column}>{zone.count}</td>)}</tr>)}
      </tbody></table></div>
    </details>}
  </div>;
}

export function Evolution({ rows, label }: { rows: { id: number; label: string; value: number }[]; label: string }) {
  if (!rows.length) return <p className="muted">Nenhuma participação registrada.</p>;
  const max = Math.max(1, ...rows.map(({ value }) => value));
  const step = Math.max(1, Math.ceil(max / 3));
  const points = rows.map((row, index) => ({ x: 47 + (rows.length === 1 ? 260 : index * 511 / (rows.length - 1)), y: 119 - row.value / (step * 3) * 88, ...row }));
  const line = points.map(({ x, y }) => x + "," + y).join(" ");
  return <>
    <svg className="scout-evolution" viewBox="0 0 600 152" role="img" aria-label={label}>
      {[0, 1, 2, 3].map((index) => {
        const y = 119 - 88 * index / 3;
        return <g key={index}><path d={"M29 " + y + "H580"} stroke="#2c3c37" /><text x="21" y={y} textAnchor="end" dominantBaseline="central" fill="#a8bbb2" fontSize="10">{index * step}</text></g>;
      })}
      <g className="scout-line-reveal">
        <polygon points={points[0].x + ",119 " + line + " " + points.at(-1)?.x + ",119"} fill="#b9ed631a" />
        <polyline points={line} stroke="#b9ed63" strokeWidth="2.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" fill="none" />
        {points.map((point) => <circle key={point.id} cx={point.x} cy={point.y} r="4" fill="#b9ed63" stroke="#192624" strokeWidth="1.5"><title>{point.label + " · " + point.value}</title></circle>)}
      </g>
      {points.map((point) => <text key={point.id} x={point.x} y="141" textAnchor="middle" fill="#a8bbb2" fontSize="10">{point.label}</text>)}
    </svg>
    <details className="chart-details"><summary>Valores por jogo</summary><ul>{rows.map((row) => <li key={row.id}>{row.label} · {row.value}</li>)}</ul></details>
  </>;
}
