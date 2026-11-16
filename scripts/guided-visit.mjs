/** Local, isolated journey checks. All API requests are mocked; no bookings or payments are sent. */
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:8081";
const output = process.env.ARTIFACT_DIR ?? ".vitest/guided-visit";
const program = { ...JSON.parse(await readFile("src/content/tatel.json", "utf8")), places: JSON.parse(await readFile("src/content/places.json", "utf8")) };
await mkdir(output, { recursive: true });
const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const day = new Date();
const today = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;

async function contextFor(browser, viewport, intake) {
  // A service worker can bypass Playwright's request interception, particularly in WebKit.
  // Keep these booking scenarios isolated from real APIs; PWA caching has separate tests.
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, userAgent: iphone, reducedMotion: "reduce", serviceWorkers: "block" });
  await context.route("**/api/**", (route) => route.fulfill({ status: route.request().url().endsWith("/api/program") ? 200 : 503, contentType: "application/json", body: JSON.stringify(route.request().url().endsWith("/api/program") ? program : { error: "offline-test" }) }));
  await context.addInitScript(({ today, intake }) => {
    if (sessionStorage.getItem("journey-test-seeded")) return;
    localStorage.setItem("tatel.introDay", today);
    localStorage.setItem("tatel.welcomeSeen", "1");
    localStorage.setItem("tatel.install.dismissedUntil", String(Date.now() + 86400000));
    sessionStorage.setItem("tatel.reelsSeen", "pass,stays,sessions,venues,guide,community");
    if (intake) localStorage.setItem("tatel.intake.v1", JSON.stringify(intake));
    sessionStorage.setItem("journey-test-seeded", "1");
  }, { today, intake });
  return context;
}

