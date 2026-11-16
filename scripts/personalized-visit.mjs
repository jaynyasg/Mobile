/** Opening preferences must lead to options immediately, including after a retake. No real bookings. */
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:8082";
const output = process.env.ARTIFACT_DIR ?? ".vitest/personalized-visit";
const program = { ...JSON.parse(await readFile("src/content/tatel.json", "utf8")), places: JSON.parse(await readFile("src/content/places.json", "utf8")) };
await mkdir(output, { recursive: true });

async function setup(browser, width, intake) {
  const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce", serviceWorkers: "block" });
  await context.route("**/api/**", route => route.fulfill({ status: route.request().url().endsWith("/api/program") ? 200 : 503, contentType: "application/json", body: JSON.stringify(route.request().url().endsWith("/api/program") ? program : { error: "isolated-test" }) }));
  await context.addInitScript((intake) => {
    if (sessionStorage.getItem("personalized-seeded")) return;
    const day = new Date();
    localStorage.setItem("tatel.introDay", `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`);
    localStorage.setItem("tatel.welcomeSeen", "1");
    localStorage.setItem("tatel.install.dismissedUntil", String(Date.now() + 86400000));
    sessionStorage.setItem("tatel.reelsSeen", "pass,stays,sessions,venues,guide,community");
    if (intake) localStorage.setItem("tatel.intake.v1", JSON.stringify(intake));
    sessionStorage.setItem("personalized-seeded", "1");
  }, intake);
  return context;
}

