import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout as delay } from 'node:timers/promises';
import { buildMatch, combineTeams } from './normalize-statsbomb.mjs';

const revision = '4b73468fc5b0f1950f9f66fada70ad3a4f9327cb';
const schemaVersion = '3';
const snapshotPath = resolve(process.env.SCOUTVISION_DB_PATH || '.data/scoutvision.sqlite');
const source = 'StatsBomb Open Data';
const origin = 'https://raw.githubusercontent.com/hudl/open-data/' + revision + '/data/';

async function readSource(path) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(origin + path, { signal: AbortSignal.timeout(25_000) });
      if (!response.ok) {
        if (response.status < 500 && response.status !== 429) {
          throw new TypeError(path + ' — HTTP ' + response.status);
        }
        throw new Error(path + ' — HTTP ' + response.status);
      }
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new TypeError(path + ' — lista esperada');
      return rows;
    } catch (error) {
      if (attempt === 3 || error instanceof SyntaxError || (error instanceof TypeError && !error.cause)) {
        throw error;
      }
      await delay(500 * 2 ** attempt);
    }
  }
}

const schema = `
  CREATE TABLE IF NOT EXISTS metadata (name TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, "group" TEXT, games INTEGER NOT NULL,
    wins INTEGER NOT NULL, draws INTEGER NOT NULL, losses INTEGER NOT NULL,
    gf INTEGER NOT NULL, ga INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY, date TEXT NOT NULL, homeId INTEGER NOT NULL REFERENCES teams(id),
    awayId INTEGER NOT NULL REFERENCES teams(id), home TEXT NOT NULL, away TEXT NOT NULL,
    homeScore INTEGER NOT NULL, awayScore INTEGER NOT NULL, stage TEXT NOT NULL, round INTEGER,
    "group" TEXT, homePenalties INTEGER, awayPenalties INTEGER, stadium TEXT,
    homeFormation TEXT, awayFormation TEXT, sourceUpdated TEXT, coordinateVersion TEXT, shotVersion TEXT
  );
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, shortName TEXT NOT NULL,
    teamId INTEGER NOT NULL REFERENCES teams(id), team TEXT NOT NULL, position TEXT NOT NULL,
    role TEXT NOT NULL, shirt INTEGER, birthDate TEXT, country TEXT
  );
  CREATE TABLE IF NOT EXISTS appearances (
    playerId INTEGER NOT NULL REFERENCES players(id), matchId INTEGER NOT NULL REFERENCES matches(id),
    teamId INTEGER NOT NULL REFERENCES teams(id), position TEXT NOT NULL, shirt INTEGER,
    starter INTEGER NOT NULL, played INTEGER NOT NULL, positionBreakdown TEXT NOT NULL,
    minutes REAL NOT NULL, goals INTEGER NOT NULL, assists INTEGER NOT NULL,
    shots INTEGER NOT NULL, xg REAL, passes INTEGER NOT NULL, completed INTEGER NOT NULL,
    dribbles INTEGER NOT NULL, tackles INTEGER NOT NULL, interceptions INTEGER NOT NULL,
    carries INTEGER NOT NULL, progressiveCarries INTEGER NOT NULL,
    keyPasses INTEGER NOT NULL, xgAssisted REAL,
    PRIMARY KEY (playerId, matchId)
  );
  CREATE TABLE IF NOT EXISTS field_events (
    id TEXT PRIMARY KEY, matchId INTEGER NOT NULL, playerId INTEGER NOT NULL,
    eventIndex INTEGER NOT NULL, minute INTEGER NOT NULL, second INTEGER NOT NULL,
    period INTEGER NOT NULL, type TEXT NOT NULL, x REAL NOT NULL, y REAL NOT NULL,
    endX REAL, endY REAL, outcome TEXT, xg REAL,
    FOREIGN KEY (playerId, matchId) REFERENCES appearances(playerId, matchId),
    CHECK (x BETWEEN 0 AND 120 AND y BETWEEN 0 AND 80)
  );
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY, matchId INTEGER NOT NULL REFERENCES matches(id),
    teamId INTEGER NOT NULL REFERENCES teams(id), playerId INTEGER REFERENCES players(id),
    minute INTEGER NOT NULL, period INTEGER NOT NULL, ownGoal INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS appearance_match ON appearances (matchId, teamId);
  CREATE INDEX IF NOT EXISTS event_player ON field_events (playerId, matchId, eventIndex);
  CREATE INDEX IF NOT EXISTS goals_team ON goals (teamId, minute);
  CREATE INDEX IF NOT EXISTS goals_match ON goals (matchId, period, minute);
`;

function prepareInsert(db, table, example) {
  const columns = Object.keys(example);
  const statement = db.prepare(
    'INSERT INTO ' + table + ' (' + columns.map((column) => '"' + column + '"').join(', ')
      + ') VALUES (' + columns.map(() => '?').join(', ') + ')',
  );
  return (row) => statement.run(...columns.map((column) => row[column]));
}

