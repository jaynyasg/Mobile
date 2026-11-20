/** Isolated browser coverage: no real payments, reservations, or messages. */
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium, webkit } from "playwright";
const base = process.env.BASE_URL ?? "http://127.0.0.1:8082";
const program = { ...JSON.parse(await readFile("src/content/tatel.json", "utf8")), places: JSON.parse(await readFile("src/content/places.json", "utf8")) };
await mkdir(".vitest/ceo-visit", { recursive: true });
const button = (page, name) => page.getByRole("button", { name, exact: true }).filter({ visible: true }).first();

async function checkTouchStory(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  await page.route("**/api/**", route => route.fulfill({ json: program }));
  try {
    await page.goto(base);
    const story = page.getByRole("dialog", { name: "What is TATEL" });
    const heading = story.getByRole("heading");
    await heading.filter({ hasText: "TATEL is a Technology Mill." }).waitFor();
    await page.clock.install();
    await button(story, "Inside the Technology Mill").click();
    await page.clock.fastForward(20000);
    await story.getByText(/Learning Labs for professional advancement/).waitFor();
    await button(story, "Back to the film").click();
    await page.clock.fastForward(18000);
    await heading.filter({ hasText: "Build it in the room" }).waitFor();
    const touch = await page.context().newCDPSession(page);
    const send = (type, x, y) => touch.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await send("touchStart", 250, 160);
    await send("touchMove", 95, 161);
    await send("touchEnd");
    await heading.filter({ hasText: "Five letters" }).waitFor();
    await send("touchStart", 250, 160);
    await page.clock.fastForward(20000);
    await send("touchEnd");
    await heading.filter({ hasText: "Five letters" }).waitFor();
    await page.touchscreen.tap(250, 160);
    await heading.filter({ hasText: "Four days" }).waitFor();
    await page.keyboard.press("ArrowLeft");
    await heading.filter({ hasText: "Five letters" }).waitFor();
  } finally { await page.close(); }
}