async function click(page, name) { await page.getByRole("button", { name, exact: true }).filter({ visible: true }).first().click(); }
async function record(page) { return page.evaluate(() => JSON.parse(localStorage.getItem("tatel.intake.v1"))); }
async function islandNames(page) {
  await page.getByTestId("stay-island-options").waitFor({ state: "attached" });
  return page.getByTestId("stay-island-options").getByRole("button").evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")));
}
async function firstOptionOnScreen(page, locator, label) {
  await locator.waitFor();
  await page.waitForFunction(element => {
    const box = element.getBoundingClientRect();
    return box.top >= 0 && box.top < innerHeight - 150;
  }, await locator.elementHandle());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${label}: horizontal overflow`);
}
async function matchingCards(page, area, interest) {
  const guide = page.getByTestId("session-guide").filter({ visible: true });
  await guide.getByText("Your sessions", { exact: true }).waitFor();
  assert.equal(await guide.getByRole("checkbox").count(), 0, "No repeated questions on arrival");
  const cards = guide.getByRole("button", { name: /^Open / });
  assert.ok(await cards.count() > 0, "Session options appear immediately");
  for (const card of await cards.all()) {
    assert.ok(await card.getByText(area, { exact: true }).count(), "Every result matches infrastructure");
    if (interest) assert.ok(await card.getByText(interest, { exact: true }).count(), "Every result matches sub-infrastructure");
  }
  await firstOptionOnScreen(page, cards.first(), "sessions");
}

for (const [engineName, engine] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await engine.launch();
  try {
    for (const width of [390, 320]) {
      const context = await setup(browser, width);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(base);
      await click(page, "Yes, I have a ticket");
      await click(page, "Be on the Beach");
      await click(page, "Help me find a place");
      await click(page, "Tech");
      await click(page, "Next · Find my sub-infrastructure");
      await click(page, "AgriTech");
      await page.screenshot({ path: `${output}/${engineName}-${width}-opening-subtopics.png` });
      await click(page, "See my plan");
      await click(page, "Find my accommodation");
      await click(page, "Enter Accommodations");
      assert.deepEqual(await islandNames(page), ["Open St. Thomas"]);
      await firstOptionOnScreen(page, page.getByTestId("stay-island-options").getByText("St. Thomas", { exact: true }), "islands");
      await page.screenshot({ path: `${output}/${engineName}-${width}-islands.png` });
      assert.deepEqual((await record(page)).interests, ["AgriTech"]);
      assert.equal((await record(page)).completed.includes("stay"), false);
      await click(page, "See all islands");
      assert.equal((await islandNames(page)).length, 5);
      await click(page, "Show my suggested islands");
      assert.deepEqual(await islandNames(page), ["Open St. Thomas"]);
      await click(page, "Sessions");
      await click(page, "Enter Sessions");
      await matchingCards(page, "Tech", "AgriTech");
      await page.screenshot({ path: `${output}/${engineName}-${width}-sessions.png` });

      // Retake while Sessions is already mounted: the next visit must use the new answers.
      await click(page, "Home");
      await click(page, "Retake questions");
      await click(page, "Yes, I have a ticket");
      await click(page, "Be on the Beach");
      await click(page, "My stay is already arranged");
      await click(page, "AI");
      await click(page, "Next · Find my sub-infrastructure");
      await click(page, "See my plan");
      await click(page, "Choose my sessions");
      await click(page, "Enter Sessions");
      await matchingCards(page, "AI");
      assert.deepEqual((await record(page)).interests, []);
      await page.reload();
      await matchingCards(page, "AI");
      await page.goto(`${base}/stays?areas=tech`);
      assert.deepEqual(await islandNames(page), ["Open St. John"], "Latest answers override stale navigation parameters");
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${engineName} ${width}: opening subtopics, immediate islands/sessions, retake and reload passed`);

      const multiple = await setup(browser, width);
      const multi = await multiple.newPage();
      await multi.goto(base);
      await click(multi, "Yes, I have a ticket");
      await click(multi, "Be on the Beach");
      await click(multi, "Help me find a place");
      await click(multi, "Tech");
      await click(multi, "Next · Find my sub-infrastructure");
      const questions = multi.getByLabel("Plan your TATEL visit", { exact: true });
      const fields = questions.getByTestId("sub-infrastructure-options");
      const techFields = await fields.getByRole("button").evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")));
      await click(multi, "AgriTech");
      await questions.getByRole("button", { name: "Back", exact: true }).click();
      await click(multi, "AI");
      await click(multi, "Travel");
      await click(multi, "Next · Find my sub-infrastructure");
      await questions.getByText("Fields from Tech · AI · Travel", { exact: true }).waitFor();
      const combined = await fields.getByRole("button").evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label").replace(/^✓ /, "")));
      for (const field of [...techFields, "MedTech", "TravelTech", "HospitalityTech"]) assert.ok(combined.includes(field), `${field} is included from the selected areas`);
      assert.equal(new Set(combined).size, combined.length, "Shared fields are offered once");
      await fields.getByRole("button", { name: "EdTech", exact: true }).getByText("In Tech · AI", { exact: true }).waitFor();
      assert.equal(await fields.getByRole("button", { name: "✓ AgriTech", exact: true }).count(), 1, "Adding areas preserves previous choices");
      await click(multi, "MedTech");
      await click(multi, "HospitalityTech");
      await fields.getByRole("button", { name: "✓ HospitalityTech", exact: true }).scrollIntoViewIfNeeded();
      await multi.screenshot({ path: `${output}/${engineName}-${width}-combined-fields.png` });
      await questions.getByRole("button", { name: "Back", exact: true }).click();
      await click(multi, "✓ Travel");
      await click(multi, "Next · Find my sub-infrastructure");
      assert.equal(await fields.getByRole("button", { name: /HospitalityTech|TravelTech/ }).count(), 0, "Removing Travel removes its exclusive fields");
      assert.equal(await fields.getByRole("button", { name: "✓ AgriTech", exact: true }).count(), 1);
      assert.equal(await fields.getByRole("button", { name: "✓ MedTech", exact: true }).count(), 1);
      await questions.getByRole("button", { name: "Back", exact: true }).click();
      await click(multi, "Travel");
      await click(multi, "Next · Find my sub-infrastructure");
      await click(multi, "HospitalityTech");
      await click(multi, "See my plan");
      await click(multi, "Find my accommodation");
      await click(multi, "Enter Accommodations");
      assert.deepEqual(await islandNames(multi), ["Open St. Thomas", "Open St. John", "Open Scrub Island"]);
      assert.deepEqual((await record(multi)).areas, ["tech", "ai", "travel"]);
      assert.deepEqual((await record(multi)).interests, ["AgriTech", "MedTech", "HospitalityTech"]);
      await click(multi, "Sessions");
      await click(multi, "Enter Sessions");
      const multiGuide = multi.getByTestId("session-guide").filter({ visible: true });
      assert.equal(await multiGuide.getByRole("checkbox").count(), 0);
      const more = multiGuide.getByRole("button", { name: "Show more matching sessions", exact: true });
      while (await more.count()) await more.click();
      const cards = multiGuide.getByRole("button", { name: /^Open / });
      for (const area of ["Tech", "AI", "Travel"]) assert.ok(await cards.filter({ has: multi.getByText(area, { exact: true }) }).count() > 0, `Results include ${area}`);
      await multiGuide.getByRole("button", { name: "Change my session choices", exact: true }).click();
      for (const area of ["Tech", "AI", "Travel"]) assert.equal(await multiGuide.getByRole("checkbox", { name: area, exact: true }).getAttribute("aria-checked"), "true");
      await click(multi, "Next · Find my sub-infrastructure");
      await multiGuide.getByText("Fields from Tech · AI · Travel", { exact: true }).waitFor();
      await multiGuide.getByRole("checkbox", { name: "EdTech", exact: true }).getByText("In Tech · AI", { exact: true }).waitFor();
      for (const field of ["AgriTech", "MedTech", "HospitalityTech"]) assert.equal(await multiGuide.getByRole("checkbox", { name: field, exact: true }).getAttribute("aria-checked"), "true");
      await multi.reload();
      await multi.getByTestId("session-guide").getByText("Your sessions", { exact: true }).waitFor();
      assert.deepEqual((await record(multi)).areas, ["tech", "ai", "travel"]);
      assert.deepEqual((await record(multi)).interests, ["AgriTech", "MedTech", "HospitalityTech"]);
      await multiple.close();
      console.log(`${engineName} ${width}: multiple infrastructure fields, shared labels, selection changes, and matching islands/sessions passed`);
    }

    // Older saved answers never completed the second guide. They still go straight to matches.
    const legacy = await setup(browser, 390, { hasPass: "have", needsStay: "yes", areas: ["law"], interests: [], completed: [] });
    const page = await legacy.newPage();
    await page.goto(`${base}/agenda`);
    await matchingCards(page, "Law");
    await page.goto(`${base}/stays`);
    assert.deepEqual(await islandNames(page), ["Open Lovango"]);
    await legacy.close();

    const noMatch = await setup(browser, 390, { hasPass: "have", needsStay: "yes", areas: ["tech"], interests: ["unlisted-field"], completed: [] });
    const empty = await noMatch.newPage();
    await empty.goto(`${base}/agenda`);
    await empty.getByTestId("session-guide").getByText(/No sessions match that combination/).waitFor();
    assert.equal(await empty.getByTestId("session-guide").getByRole("button", { name: /^Open / }).count(), 0);
    await empty.goto(`${base}/stays`);
    await empty.getByText(/No stays are listed near sessions matching/).waitFor();
    assert.deepEqual(await islandNames(empty), []);
    await click(empty, "See all islands");
    assert.equal((await islandNames(empty)).length, 5);
    await noMatch.close();
    console.log(`${engineName}: legacy answers and honest empty results passed`);
  } finally { await browser.close(); }
}