function snapshotIsCurrent() {
  if (!existsSync(snapshotPath)) return false;
  const db = new DatabaseSync(snapshotPath, { readOnly: true });
  try {
    const meta = Object.fromEntries(db.prepare('SELECT name, value FROM metadata').all()
      .map((row) => [row.name, row.value]));
    const count = (table) => db.prepare('SELECT COUNT(*) AS total FROM ' + table).get().total;
    return meta.revision === revision && meta.schemaVersion === schemaVersion
      && meta.matches === '64' && count('matches') === 64
      && count('field_events') === Number(meta.spatialEvents)
      && count('players') === Number(meta.players) && count('appearances') === Number(meta.rosterRows)
      && count('goals') === Number(meta.goals);
  } catch {
    return false;
  } finally {
    db.close();
  }
}

async function buildSnapshot() {
  const rawMatches = await readSource('matches/43/106.json');
  const byId = new Set(rawMatches.map((match) => match.match_id));
  if (rawMatches.length !== 64 || byId.size !== rawMatches.length || !byId.has(3857258)) {
    throw new Error('A revisão não contém os 64 jogos distintos esperados.');
  }

  const results = [];
  let next = 0;
  let complete = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < rawMatches.length) {
      const match = rawMatches[next++];
      const id = match.match_id;
      const [lineups, events] = await Promise.all([
        readSource('lineups/' + id + '.json'),
        readSource('events/' + id + '.json'),
      ]);
      results.push(buildMatch(match, lineups, events));
      complete += 1;
      if (complete % 8 === 0) console.log(complete + '/' + rawMatches.length + ' partidas validadas');
    }
  }));

  const players = new Map();
  for (const result of results) {
    for (const player of result.players) {
      const previous = players.get(player.id);
      if (previous && previous.teamId !== player.teamId) {
        throw new Error('Atleta vinculado a duas seleções no mesmo torneio: ' + player.id);
      }
      players.set(player.id, player);
    }
  }
  const updates = results.map(({ match }) => match.sourceUpdated).filter(Boolean).sort();
  const teams = combineTeams(results);
  const metadata = {
    source, revision, schemaVersion, updated: new Date().toISOString(), sourceUpdated: updates.at(-1) || '',
    competitionId: '43', seasonId: '106', matches: String(results.length), players: String(players.size),
    spatialEvents: String(results.reduce((total, result) => total + result.events.length, 0)),
    rosterRows: String(results.reduce((total, result) => total + result.appearances.length, 0)),
    goals: String(results.reduce((total, result) => total + result.goals.length, 0)),
  };
  return { results, players: [...players.values()], teams, metadata };
}

function persist(snapshot) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  const db = new DatabaseSync(snapshotPath);
  let writing = false;
  try {
    const journalMode = process.env.VERCEL ? 'DELETE' : 'WAL';
    db.exec(`PRAGMA busy_timeout = 10000; PRAGMA journal_mode = ${journalMode}; BEGIN IMMEDIATE;`);
    writing = true;
    db.exec(schema);
    db.exec('DELETE FROM field_events; DELETE FROM goals; DELETE FROM appearances; DELETE FROM players; DELETE FROM matches; DELETE FROM teams; DELETE FROM metadata;');
    const insertTeam = prepareInsert(db, 'teams', snapshot.teams[0]);
    const insertPlayer = prepareInsert(db, 'players', snapshot.players[0]);
    const insertMatch = prepareInsert(db, 'matches', snapshot.results[0].match);
    const insertAppearance = prepareInsert(db, 'appearances', snapshot.results[0].appearances[0]);
    const insertEvent = prepareInsert(db, 'field_events', snapshot.results[0].events[0]);
    const insertGoal = prepareInsert(db, 'goals', snapshot.results.find((row) => row.goals.length).goals[0]);

    snapshot.teams.forEach(insertTeam);
    snapshot.players.forEach(insertPlayer);
    for (const result of snapshot.results) {
      insertMatch(result.match);
      result.appearances.forEach(insertAppearance);
      result.events.forEach(insertEvent);
      result.goals.forEach(insertGoal);
    }
    const insertMetadata = db.prepare('INSERT INTO metadata VALUES (?, ?)');
    for (const [name, value] of Object.entries(snapshot.metadata)) insertMetadata.run(name, value);
    const errors = db.prepare('PRAGMA foreign_key_check').all();
    if (errors.length) throw new Error('O snapshot contém chaves estrangeiras inválidas.');
    db.exec('COMMIT;');
    writing = false;
  } catch (error) {
    if (writing) db.exec('ROLLBACK;');
    throw error;
  } finally {
    db.close();
  }
}

try {
  if (!process.argv.includes('--force') && snapshotIsCurrent()) {
    console.log('A revisão ' + revision.slice(0, 8) + ' já foi importada.');
  } else {
    const snapshot = await buildSnapshot();
    persist(snapshot);
    console.log('StatsBomb Open Data — Copa do Mundo 2022.');
    console.log(snapshot.metadata.matches + ' partidas, ' + snapshot.teams.length + ' seleções, '
      + snapshot.metadata.players + ' atletas e ' + snapshot.metadata.spatialEvents + ' eventos espaciais.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