async function seed(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce", serviceWorkers: "block", acceptDownloads: true });
  context.setDefaultTimeout(20000); context.setDefaultNavigationTimeout(20000);
  await context.route("**/api/**", route => route.fulfill({ status: route.request().url().endsWith("/api/program") ? 200 : 503, contentType: "application/json", body: JSON.stringify(route.request().url().endsWith("/api/program") ? program : { error: "isolated" }) }));
  await context.route("https://www.lovangovi.com/**", route => route.fulfill({ contentType: "text/html", body: "<h1>Isolated provider preview</h1>" }));
  await context.addInitScript(() => {
    if (sessionStorage.getItem("ceo-seeded")) return;
    const day = new Date(); localStorage.setItem("tatel.introDay", `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`);
    localStorage.setItem("tatel.welcomeSeen", "1"); localStorage.setItem("tatel.install.dismissedUntil", String(Date.now() + 86400000));
    sessionStorage.setItem("tatel.reelsSeen", "pass,stays,sessions,venues,guide,community");
    localStorage.setItem("tatel.intake.v1", JSON.stringify({ hasPass: "have", ticketPreference: "beach", needsStay: "yes", areas: ["tech", "travel"], interests: ["need:food"], completed: [], progressVersion: 2 }));
    sessionStorage.setItem("ceo-seeded", "1");
  });
  return context;
}
for (const [name, engine] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await engine.launch();
  try {
    if (name === "chromium") await checkTouchStory(browser);
    for (const width of [390, 320]) {
      const context = await seed(browser, width); const page = await context.newPage();
      const errors = []; page.on("pageerror", error => errors.push(error.message));
      for (const [choice, next] of [["Find my ticket", "Stay on land"], ["I have a ticket · Plan my stay", "Be on the Beach"], ["Explore TATEL", null]]) {
        console.log(`${name} ${width}: ${choice}`);
        await page.goto(base); await button(page, "What is TATEL").click();
        const story = page.getByRole("dialog", { name: "What is TATEL" });
        if (choice === "Find my ticket") {
          assert.equal(await story.locator("video").count(), 0, "Reduced motion uses the chapter poster");
          await page.screenshot({ path: `.vitest/ceo-visit/${name}-${width}-opening.png` });
        }
        await button(story, "Next").click();
        await story.getByRole("heading", { name: "Build it in the room, then test it live." }).waitFor();
        if (choice === "Find my ticket") {
          await button(story, "Next").click();
          await button(story, "Explore the five areas").click();
          const law = story.getByRole("checkbox", { name: "Law", exact: true });
          await law.check();
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("tatel.intake.v1")).areas.includes("law")), true);
          await button(story, "Back to the film").click();
          await button(story, "Next").click();
          await button(story, "See the days and islands").click();
          await button(story, "January 28").click();
          await story.getByText("Build & test", { exact: true }).waitFor();
          await button(story, "Back to the film").click();
          await button(story, "Next").click();
          await button(story, "Meet the islands").click();
          await button(story, "Next island").click();
          await story.getByTestId("island-story").getByText("St. John", { exact: true }).waitFor();
          await page.screenshot({ path: `.vitest/ceo-visit/${name}-${width}-islands.png` });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        }
        await button(story, "Skip").click();
        await button(story, choice).click();
        if (next) { await button(page, next).waitFor(); await button(page, "Plan later").click(); }
        else await page.waitForURL(url => url.pathname === "/explore");
      }
      await page.getByTestId("island-story").waitFor();
      for (let i = 0; i < 5; i++) await button(page, "Next island").click();
      await page.getByTestId("island-story").getByText("St. Croix", { exact: true }).waitFor();
      assert.match(await page.getByTestId("island-story").innerText(), /not a TATEL program stop/);
      await page.goto(`${base}/work?session=T2-D1`);
      console.log(`${name} ${width}: notebook`);
      await page.getByRole("textbox", { name: "The island need", exact: true }).fill("Connect local growers with buyers.");
      await button(page, "Save my notebook").click(); await page.getByText("Notebook saved on this device.", { exact: true }).waitFor();
      await page.reload(); assert.equal(await page.getByRole("textbox", { name: "The island need", exact: true }).inputValue(), "Connect local growers with buyers.");
      const download = page.waitForEvent("download"); await button(page, "Export my notebook").click(); assert.match((await download).suggestedFilename(), /TATEL-T2-notebook/);
      await page.goto(`${base}/program-overview`); await page.getByRole("link", { name: "Explore this day's sessions", exact: true }).nth(2).click();
      console.log(`${name} ${width}: daily program`);
      await page.waitForURL(url => url.pathname === "/agenda" && url.searchParams.get("day") === "2027-01-28");
      assert.equal(await page.getByTestId("session-guide").count(), 0);
      await button(page, "See sessions matched to my interests").click(); await page.getByTestId("session-guide").waitFor();
      await page.goto(`${base}/stays/lovango`); await button(page, "View & book: Lovango Resort & Beach Club").click();
      console.log(`${name} ${width}: providers`);
      const dialog = page.getByRole("dialog"); await dialog.waitFor(); assert.equal(await dialog.locator("iframe").count(), 1);
      assert.ok((await dialog.boundingBox()).width <= width, "Provider window fits the phone width");
      await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("tatel.intake.v1")).accommodation), undefined);
      await button(page, "View & book: Lovango Resort & Beach Club").click(); await button(page, "I have a confirmed reservation").click();
      await dialog.waitFor({ state: "hidden" }); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("tatel.intake.v1")).accommodation.island), "Lovango");
      await page.goto(`${base}/stays/scrub-island`); await page.getByRole("button", { name: /^View & book:/ }).first().click();
      await dialog.waitFor(); assert.equal(await dialog.locator("iframe").count(), 0); await dialog.getByText(/requires its own website/).waitFor();
      await page.screenshot({ path: `.vitest/ceo-visit/${name}-${width}-provider.png` });
      await button(page, "Back to TATEL").click(); await dialog.waitFor({ state: "hidden" });
      await page.goto(`${base}/stays/near-tortola`); assert.equal(await page.getByRole("button", { name: /^I have booked/ }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      assert.deepEqual(errors, []); await context.close(); console.log(`${name} ${width}: story choices, island story, daily program, notebook, and provider windows passed`);
    }
  } finally { await browser.close(); }
}
