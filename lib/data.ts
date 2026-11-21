import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { cache } from 'react';
import { positionFor, roleFor } from '../scripts/normalize-statsbomb.mjs';

type Stats = {
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  xg: number | null;
  passes: number;
  completed: number;
  dribbles: number;
  tackles: number;
  interceptions: number;
  carries: number;
  progressiveCarries: number;
  keyPasses: number;
  xgAssisted: number | null;
};

export type Player = Stats & {
  id: number;
  name: string;
  shortName: string;
  teamId: number;
  team: string;
  position: string;
  role: string;
  shirt: number | null;
  birthDate: string | null;
  country: string | null;
  games: number;
};

export type Team = {
  id: number;
  name: string;
  group: string | null;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
};

export type Match = {
  id: number;
  date: string;
  homeId: number;
  awayId: number;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  stage: string;
  round: number;
  group: string | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  stadium: string | null;
  homeFormation: string | null;
  awayFormation: string | null;
  sourceUpdated: string | null;
  coordinateVersion: string | null;
  shotVersion: string | null;
};

export type Appearance = Stats & {
  playerId: number;
  matchId: number;
  teamId: number;
  position: string;
  shirt: number | null;
  starter: boolean;
  played: boolean;
};

export type FieldEvent = {
  id: string;
  matchId: number;
  minute: number;
  second: number;
  period: number;
  type: string;
  x: number;
  y: number;
  endX: number | null;
  endY: number | null;
  outcome: string | null;
  xg: number | null;
};

export type Goal = {
  id: string;
  matchId: number;
  teamId: number;
  playerId: number | null;
  minute: number;
  period: number;
  ownGoal: boolean;
};

export type ScoutData = {
  players: Player[];
  teams: Team[];
  matches: Match[];
  updated: string;
  sourceUpdated: string;
  revision: string;
  eventCount: number;
};

const positionsSql = `
  WITH minutes_by_position AS (
    SELECT a.playerId, position.key AS id, SUM(position.value) AS minutes
    FROM appearances a, json_each(a.positionBreakdown) position
    WHERE a.played = 1
    GROUP BY a.playerId, position.key
  ), primary_position AS (
    SELECT playerId, id, ROW_NUMBER() OVER (PARTITION BY playerId ORDER BY minutes DESC, CAST(id AS INTEGER)) AS rank
    FROM minutes_by_position
  )
`;

const playersSql = positionsSql + `
  SELECT p.id, p.name, p.shortName, p.teamId, p.team, CAST(pos.id AS INTEGER) AS positionId,
    p.shirt, p.birthDate, p.country,
    COUNT(a.matchId) AS games, COALESCE(SUM(a.minutes), 0) AS minutes,
    COALESCE(SUM(a.goals), 0) AS goals, COALESCE(SUM(a.assists), 0) AS assists, COALESCE(SUM(a.shots), 0) AS shots,
    CASE WHEN COUNT(a.matchId) = COUNT(a.xg) THEN SUM(a.xg) END AS xg,
    COALESCE(SUM(a.passes), 0) AS passes, COALESCE(SUM(a.completed), 0) AS completed,
    COALESCE(SUM(a.dribbles), 0) AS dribbles, COALESCE(SUM(a.tackles), 0) AS tackles,
    COALESCE(SUM(a.interceptions), 0) AS interceptions, COALESCE(SUM(a.carries), 0) AS carries,
    COALESCE(SUM(a.progressiveCarries), 0) AS progressiveCarries, COALESCE(SUM(a.keyPasses), 0) AS keyPasses,
    CASE WHEN COUNT(a.matchId) = COUNT(a.xgAssisted) THEN SUM(a.xgAssisted) END AS xgAssisted
  FROM players p LEFT JOIN appearances a ON a.playerId = p.id AND a.played = 1
  LEFT JOIN primary_position pos ON pos.playerId = p.id AND pos.rank = 1
  GROUP BY p.id
  ORDER BY games DESC, p.name
`;

function snapshotPath() {
  return resolve(/* turbopackIgnore: true */ process.env.SCOUTVISION_DB_PATH || '.data/scoutvision.sqlite');
}

function withSnapshot<T>(read: (db: DatabaseSync) => T, path = snapshotPath()): T | null {
  if (!existsSync(/* turbopackIgnore: true */ path)) return null;
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    db.exec('PRAGMA busy_timeout = 2000; BEGIN;');
    if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'metadata'").get()) {
      return null;
    }
    return read(db);
  } finally {
    db.close();
  }
}

