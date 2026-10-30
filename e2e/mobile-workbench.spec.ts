import { realpathSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
	enterDefaultWorkspace,
	openFixtureProject,
	openPersistedChat,
	PHONE_VIEWPORT,
} from "./fixtures/app";
import { E2E_FIXTURE_REPO } from "./fixtures/paths";
import { seedWorkspaceSession } from "./fixtures/sessions";

test.use({ hasTouch: true, viewport: { width: 1280, height: 800 } });

test("phone navigation shows projects and sessions without changing the desktop frame", async ({
	page,
}) => {
	await openFixtureProject(page);
	seedWorkspaceSession(realpathSync(E2E_FIXTURE_REPO), {
		name: "Phone conversation",
		messages: [{ role: "user", text: "A phone conversation", timestamp: Date.now() }],
	});
	seedWorkspaceSession(realpathSync(E2E_FIXTURE_REPO), {
		name: "Another conversation",
		messages: [{ role: "user", text: "Another phone conversation", timestamp: Date.now() }],
	});
	await enterDefaultWorkspace(page);
	await openPersistedChat(page, "Phone conversation");
	await openPersistedChat(page, "Another conversation");
	await page
		.locator('[data-testid="editor-tab"][data-kind="chat"]')
		.filter({ hasText: "Another conversation" })
		.click();
	const desktopProjects = await page.getByTestId("left-stack").count();

	await page.setViewportSize(PHONE_VIEWPORT);
	await expect(page.getByTestId("mobile-workbench")).toBeVisible();
	await expect(page.getByTestId("left-stack")).toHaveCount(0);
	await expect(page.getByTestId("right-stack")).toHaveCount(0);
	await expect(page.getByText("Another phone conversation")).toBeVisible();
	await expect
		.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
		.toBeLessThanOrEqual(0);

	await page.getByTestId("mobile-projects").tap();
	await expect(page.getByTestId("project-tree")).toBeVisible();
	await page.keyboard.press("Escape");
	await page.getByTestId("mobile-sessions").tap();
	await expect(page.getByTestId("mobile-session")).toHaveCount(2);
	await page.getByTestId("mobile-session").filter({ hasText: "Phone conversation" }).tap();
	await expect(page.getByTestId("mobile-drawer")).toHaveCount(0);
	await expect(page.getByText("A phone conversation")).toBeVisible();

	await page.setViewportSize({ width: 1280, height: 800 });
	await expect(page.getByTestId("mobile-workbench")).toHaveCount(0);
	await expect(page.getByTestId("left-stack")).toHaveCount(desktopProjects);
	await expect(page.getByText("A phone conversation")).toBeVisible();
});
