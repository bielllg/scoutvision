import assert from "node:assert/strict";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import test from "node:test";
import { getAppearances, getData, getEvents, getMatchGoals, getMatchLineups } from "../lib/data.ts";

const installed = existsSync(resolve(process.env.SCOUTVISION_DB_PATH || ".data/scoutvision.sqlite"));

test("recorte importado bate com o placar e os eventos originais de Brasil x Sérvia", { skip: !installed }, () => {
  const data = getData();
  assert.ok(data);
  assert.equal(data.matches.length, 64);
  assert.equal(data.teams.length, 32);
  assert.equal(data.players.length, 829);
  const match = data.matches.find((entry) => entry.id === 3857258);
  assert.deepEqual([match.homeScore, match.awayScore], [2, 0]);
  const appearance = getAppearances(3280).find((entry) => entry.matchId === match.id);
  assert.equal(appearance.goals, 2);
  assert.equal(getMatchLineups(match.id).filter((entry) => entry.starter).length, 22);
  const goals = getEvents(3280, match.id).filter((event) => event.type === "Finalização" && event.outcome === "Gol");
  assert.deepEqual(goals.map(({ x, y, xg }) => [x, y, xg]), [
    [114.5, 41.8, 0.568145], [107.1, 39.6, 0.07569885],
  ]);
});

test("eventos de defesa preservam o desfecho e os totais excluem ações malsucedidas", { skip: !installed }, () => {
  const matchId = 3857258;
  const milenkovic = getAppearances(5603).find((appearance) => appearance.matchId === matchId);
  assert.equal(milenkovic.tackles, 3);
  assert.equal(milenkovic.interceptions, 3);
  assert.ok(getEvents(5603, matchId).some((event) => event.type === "Desarme" && event.outcome?.startsWith("Perdido")));
  const keeperEvent = getEvents(20600, matchId).find((event) => event.id === "47d6dcd1-4d7a-4e4f-b7ca-37a0939cc818");
  assert.equal(keeperEvent?.outcome, "Toque para fora");
});

test("gol contra registra o atleta do evento vinculado sem creditá-lo como artilheiro", { skip: !installed }, () => {
  const matchId = 3857276;
  const goal = getMatchGoals(matchId).find((entry) => entry.ownGoal);
  const match = getData().matches.find((entry) => entry.id === matchId);
  const appearance = getAppearances(12149).find((entry) => entry.matchId === matchId);
  assert.equal(goal.playerId, appearance.playerId);
  assert.notEqual(goal.teamId, appearance.teamId);
  assert.ok(goal.teamId === match.homeId || goal.teamId === match.awayId);
  assert.equal(appearance.goals, 0);
});
