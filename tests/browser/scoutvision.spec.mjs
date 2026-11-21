import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("busca, perfil, favoritos, comparador e exportação por teclado", async ({ page }) => {
  await page.goto("/jogadores");
  await page.getByRole("searchbox", { name: "Nome" }).fill("Richarlison");
  await page.getByRole("link", { name: "Richarlison" }).click();
  await page.getByRole("button", { name: "Favoritar", exact: true }).press("Enter");
  await page.goto("/favoritos");
  await expect(page.getByRole("link", { name: "Richarlison" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Richarlison" })).toBeVisible();

  await page.goto("/comparador");
  await page.getByText("Trocar atleta", { exact: true }).first().press("Enter");
  const picker = page.getByRole("combobox", { name: "Buscar atleta 1" });
  await picker.fill("mbappe");
  await picker.press("ArrowDown");
  await picker.press("Enter");
  await expect(page.getByRole("heading", { name: "Kylian Mbappé" })).toBeVisible();

  await page.goto("/analise");
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar CSV" }).press("Enter");
  expect((await csv).suggestedFilename()).toBe("scoutvision-analise.csv");
  await expect(page.getByRole("heading", { name: "Evolução de gols · 2022" })).toBeVisible();
});

test("Dashboard: movimento reduzido, pausa e rodapé sem imagem", async ({ page }) => {
  const images = [];
  page.on("request", (request) => {
    if (request.resourceType() === "image") images.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  await expect(page.getByRole("button", { name: "Pausar animação do campo" })).toBeHidden();
  await expect(page.locator(".world-cup-ball")).toHaveAttribute("visibility", "hidden");
  expect(images.some((url) => url.includes("statsbomb.png"))).toBe(false);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Pausar animação do campo" }).press("Space");
  await expect(page.getByRole("button", { name: "Reiniciar animação do campo" })).toBeFocused();
  await expect(page.locator(".world-cup-ball")).toHaveAttribute("visibility", "hidden");
});

test("compara edições e filtra os resultados de 2018", async ({ page }) => {
  await page.goto("/competicoes/copa-2018");
  await expect(page.getByRole("heading", { name: "Comparação entre edições" })).toBeVisible();
  await page.getByLabel("Fase da Copa de 2018").selectOption("Final");
  await page.getByRole("button", { name: "Filtrar resultados" }).press("Enter");
  await expect(page).toHaveURL(/fase=Final/);
  const results = page.getByRole("region", { name: "Placares de 2018" });
  await expect(results.getByRole("row")).toHaveCount(2);
  await expect(results.getByText("França × Croácia")).toBeVisible();
  await expect(results.getByText("4 × 2")).toBeVisible();
});

for (const route of ["/", "/jogadores", "/jogadores/3280", "/equipes", "/competicoes/copa-2018", "/competicoes/copa-2022",
  "/partidas/3857258", "/comparador", "/mapas", "/analise", "/favoritos", "/configuracoes"]) {
  test(`acessibilidade automatizada em ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([]);
  });
}
