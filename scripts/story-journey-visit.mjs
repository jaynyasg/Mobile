/** Visual journey checks with isolated network effects; never books or sends messages. */
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium, webkit } from "playwright";
const base = process.env.BASE_URL ?? "http://127.0.0.1:8084";
const output = ".vitest/story-journey";
const program = { ...JSON.parse(await readFile("src/content/tatel.json", "utf8")), places: JSON.parse(await readFile("src/content/places.json", "utf8")) };
await mkdir(output, { recursive: true });
const button = (page, name) => page.getByRole("button", { name, exact: true }).filter({ visible: true }).first();
async function isolate(context) {
  await context.route("**/api/**", route => route.fulfill({ status: route.request().url().endsWith("/api/program") ? 200 : 503, json: route.request().url().endsWith("/api/program") ? program : { error: "isolated" } }));
}
for (const [engineName, engine] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await engine.launch(engineName === "chromium" && process.platform === "win32" ? { channel: "chrome" } : {});
  try {
    if (engineName === "chromium") {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
      await isolate(context);
      const page = await context.newPage();
      await page.goto(base);
      const film = page.getByTestId("welcome-film");
      await film.waitFor();
      await button(film, "Pause film").waitFor();
      assert.doesNotMatch(await film.innerText(), /Big ideas|TATEL|Extraordinary company/, "Welcome has no editorial copy over the film");
      await button(film, "Pause film").click();
      const media = page.locator('video[src$="tatel-welcome-intro.mp4"]');
      const stopped = await media.evaluate(video => video.currentTime);
      await page.waitForTimeout(2500);
      assert.equal(await media.evaluate(video => video.paused), true, "Stall recovery respects an intentional pause");
      assert.ok(Math.abs(await media.evaluate(video => video.currentTime) - stopped) < 0.1);
      await page.screenshot({ path: `${output}/welcome-film.png` });
      await button(film, "Resume film").click();
      await page.waitForFunction(() => !document.querySelector('video[src$="tatel-welcome-intro.mp4"]').paused);
      await media.evaluate(video => { video.currentTime = video.duration - 0.25; });
      await film.waitFor({ state: "hidden" });
      await page.getByRole("dialog", { name: "What is TATEL" }).getByRole("heading", { name: "TATEL is a Technology Mill." }).waitFor();
      await context.close();
      console.log("Wordless film plays, pauses, resumes and hands off to the existing story");
    }
    for (const width of [390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce", serviceWorkers: "block" });
      await isolate(context);
      await context.addInitScript(() => {
        localStorage.setItem("tatel.install.dismissedUntil", String(Date.now() + 86400000));
      });
      const page = await context.newPage();
      const errors = []; page.on("pageerror", error => errors.push(error.message));
      await page.goto(base);
      assert.equal(await page.getByTestId("welcome-film").count(), 0, "Reduced motion starts with the accessible story");
      const story = page.getByRole("dialog", { name: "What is TATEL" });
      await button(story, "Skip").click();
      await button(story, "Find my ticket").click();
      await page.screenshot({ path: `${output}/${engineName}-${width}-ticket-choices.png` });
      await button(page, "Stay on land").click();
      await button(page, "My stay is already arranged").click();
      await button(page, "Tech").click(); await button(page, "AI").click();
      await page.screenshot({ path: `${output}/${engineName}-${width}-areas.png` });
      await button(page, "Next · Find my sub-infrastructure").click();
      await button(page, "Food & agriculture").click();
      await button(page, "See my plan").click();
      await page.screenshot({ path: `${output}/${engineName}-${width}-plan.png` });
      await button(page, "Plan later").click();
      await page.screenshot({ path: `${output}/${engineName}-${width}-home.png` });
      await button(page, "Replay the welcome").click();
      await page.getByTestId("welcome-film").waitFor();
      await button(page, "Skip intro").click();
      await button(story, "Skip").click(); await button(story, "Explore TATEL").click();
      await page.waitForURL(url => url.pathname === "/explore");
      await button(page, "Discover St. John").click();
      const island = page.getByTestId("island-story");
      await island.getByText("St. John", { exact: true }).last().waitFor();
      await island.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/${engineName}-${width}-island.png` });
      await button(page, "Island time · Reef").click();
      await page.getByText("Follow the reef at Trunk Bay.", { exact: true }).waitFor();
      const time = page.getByTestId("island-time");
      assert.equal(await time.getByText("A Magens Bay afternoon.").count(), 0);
      await time.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/${engineName}-${width}-island-time.png` });
      await page.goto(`${base}/agenda`);
      const guide = page.getByTestId("session-guide");
      await button(guide, "Matching sessions · Jan 28").click();
      const cards = guide.getByRole("button", { name: /^Open / });
      assert.ok(await cards.count() > 0);
      for (const card of await cards.all()) assert.match(await card.innerText(), /Jan 28/, "Day choices filter existing matches");
      const goal = guide.getByRole("button", { name: /^Session goal:/ }).first();
      assert.equal(await goal.getAttribute("aria-expanded"), "false"); await goal.click();
      assert.equal(await goal.getAttribute("aria-expanded"), "true");
      await guide.getByRole("button", { name: /^Save / }).first().click();
      await guide.getByRole("button", { name: /^Remove .* from favorites$/ }).first().waitFor();
      await page.screenshot({ path: `${output}/${engineName}-${width}-sessions.png` });
      await page.goto(`${base}/program-overview`);
      await button(page, "January 29").click(); await page.getByText("Showcase & expand", { exact: true }).waitFor();
      await page.screenshot({ path: `${output}/${engineName}-${width}-day.png` });
      if (width === 320) await page.evaluate(() => {
        for (const node of document.querySelectorAll("*")) {
          if (![...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim())) continue;
          const style = getComputedStyle(node);
          node.style.fontSize = `${parseFloat(style.fontSize) * 1.3}px`;
          if (parseFloat(style.lineHeight)) node.style.lineHeight = `${parseFloat(style.lineHeight) * 1.3}px`;
        }
      });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${engineName} ${width}: visual choices, itinerary, islands, session days, goals and saved sessions passed`);
    }
  } finally { await browser.close(); }
}