async function visible(page, text) { await page.getByText(text, { exact: true }).filter({ visible: true }).first().waitFor(); }
async function click(page, name, role = "button") { await page.getByRole(role, { name, exact: typeof name === "string" }).filter({ visible: true }).first().click(); }
async function intakeOf(page) { return page.evaluate(() => JSON.parse(localStorage.getItem("tatel.intake.v1"))); }
async function reached(page, text) {
  const target = await page.getByText(text, { exact: true }).filter({ visible: true }).first().elementHandle();
  await page.waitForFunction((element) => { const box = element.getBoundingClientRect(); return box.top >= 0 && box.bottom < innerHeight - 140; }, target);
}
async function screenshot(page, name) {
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Horizontal overflow: ${name}`);
  await page.screenshot({ path: `${output}/${name}.png` });
}

for (const [engineName, engine] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await engine.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
      const context = await contextFor(browser, viewport);
      // Exercise an interrupted optional sign-in preload while visiting Community.
      await context.route(/\/_expo\/static\/js\/web\/community-sign-in-[^/]+\.js$/, (route) => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.setDefaultTimeout(30000);
      const label = `${engineName}-${viewport.width}`;
      console.log(`${label}: starting ticket → accommodation → sessions → explore`);
      await page.goto(base);
      await click(page, "I need a ticket");
      await click(page, "Sail by day, stay on land");
      await click(page, "Help me find a place");
      await click(page, "Tech");
      await click(page, "See my plan");
      await click(page, "Find my ticket");
      await page.waitForURL(/\/tickets\?tier=boat/);
      await click(page, "Enter Tickets");
      await page.getByTestId("ticket-boat").waitFor();
      assert.deepEqual(await page.locator('[data-testid^="ticket-"]').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid)), ["ticket-boat", "ticket-beach", "ticket-vip"]);
      assert.equal(await page.getByTestId("pass-next-step").evaluate((footer) => Boolean(document.querySelector('[data-testid="ticket-vip"]').compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
      assert.equal((await intakeOf(page)).completed.includes("pass"), false);
      await screenshot(page, `${label}-tickets`);
      await click(page, "I'll book my ticket later");
      await page.waitForURL(/\/stays/);
      await click(page, "Enter Accommodations");
      await click(page, "See all islands");
      await click(page, "Open St. Thomas");
      await page.waitForURL(/\/stays\/st-thomas/);
      assert.equal((await intakeOf(page)).completed.includes("stay"), false);
      await click(page, /^I have booked /);
      assert.equal((await intakeOf(page)).completed.includes("stay"), true);
      assert.ok((await intakeOf(page)).accommodation.name);
      await click(page, "Continue · Select your sessions");
      await page.waitForURL(/\/agenda/);
      await click(page, "Enter Sessions");
      await click(page, "Next · Find my sub-infrastructure");
      await click(page, "AgriTech", "checkbox");
      await click(page, "Next · Choose my session goals");
      await click(page, "Build something useful", "checkbox");
      await click(page, "Show my session matches");
      const guide = page.getByTestId("session-guide").filter({ visible: true });
      await guide.getByRole("button", { name: /^Save / }).first().click();
      assert.deepEqual((await intakeOf(page)).sessionGoals, ["build"]);
      await screenshot(page, `${label}-session-matches`);
      await click(page, "Review My schedule · 1 saved");
      await page.waitForURL(/\/schedule/);
      await visible(page, "1 session saved");
      await page.reload();
      await visible(page, "1 session saved");
      await screenshot(page, `${label}-schedule`);
      await click(page, "Continue · Explore TATEL");
      await page.waitForURL(/\/explore/);
      await click(page, "Enter Venues");
      await click(page, "Meet the panelists");
      await page.waitForURL(/\/speakers/);
      await click(page, "Enter Panelists");
      await page.goto(`${base}/explore`);
      await click(page, "Next · Chat");
      await click(page, "Open the community and chat");
      await page.waitForURL(/\/community/);
      await click(page, "Enter Community");
      await page.goto(`${base}/explore`);
      await click(page, "Next · Island time");
      await click(page, "Find island experiences");
      await reached(page, "Make room for island time");
      await screenshot(page, `${label}-island-ideas`);
      await click(page, "Next · Stamp card");
      await click(page, "Show my stamp card");
      await reached(page, "Island passport");
      assert.equal(await page.evaluate(() => localStorage.getItem("tatel.stamps")), null, "Opening the card must not award stamps");
      await page.reload();
      await click(page, "Let's explore");
      await visible(page, "You're ready to explore.");
      await page.goto(`${base}/agenda`);
      await visible(page, "Sessions for your kind of TATEL");
      assert.deepEqual((await intakeOf(page)).interests, ["AgriTech"]);
      await page.goto(base);
      const invitation = page.getByTestId("experience-invitation").filter({ visible: true });
      await invitation.getByText("Make waves.", { exact: true }).waitFor();
      await screenshot(page, `${label}-invitation`);
      const experience = page.getByTestId("experience-preview").filter({ visible: true });
      await experience.getByRole("tab", { name: "The escape", exact: true }).click();
      await experience.getByText("Take the scenic route.", { exact: true }).waitFor();
      await experience.getByRole("button", { name: /Discover the island life/ }).click();
      await page.waitForURL(/\/explore/);
      await click(page, /Meet the five islands/);
      await visible(page, "The U.S. Virgin Islands and the British Virgin Islands, in the Caribbean just east of Puerto Rico.");
      await page.goto(base);
      await experience.getByRole("tab", { name: "The people", exact: true }).click();
      await experience.getByText("Dress up. Open up. Connect.", { exact: true }).waitFor();
      await screenshot(page, `${label}-experience-people`);
      await experience.getByRole("button", { name: /Meet your fellow guests/ }).click();
      await page.waitForURL(/\/community/);
      await click(page, "Enter Community");
      await visible(page, "Community");
      await page.goto(base);
      await experience.getByRole("tab", { name: "The work", exact: true }).click();
      await experience.getByRole("button", { name: /Find sessions with a purpose/ }).click();
      await page.waitForURL(/\/agenda/);
      await click(page, "Enter Sessions");
      await visible(page, "Sessions for your kind of TATEL");
      await page.goto(base);
      await click(page, "What is TATEL");
      await click(page, "Pause story");
      await page.evaluate(() => {
        for (const el of document.querySelectorAll("body *")) {
          if (![...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) continue;
          const computed = getComputedStyle(el);
          const size = parseFloat(computed.fontSize);
          const line = parseFloat(computed.lineHeight);
          if (size) el.style.fontSize = `${size * 1.3}px`;
          if (line) el.style.lineHeight = `${line * 1.3}px`;
        }
      });
      const next = await page.getByRole("button", { name: "Next", exact: true }).boundingBox();
      assert.ok(next && next.y >= 0 && next.y + next.height <= viewport.height + 1, "Story navigation must stay reachable with larger text");
      await screenshot(page, `${label}-story`);
      await click(page, "Skip");
      await page.goto(`${base}/more`);
      await click(page, "Add to Home Screen");
      await visible(page, "Open as a web app");
      await screenshot(page, `${label}-install`);
      await click(page, "Close");
      assert.deepEqual(errors, [], "Uncaught browser errors");
      await context.close();
      console.log(`${label}: journey, persistence, large text, and installation guidance passed`);
    }

    const context = await contextFor(browser, { width: 390, height: 844 }, { hasPass: "not-yet", ticketPreference: "vip", needsStay: "browsing", areas: [], interests: [], completed: [], progressVersion: 2 });
    let bookings = 0;
    await context.route("**/api/vip-booking", async (route) => {
      assert.equal(route.request().method(), "POST");
      assert.deepEqual(route.request().postDataJSON(), { boatPreference: "shared", hostName: "Test Guest", hostEmail: "guest@example.com", hostPhone: "+13405550100", hostUserId: null });
      bookings++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: "testgroup", url: "https://tatel.app/pass/vip/testgroup" }) });
    });
    const page = await context.newPage();
    await page.goto(`${base}/tickets?checkout=preview&tier=vip`);
    await click(page, "I'm open to sharing a boat with other guests", "checkbox");
    const start = page.getByRole("button", { name: "Start the booking", exact: true });
    assert.equal(await start.isDisabled(), true);
    await page.getByRole("textbox", { name: "Your name, required", exact: true }).fill("Test Guest");
    await page.getByRole("textbox", { name: "Email, required", exact: true }).fill("bad-email");
    await page.getByRole("textbox", { name: "Phone, required", exact: true }).fill("123");
    assert.equal(await start.isDisabled(), true);
    assert.equal(bookings, 0);
    await page.getByRole("textbox", { name: "Email, required", exact: true }).fill("guest@example.com");
    await page.getByRole("textbox", { name: "Phone, required", exact: true }).fill("+13405550100");
    assert.equal(await start.isEnabled(), true);
    await start.click();
    await page.getByRole("button", { name: "Open booking & pay", exact: true }).waitFor();
    assert.equal(bookings, 1);
    assert.equal((await intakeOf(page)).completed.includes("pass"), false, "Creating a link is not a ticket purchase");
    await screenshot(page, `${engineName}-vip-validation`);
    await context.close();
    console.log(`${engineName}: required contact fields and mocked booking passed`);

    const existing = await contextFor(browser, { width: 390, height: 844 });
    const guest = await existing.newPage();
    await guest.goto(base);
    await click(guest, "Yes, I have a ticket");
    await click(guest, "Be on the Beach");
    await click(guest, "My stay is already arranged");
    await click(guest, "See my plan");
    await click(guest, "Choose my sessions");
    await guest.waitForURL(/\/agenda/);
    await click(guest, "Enter Sessions");
    await guest.goto(`${base}/tickets`);
    await visible(guest, "Be on the Beach");
    assert.equal((await intakeOf(guest)).ticketPreference, "beach");
    await existing.close();
    console.log(`${engineName}: existing ticket and accommodation skip straight to sessions`);

    const payment = await contextFor(browser, { width: 320, height: 568 }, { hasPass: "not-yet", ticketPreference: "beach", needsStay: "booked", areas: [], interests: [], completed: [], progressVersion: 2 });
    let paid = false;
    await payment.route("**/api/checkout/status?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "complete", paymentStatus: paid ? "paid" : "unpaid", tier: "beach" }) }));
    const checkout = await payment.newPage();
    await checkout.goto(`${base}/tickets?checkout=return&session_id=local-test-unpaid`);
    await visible(checkout, "Check your payment");
    assert.equal(await checkout.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), null);
    await click(checkout, "Close payment message");
    await click(checkout, "I'll book my ticket later");
    await checkout.waitForURL(/\/agenda/);
    await click(checkout, "Enter Sessions");
    paid = true;
    await checkout.goto(`${base}/tickets?checkout=return&session_id=local-test-paid`);
    await visible(checkout, "You're booked");
    assert.equal(await checkout.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), "beach");
    const closeNotice = checkout.getByRole("button", { name: "Close booking", exact: true });
    await closeNotice.scrollIntoViewIfNeeded();
    assert.equal(await closeNotice.evaluate((button) => { const box = button.getBoundingClientRect(); return button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)); }), true, "Navigation must not cover the payment confirmation");
    await screenshot(checkout, `${engineName}-payment-confirmation`);
    await checkout.getByLabel("You're booked", { exact: true }).getByRole("button", { name: "Continue · Select your sessions", exact: true }).click();
    await checkout.waitForURL(/\/agenda/);
    await click(checkout, "Enter Sessions");
    await payment.close();
    console.log(`${engineName}: mocked payment verification and already-arranged stay passed`);
  } finally {
    await browser.close();
  }
}
console.log(`Guided visit checks passed. Screenshots: ${output}`);
