import type { Player } from "./data";

export function per90(value: number | null, minutes: number) {
  return value === null || minutes <= 0 ? null : (90 * value) / minutes;
}

export function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? 100 * numerator / denominator : null;
}

export function percentile(value: number | null, reference: number[], minimum = 10) {
  if (value === null || reference.length < minimum) return null;
  const below = reference.filter((entry) => entry < value).length;
  const tied = reference.filter((entry) => entry === value).length;
  return 100 * (below + 0.5 * tied) / reference.length;
}

export function difference(first: number | null, second: number | null) {
  if (first === null || second === null) return null;
  return { absolute: second - first, relative: first === 0 ? null : 100 * (second - first) / Math.abs(first) };
}

export function fieldCoordinates(x: number, y: number) {
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 120 && y >= 0 && y <= 80
    ? { x, y }
    : null;
}

export function passZones(points: { x: number; y: number }[]) {
  const zones = Array.from({ length: 9 }, (_, index) => ({ column: index % 3, row: Math.floor(index / 3), count: 0 }));
  for (const { x, y } of points) {
    if (!fieldCoordinates(x, y)) continue;
    const column = Math.min(2, Math.floor(x / 40));
    const row = Math.min(2, Math.floor(y * 3 / 80));
    zones[row * 3 + column].count++;
  }
  return zones;
}

export function participationSeries(entries: { goals: number; assists: number }[], accumulated: boolean) {
  const values: number[] = [];
  for (const entry of entries) {
    values.push(entry.goals + entry.assists + (accumulated ? values.at(-1) ?? 0 : 0));
  }
  return values;
}

export function density(points: { x: number; y: number }[], width = 40, height = 26) {
  const valid = points.filter(({ x, y }) => fieldCoordinates(x, y));
  const cells = Array.from({ length: width * height }, (_, index) => {
    const x = (index % width + 0.5) * 120 / width;
    const y = (Math.floor(index / width) + 0.5) * 80 / height;
    return { x, y, value: valid.reduce((sum, point) => {
      const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
      return distance <= 225 ? sum + Math.exp(-distance / 50) : sum;
    }, 0) };
  });
  const peak = Math.max(...cells.map((cell) => cell.value));
  return cells.map((cell) => ({ ...cell, value: peak > 0 ? cell.value / peak : 0 }));
}

export const metricDefinitions = {
  goals: { name: "Gols por 90", axis: "Gols", digits: 2, unit: "", value: (p: Player) => per90(p.goals, p.minutes) },
  assists: { name: "Assistências por 90", axis: "Criação", digits: 2, unit: "", value: (p: Player) => per90(p.assists, p.minutes) },
  shots: { name: "Finalizações por 90", axis: "Finalização", digits: 2, unit: "", value: (p: Player) => per90(p.shots, p.minutes) },
  passes: { name: "Precisão nos passes", axis: "Passe", digits: 1, unit: "%", value: (p: Player) => ratio(p.completed, p.passes) },
  xg: { name: "xG por 90", axis: "xG", digits: 2, unit: "", value: (p: Player) => per90(p.xg, p.minutes) },
  carries: { name: "Conduções por 90", axis: "Condução", digits: 2, unit: "", value: (p: Player) => per90(p.carries, p.minutes) },
  progress: { name: "Conduções progressivas por 90", axis: "Progressão", digits: 2, unit: "", value: (p: Player) => per90(p.progressiveCarries, p.minutes) },
  dribbles: { name: "Dribles completos por 90", axis: "Drible", digits: 2, unit: "", value: (p: Player) => per90(p.dribbles, p.minutes) },
  defense: { name: "Desarmes + interceptações por 90", axis: "Defesa", digits: 2, unit: "", value: (p: Player) => per90(p.tackles + p.interceptions, p.minutes) },
} as const;

export type MetricId = keyof typeof metricDefinitions;
export const defaultMetrics: MetricId[] = ["goals", "assists", "shots", "passes", "xg", "progress"];
export const radarMetrics: MetricId[] = ["shots", "assists", "progress", "defense", "passes", "dribbles"];
export const metricIds = Object.keys(metricDefinitions) as MetricId[];

export function radarValues(player: Player, population: Player[], referenceRole: string = player.role) {
  const cohort = population.filter((entry) => entry.role === referenceRole && entry.minutes >= 180);
  return radarMetrics.map((key) => {
    const metric = metricDefinitions[key];
    const reference = cohort.map(metric.value).filter((entry): entry is number => entry !== null);
    return {
      key,
      label: metric.axis,
      count: reference.length,
      value: player.role === referenceRole && player.minutes >= 180 ? percentile(metric.value(player), reference) : null,
    };
  });
}