function readData(path: string): ScoutData | null {
  return withSnapshot((db) => {
    const meta = Object.fromEntries(db.prepare('SELECT name, value FROM metadata').all()
      .map(({ name, value }) => [name as string, value as string]));
    if (!meta.revision) return null;
    const rows = db.prepare(playersSql).all() as unknown as
      (Omit<Player, 'position' | 'role'> & { positionId: number | null })[];
    const players = rows.map(({ positionId, ...row }) => ({
      ...row,
      position: positionFor(positionId ?? 0),
      role: roleFor(positionId ?? 0),
    }));
    return {
      players,
      teams: db.prepare('SELECT * FROM teams ORDER BY name').all().map((row) => ({ ...row })) as unknown as Team[],
      matches: db.prepare('SELECT * FROM matches ORDER BY date, id').all().map((row) => ({ ...row })) as unknown as Match[],
      updated: meta.updated,
      sourceUpdated: meta.sourceUpdated,
      revision: meta.revision,
      eventCount: Number(meta.spatialEvents),
    };
  }, path);
}

function snapshotStamp(path: string) {
  const stamp = (file: string) => {
    const stat = statSync(/* turbopackIgnore: true */ file, { bigint: true, throwIfNoEntry: false });
    return stat ? `${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}` : "";
  };
  const database = stamp(path);
  return database ? `${database}:${stamp(path + '-wal')}` : "";
}

let cachedData: { path: string; stamp: string; data: ScoutData } | undefined;

export function getData(): ScoutData | null {
  const path = snapshotPath();
  const stamp = snapshotStamp(path);
  if (stamp && cachedData?.path === path && cachedData.stamp === stamp) return cachedData.data;

  const data = readData(path);
  cachedData = data && stamp && stamp === snapshotStamp(path) ? { path, stamp, data } : undefined;
  return data;
}

export const getRequestData = cache(getData);

function readAppearances(db: DatabaseSync, conditions: string, id: number) {
  const columns = `a.playerId, a.matchId, a.teamId, a.position, a.shirt, a.starter, a.played, a.minutes,
    a.goals, a.assists, a.shots, a.xg, a.passes, a.completed, a.dribbles, a.tackles, a.interceptions,
    a.carries, a.progressiveCarries, a.keyPasses, a.xgAssisted`;
  const rows = db.prepare('SELECT ' + columns + ' FROM appearances a JOIN matches m ON a.matchId = m.id WHERE '
    + conditions + ' ORDER BY m.date DESC, a.starter DESC, a.shirt, a.playerId')
    .all(id) as unknown as (Omit<Appearance, 'starter' | 'played'> & {
      starter: number;
      played: number;
    })[];
  return rows.map(({ starter, played, ...row }) => ({
    ...row,
    played: Boolean(played),
    starter: Boolean(starter),
  }));
}

export function getAppearances(playerId: number): Appearance[] {
  return withSnapshot((db) => readAppearances(db, 'a.playerId = ? AND a.played = 1', playerId)) ?? [];
}

export function getMatchLineups(matchId: number): Appearance[] {
  return withSnapshot((db) => readAppearances(db, 'a.matchId = ?', matchId)) ?? [];
}

export function getEvents(playerId: number, matchId?: number): FieldEvent[] {
  return withSnapshot((db) => {
    const select = `SELECT e.id, e.matchId, e.minute, e.second, e.period, e.type, e.x, e.y, e.endX, e.endY, e.outcome, e.xg
      FROM field_events e JOIN matches m ON e.matchId = m.id WHERE e.playerId = ?`;
    const sql = select + (matchId === undefined ? '' : ' AND e.matchId = ?')
      + ' ORDER BY m.date DESC, e.eventIndex';
    return db.prepare(sql).all(...(matchId === undefined ? [playerId] : [playerId, matchId]))
      .map((row) => ({ ...row })) as unknown as FieldEvent[];
  }) ?? [];
}

export function getMatchGoals(matchId: number): Goal[] {
  return withSnapshot((db) => {
    const rows = db.prepare('SELECT * FROM goals WHERE matchId = ? ORDER BY period, minute, id')
      .all(matchId) as unknown as (Omit<Goal, 'ownGoal'> & { ownGoal: number })[];
    return rows.map(({ ownGoal, ...row }) => ({ ...row, ownGoal: Boolean(ownGoal) }));
  }) ?? [];
}

export function getTeamGoalPeriods(teamId: number): { label: string; goals: number }[] {
  return withSnapshot((db) => {
    const bins = ['1–15', '16–30', '31–45+', '46–60', '61–75', '76–90+', '91–105+', '106–120+']
      .map((label) => ({ label, goals: 0 }));
    const rows = db.prepare('SELECT minute, period FROM goals WHERE teamId = ?').all(teamId);
    for (const { minute, period } of rows as { minute: number; period: number }[]) {
      const bin = period === 1 ? Math.min(2, Math.floor(minute / 15))
        : period === 2 ? Math.min(5, Math.max(3, Math.floor(minute / 15)))
        : period === 3 ? 6 : 7;
      bins[bin].goals += 1;
    }
    return bins;
  }) ?? [];
}
