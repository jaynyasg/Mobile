/** Exercise real checkout routing and SDK initialization with isolated payment/network doubles. */
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:8082";
const output = process.env.ARTIFACT_DIR ?? ".vitest/direct-checkout";
const program = { ...JSON.parse(await readFile("src/content/tatel.json", "utf8")), places: JSON.parse(await readFile("src/content/places.json", "utf8")) };
await mkdir(output, { recursive: true });

async function setup(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce", serviceWorkers: "block" });
  await context.route("**/api/**", route => route.fulfill({ status: route.request().url().endsWith("/api/program") ? 200 : 503, contentType: "application/json", body: JSON.stringify(route.request().url().endsWith("/api/program") ? program : { error: "isolated-test" }) }));
  await context.addInitScript(() => {
    if (!sessionStorage.getItem("checkout-test-seeded")) {
      const day = new Date();
      localStorage.setItem("tatel.introDay", `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`);
      localStorage.setItem("tatel.welcomeSeen", "1");
      localStorage.setItem("tatel.install.dismissedUntil", String(Date.now() + 86400000));
      sessionStorage.setItem("checkout-test-seeded", "1");
    }
    window.__checkoutKeys = [];
    window.Stripe = key => {
      if (!/^pk_(live|test)_[A-Za-z0-9]+$/.test(key)) throw new Error("Missing public Stripe configuration");
      window.__checkoutKeys.push(key);
      return {
        async createEmbeddedCheckoutPage(options) {
          await options.fetchClientSecret();
          let mounted;
          return {
            mount(node) {
              mounted = node;
              const button = document.createElement("button");
              button.textContent = "Confirm test payment";
              button.dataset.testid = "stripe-test-form";
              button.style.cssText = "padding:24px;max-width:100%;background:#FFE08A;color:#071421";
              button.onclick = options.onComplete;
              node.append(button);
            },
            destroy() { mounted?.replaceChildren(); },
          };
        },
      };
    };
  });
  return context;
}
async function click(page, name) { await page.getByRole("button", { name, exact: true }).filter({ visible: true }).first().click(); }
const experiences = { beach: "Stay on land", boat: "Sail by day, stay on land", vip: "Live aboard for five days" };

for (const [engineName, engine] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await engine.launch();
  try {
    for (const width of [390, 320]) for (const tier of ["beach", "boat", "vip"]) {
      const context = await setup(browser, width);
      const requests = [];
      await context.route("**/api/checkout", async route => {
        assert.equal(route.request().method(), "POST");
        requests.push(route.request().postDataJSON());
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ clientSecret: "isolated-secret", sessionId: "cs_test_isolated" }) });
      });
      await context.route("**/api/checkout/status?*", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "complete", paymentStatus: "paid", tier }) }));
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.setDefaultTimeout(30000);
      await page.goto(base);
      await click(page, "I need a ticket");
      await click(page, experiences[tier]);
      await click(page, tier === "beach" ? "Help me find a place" : "My stay is already arranged");
      await click(page, "See my plan");
      await click(page, tier === "vip" ? "Start my Board booking" : "Continue to checkout");
      await page.waitForURL(url => url.pathname === "/tickets" && url.searchParams.get("tier") === tier && url.searchParams.get("checkout") === "start");
      assert.equal(await page.getByRole("button", { name: "Enter Tickets", exact: true }).count(), 0, "No chapter gate before selected checkout");
      if (tier === "vip") {
        await page.getByLabel("Start a VIP booking", { exact: true }).waitFor();
        await page.getByRole("checkbox", { name: "I'm open to sharing a boat with other guests", exact: true }).click();
        assert.ok(await page.getByRole("button", { name: "Start the booking", exact: true }).isDisabled());
        for (const label of ["Your name, required", "Email, required", "Phone, required"]) assert.ok(await page.getByRole("textbox", { name: label, exact: true }).isVisible());
        assert.equal(requests.length, 0);
        await page.screenshot({ path: `${output}/${engineName}-${width}-vip.png` });
        await click(page, "Close booking");
      } else {
        await page.getByTestId("stripe-test-form").waitFor();
        assert.deepEqual(requests, [{ tier }], "Exactly one checkout session for the selected ticket");
        assert.equal(await page.evaluate(() => window.__checkoutKeys.length), 1);
        await click(page, "Close checkout");
      }
      await page.waitForURL(url => !url.searchParams.has("checkout"));
      for (const name of ["Book Be on the Beach", "Book Be on the Boat", "Start a Be on Board booking"]) assert.ok(await page.getByRole("button", { name, exact: true }).isEnabled(), name);
      await click(page, "Home");
      await click(page, "Choose your ticket");
      if (tier === "vip") {
        await page.getByLabel("Start a VIP booking", { exact: true }).waitFor();
        await click(page, "Close booking");
      } else {
        await page.getByTestId("stripe-test-form").waitFor();
        assert.deepEqual(requests, [{ tier }, { tier }], "Returning to the mounted tab reopens the selected checkout once");
        await page.getByTestId("stripe-test-form").scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/${engineName}-${width}-${tier}.png` });
        await click(page, "Confirm test payment");
        await page.getByLabel("You're booked", { exact: true }).waitFor();
        assert.equal(await page.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), tier);
        await page.getByLabel("You're booked", { exact: true }).getByRole("button", { name: tier === "beach" ? "Continue · Find your accommodation" : "Continue · Select your sessions", exact: true }).click();
        await page.waitForURL(url => url.pathname === (tier === "beach" ? "/stays" : "/agenda"));
        await click(page, tier === "beach" ? "Enter Accommodations" : "Enter Sessions");
        await click(page, "Home");
        await click(page, "Choose your ticket, completed");
        await page.waitForURL(url => url.pathname === "/tickets");
        assert.equal(new URL(page.url()).searchParams.has("checkout"), false, "A completed ticket step shows the existing ticket");
        assert.equal(await page.getByTestId("stripe-test-form").count(), 0);
        assert.equal(requests.length, 2, "Viewing a purchased ticket must not start another checkout");
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${engineName}-${width}-${tier}: direct checkout, configuration, close/reopen, and next step passed`);
    }
    const context = await setup(browser, 390);
    const page = await context.newPage();
    await page.goto(base);
    await click(page, "I need a ticket");
    await click(page, "I'm not sure yet");
    await click(page, "My stay is already arranged");
    await click(page, "See my plan");
    await click(page, "Compare tickets");
    await click(page, "Enter Tickets");
    assert.equal(new URL(page.url()).searchParams.has("checkout"), false);
    assert.equal(await page.getByTestId("stripe-test-form").count(), 0);
    await context.close();
    console.log(`${engineName}: undecided guests can compare before checkout`);
  } finally { await browser.close(); }
}
console.log("Selected-ticket checkout checks passed. Payment requests and Stripe UI were isolated test doubles.");
