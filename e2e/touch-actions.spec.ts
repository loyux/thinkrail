import { realpathSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
	enterDefaultWorkspace,
	hideAuxiliaryWorkbench,
	openFixtureProject,
	openPersistedChat,
	PHONE_VIEWPORT,
} from "./fixtures/app";
import { E2E_FIXTURE_REPO } from "./fixtures/paths";
import { seedWorkspaceSession } from "./fixtures/sessions";

test.use({ hasTouch: true, viewport: { width: 1280, height: 800 } });

test("touch devices expose message copy and tab close without hover", async ({ page }) => {
	await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
	await openFixtureProject(page);
	seedWorkspaceSession(realpathSync(E2E_FIXTURE_REPO), {
		name: "Touch actions",
		messages: [{ role: "user", text: "Copy this message", timestamp: Date.now() }],
	});
	await enterDefaultWorkspace(page);
	await openPersistedChat(page, "Touch actions");
	await hideAuxiliaryWorkbench(page);
	await page.setViewportSize(PHONE_VIEWPORT);

	expect(await page.evaluate(() => matchMedia("(hover: none)").matches)).toBe(true);
	const copy = page.getByTestId("chat-copy").first();
	await expect(copy).toHaveCSS("opacity", "1");
	await copy.tap();
	await expect(copy).toHaveAttribute("data-copied", "true");
	await page.getByTestId("mobile-sessions").tap();
	await page.getByTestId("mobile-close-session").tap();
	await expect(page.getByTestId("mobile-session")).toHaveCount(0);
	await page.getByTestId("chat-history").tap();
	await page.getByTestId("closed-chat-item").filter({ hasText: "Touch actions" }).tap();
	await page.keyboard.press("Escape");
	await expect(page.getByTestId("chat-copy").first()).toBeVisible();
});
