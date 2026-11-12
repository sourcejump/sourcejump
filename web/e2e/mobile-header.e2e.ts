// The imported mobile menu and search preserve upstream branding and the full Steam sign-in.
import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1024, 1280]) {
  test(`header and menu at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto("/dev/ui");
    const header = page.getByRole("banner");
    const signIn = header.getByRole("link", {
      name: "Sign in with Steam",
      exact: true,
    });
    await expect(signIn).toBeVisible();
    const mark = header.getByRole("link", { name: "SourceJump", exact: true });
    await expect(mark).toHaveClass(
      "text-lg font-bold tracking-wider whitespace-nowrap uppercase",
    );
    const headerBounds = (await header.boundingBox())!;
    const buttonBounds = (await signIn.boundingBox())!;
    expect(buttonBounds.x + buttonBounds.width).toBeLessThanOrEqual(width);
    expect(buttonBounds.y + buttonBounds.height).toBeLessThanOrEqual(
      headerBounds.height,
    );
    const trigger = page.getByRole("button", { name: "Sections", exact: true });
    if (width >= 1024) {
      await expect(trigger).toBeHidden();
      await expect(
        header
          .getByRole("navigation", { name: "Main", exact: true })
          .getByRole("link", { name: "Maps", exact: true }),
      ).toBeVisible();
      return;
    }
    const menu = page.getByRole("menu");
    await trigger.click();
    await expect(menu).toBeVisible();
    await expect(menu.locator("[data-menu-panel]")).toHaveCSS("opacity", "1");
    await expect(
      menu.getByText("Every map, with its tier and world record"),
    ).toBeVisible();
    await expect(menu.getByRole("menuitem")).toHaveCount(11);
    await expect(
      menu.getByRole("menuitem", { name: "Discord", exact: true }),
    ).toHaveAttribute("href", "https://discord.gg/RYP5G4tuwX");
    expect((await menu.boundingBox())!.y).toBe(headerBounds.height - 1);
    expect(await menu.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
      true,
    );
    await page.keyboard.press("End");
    await expect(
      menu.getByRole("menuitem", { name: "Instagram", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await menu.getByRole("menuitem", { name: "Ruleset", exact: true }).click();
    await expect(page).toHaveURL(/\/ruleset$/);
    await expect(menu).toBeHidden();
    await trigger.click();
    await page.mouse.click(width - 5, 735);
    await expect(menu).toBeHidden();
  });
}

test("mobile search supports upstream player data, keyboard selection and closing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.route("**/v1/players?**", (route) =>
    route.fulfill({
      json: {
        players: [
          {
            steamid64: "76561198000000000",
            name: "Search Player",
            avatar_url: null,
            country_code: null,
            activity: [],
            latest_run: { finished_at: new Date().toISOString() },
          },
        ],
      },
    }),
  );
  await page.route("**/v1/maps?**", (route) =>
    route.fulfill({ json: { maps: [] } }),
  );
  await page.goto("/dev/ui");
  await page
    .getByRole("button", { name: "Search players and maps", exact: true })
    .click();
  const input = page.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.fill("search");
  const result = page.getByRole("option", { name: /Search Player/ });
  await expect(result).toBeVisible();
  await expect(result.locator("img")).toHaveCount(0);
  await expect(result).toContainText("just now");
  await page.keyboard.press("ArrowDown");
  await expect(result).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/players\/76561198000000000$/);
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("search handles empty results and failures", async ({ page }) => {
  await page.route("**/v1/players?**", (route) =>
    route.fulfill({ json: { players: [] } }),
  );
  await page.route("**/v1/maps?**", (route) =>
    route.fulfill({ json: { maps: [] } }),
  );
  await page.goto("/dev/ui");
  const input = page.getByRole("combobox");
  // Interact first so the shortcut is tested after hydration installs its listener.
  await input.click();
  await page.keyboard.press("Tab");
  await page.keyboard.press("/");
  await expect(input).toBeFocused();
  await input.fill("nothing");
  await expect(page.getByRole("listbox")).toContainText(
    "No players or maps match",
  );
  await page.route("**/v1/players?**", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.route("**/v1/maps?**", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await input.fill("failed");
  await expect(page.getByRole("listbox")).toContainText(
    "Search isn't available right now",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("short mobile screens can reach footer links and mark nested routes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/help/commands");
  await page.getByRole("button", { name: "Sections", exact: true }).click();
  const menu = page.getByRole("menu");
  await menu
    .getByRole("menuitem", { name: "Instagram", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    menu.getByRole("menuitem", { name: "Instagram", exact: true }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await page.goto("/maps/bhop_forest");
  await page.getByRole("button", { name: "Sections", exact: true }).click();
  await expect(menu.getByRole("menuitem", { name: /^Maps/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
