import assert from "node:assert/strict";
import test from "node:test";
import { density, difference, fieldCoordinates, participationSeries, passZones, per90, percentile, ratio } from "../lib/metrics.ts";
import { csvContent } from "../lib/export.ts";

test("taxas mantêm a distinção entre zero registrado e ausência", () => {
  assert.equal(per90(0, 90), 0);
  assert.equal(per90(null, 90), null);
  assert.equal(per90(5, 0), null);
  assert.equal(per90(10, 200), 4.5);
  assert.equal(ratio(12, 16), 75);
  assert.equal(ratio(0, 0), null);
});

test("percentil aplica a média dos empates e o corte de amostra", () => {
  assert.equal(percentile(2, [1, 2, 2, 3], 4), 50);
  assert.equal(percentile(2, [1, 2, 2, 3]), null);
  assert.equal(percentile(null, [1, 2, 2, 3], 4), null);
});

test("delta relativo exige base conhecida e diferente de zero", () => {
  assert.deepEqual(difference(0, 3), { absolute: 3, relative: null });
  assert.deepEqual(difference(2, 3), { absolute: 1, relative: 50 });
  assert.equal(difference(null, 3), null);
});

test("campo mantém a orientação do provedor e ignora coordenadas inválidas", () => {
  assert.deepEqual(fieldCoordinates(114.5, 41.8), { x: 114.5, y: 41.8 });
  assert.equal(fieldCoordinates(121, 1), null);
  assert.equal(fieldCoordinates(90, Number.NaN), null);
  const peak = density([{ x: 108, y: 40 }, { x: 120.01, y: 40 }]).find(({ value }) => value === 1);
  assert.ok(peak && peak.x > 100 && peak.y > 36 && peak.y < 44);
});

test("participações acumuladas crescem apenas em jogos com participação em gol", () => {
  const games = [{ goals: 2, assists: 0 }, { goals: 0, assists: 0 }, { goals: 1, assists: 2 }];
  assert.deepEqual(participationSeries(games, true), [2, 2, 5]);
  assert.deepEqual(participationSeries(games, false), [2, 0, 3]);
});

test("origens de passes são contadas uma vez, inclusive nas linhas de divisão e nas bordas", () => {
  const zones = passZones([{ x: 0, y: 0 }, { x: 40, y: 40 }, { x: 120, y: 80 }, { x: -1, y: 40 }]);
  assert.deepEqual(zones.map((zone) => zone.count), [1, 0, 0, 0, 1, 0, 0, 0, 1]);
});

test("CSV preserva zero, representa ausência e protege valores interpretáveis como fórmulas", () => {
  assert.equal(csvContent([["clube", "nome"], ['A"B', "=1+1"], [0, null]]),
    "\uFEFF\"clube\";\"nome\"\r\n\"A\"\"B\";\"'=1+1\"\r\n\"0\";\"\"");
});
