import { test, expect } from "@playwright/test";

const entries = [
  { categoryId: "1", name: "Comida com Luiza", color: "#F59E0B", amount: 131.5 },
  { categoryId: "2", name: "Combustível", color: "#EF4444", amount: 123.64 },
  { categoryId: "3", name: "Carro", color: "#F97316", amount: 105.6 },
  { categoryId: "4", name: "Jogos", color: "#8B5CF6", amount: 83.08 },
  { categoryId: "5", name: "Comida Faculdade", color: "#10B981", amount: 40.05 },
  { categoryId: "6", name: "Compras", color: "#EC4899", amount: 25.74 },
  { categoryId: "7", name: "Outros", color: "#64748B", amount: 22.93 },
];
const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
const categories = entries.map((entry) => ({ id: entry.categoryId, name: entry.name, color: entry.color, icon: "tag", isIncome: false, isSystem: true }));

for (const width of [320, 390, 768, 1440]) {
  test(`charts remain readable and selectable at ${width}px`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: true, isMobile: width < 768 });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem("finora_token", "chart-test");
      localStorage.setItem("finora_user", JSON.stringify({ id: "test", name: "Teste", email: "test@example.com" }));
    });
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (!["fetch", "xhr"].includes(request.resourceType())) return route.continue();
      const pathname = new URL(request.url()).pathname;
      if (pathname.endsWith("/dashboard")) {
        return route.fulfill({ json: {
          summary: { totalSpent: total, totalIncome: 0, available: null, totalLimit: null },
          alertCategories: [], categoryBudgets: [], recentTransactions: [], donutData: entries,
          lineData: Array.from({ length: 31 }, (_, index) => ({ day: index + 1, cumulative: Math.min(index + 1, 8) / 8 * total })),
        } });
      }
      if (pathname.endsWith("/categories")) return route.fulfill({ json: categories });
      if (pathname.endsWith("/transactions")) return route.fulfill({ json: entries.map((entry, index) => ({
        id: entry.categoryId, userId: "test", categoryId: entry.categoryId, description: entry.name,
        amount: entry.amount, date: "2026-10-08", category: categories[index],
      })) });
      return route.abort();
    });
    await page.goto("/");
    const legend = page.getByRole("list", { name: "Gastos por categoria", exact: true });
    await expect(legend.getByRole("button")).toHaveCount(entries.length);
    await expect(page.locator(".category-donut path.recharts-sector")).toHaveCount(entries.length);
    for (const entry of entries) {
      const label = legend.getByText(entry.name, { exact: true });
      await expect(label).toBeVisible();
      expect(await label.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }

    const shopping = legend.getByRole("button", { name: /Compras/ });
    await shopping.tap();
    await expect(shopping).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status")).toContainText("Compras");
    await shopping.tap();
    await expect(page.getByRole("status")).toContainText("Total no mês");

    const donut = page.locator(".category-donut");
    await donut.scrollIntoViewIfNeeded();
    const rect = (await donut.boundingBox())!;
    const angle = Math.PI * entries[0].amount / total;
    await page.touchscreen.tap(rect.x + rect.width / 2 + 100 * Math.sin(angle), rect.y + rect.height / 2 - 100 * Math.cos(angle));
    await expect(legend.getByRole("button", { name: /Comida com Luiza/ })).toHaveAttribute("aria-pressed", "true");
    expect(await donut.locator(":focus").evaluateAll((elements) => elements.every((element) => getComputedStyle(element).outlineStyle === "none"))).toBe(true);
    const categoryCard = page.getByText("Gastos por categoria", { exact: true }).locator("..");
    await categoryCard.evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 90));
    await categoryCard.screenshot({ path: testInfo.outputPath(`categories-${width}.png`) });

    // The SVG has no duplicate keyboard stops; the legend preserves visible focus.
    await shopping.focus();
    await page.keyboard.press("Tab");
    const other = legend.getByRole("button", { name: /Outros/ });
    await expect(other).toBeFocused();
    expect(await other.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
    await page.keyboard.press("Enter");
    await expect(other).toHaveAttribute("aria-pressed", "true");

    const axisLabels = page.locator(".financial-chart .recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value");
    await expect(axisLabels.first()).toBeAttached();
    expect((await axisLabels.allTextContents()).some((label) => label.includes("0k"))).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.locator(".financial-chart").locator("..").screenshot({ path: testInfo.outputPath(`trend-${width}.png`) });

    await page.goto("/transactions");
    const ranking = page.getByRole("list", { name: "Ranking de gastos por categoria" });
    await expect(ranking.getByRole("listitem")).toHaveCount(entries.length);
    await expect(ranking.getByText("Comida Faculdade", { exact: true })).toBeVisible();
    await ranking.locator("..").screenshot({ path: testInfo.outputPath(`ranking-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  });
}
