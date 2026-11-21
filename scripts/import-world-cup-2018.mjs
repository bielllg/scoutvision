import { mkdir, writeFile } from "node:fs/promises";

const revision = "4b73468fc5b0f1950f9f66fada70ad3a4f9327cb";
const source = `https://github.com/hudl/open-data/blob/${revision}/data/matches/43/3.json`;
const response = await fetch(`https://raw.githubusercontent.com/hudl/open-data/${revision}/data/matches/43/3.json`, {
  signal: AbortSignal.timeout(25_000),
});
if (!response.ok) throw new Error(`StatsBomb Open Data: HTTP ${response.status}`);
const matches = await response.json();
if (matches.length !== 64 || new Set(matches.map((match) => match.match_id)).size !== 64) {
  throw new Error("A edição de 2018 deve conter 64 partidas distintas.");
}
const names = {
  England: "Inglaterra", "South Korea": "Coreia do Sul", "IR Iran": "Irã", "Iran": "Irã",
};
const teamNames = {
  Argentina: "Argentina", Australia: "Austrália", Belgium: "Bélgica", Brazil: "Brasil",
  Colombia: "Colômbia", "Costa Rica": "Costa Rica", Croatia: "Croácia", Denmark: "Dinamarca",
  Egypt: "Egito", France: "França", Germany: "Alemanha", Iceland: "Islândia", Japan: "Japão",
  Mexico: "México", Morocco: "Marrocos", Nigeria: "Nigéria", Panama: "Panamá", Peru: "Peru",
  Poland: "Polônia", Portugal: "Portugal", Russia: "Rússia", "Saudi Arabia": "Arábia Saudita",
  Senegal: "Senegal", Serbia: "Sérvia", Spain: "Espanha", Sweden: "Suécia", Switzerland: "Suíça",
  Tunisia: "Tunísia", Uruguay: "Uruguai",
};
const stages = {
  "Group Stage": "Fase de grupos", "Round of 16": "Oitavas de final", "Quarter-finals": "Quartas de final",
  "Semi-finals": "Semifinais", "3rd Place Final": "Disputa de terceiro lugar", Final: "Final",
};
const rows = matches.map((match) => {
  if (match.season.season_id !== 3 || !Number.isInteger(match.home_score) || !Number.isInteger(match.away_score)) {
    throw new Error(`Partida inválida: ${match.match_id}`);
  }
  const home = match.home_team.home_team_name;
  const away = match.away_team.away_team_name;
  return {
    id: match.match_id, date: match.match_date, stage: stages[match.competition_stage.name] ?? match.competition_stage.name,
    home: teamNames[home] ?? names[home] ?? home, away: teamNames[away] ?? names[away] ?? away,
    homeScore: match.home_score, awayScore: match.away_score,
  };
}).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
await mkdir("data", { recursive: true });
await writeFile("data/world-cup-2018.json", `{"source":${JSON.stringify(source)},"matches":[\n${rows.map((row) => JSON.stringify(row)).join(",\n")}\n]}\n`);
