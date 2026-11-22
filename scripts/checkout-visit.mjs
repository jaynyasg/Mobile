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
          if (!options.clientSecret) throw new Error("Checkout session is required before opening Stripe");
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
const names = { beach: "Be on the Beach", boat: "Be on the Boat", vip: "Be on Board" };

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
      await context.route("**/api/vip-booking", async route => {
        assert.equal(route.request().method(), "POST");
        assert.equal(route.request().postDataJSON().hostName, "Test Guest");
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ code: "local-vip", url: `${base}/pass/vip/local-vip` }) });
      });
      await context.route("**/api/vip-booking/local-vip", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ code: "local-vip", boatPreference: "shared", status: "open", paidShares: 0, reservedShares: 0, remaining: 8, deadline: new Date(Date.now() + 86400000).toISOString(), progress: "0 of 8 shares paid" }) }));
      await context.route("**/api/vip-booking/local-vip/checkout", async route => {
        requests.push({ tier: "vip", ...route.request().postDataJSON() });
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ clientSecret: "isolated-vip", sessionId: "cs_test_isolated" }) });
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.setDefaultTimeout(30000);
      await page.goto(base);
      await click(page, "I need a ticket");
      await click(page, experiences[tier]);
      await click(page, tier === "beach" ? "Help me find a place" : "My stay is already arranged");
      await click(page, "Next · Find my sub-infrastructure");
      await click(page, "See my plan");
      await page.getByText("Your plan for TATEL.", { exact: true }).waitFor();
      await page.getByText(/Your plan, based on your choices/).waitFor();
      const plan = page.getByTestId("opening-step-plan");
      assert.equal(await plan.getByText(names[tier], { exact: true }).count(), 1);
      assert.equal(await plan.getByText(/Choose your ticket/).count(), 0);
      if (width === 320) await page.getByLabel("Plan your TATEL visit", { exact: true }).evaluate(root => {
        for (const element of root.querySelectorAll("*")) {
          if (![...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) continue;
          const style = getComputedStyle(element);
          element.style.fontSize = `${parseFloat(style.fontSize) * 1.3}px`;
          if (parseFloat(style.lineHeight)) element.style.lineHeight = `${parseFloat(style.lineHeight) * 1.3}px`;
        }
      });
      await plan.scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      await page.screenshot({ path: `${output}/${engineName}-${width}-${tier}-plan.png` });
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
      await click(page, names[tier]);
      const modal = page.getByLabel(tier === "vip" ? "Start a VIP booking" : "Checkout", { exact: true });
      if (tier !== "vip") await page.getByTestId("stripe-test-form").waitFor();
      await modal.getByRole("button", { name: "I'll book my ticket later", exact: true }).click();
      await page.waitForURL(url => url.pathname === (tier === "beach" ? "/stays" : "/agenda"));
      assert.equal(await page.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), null, "Booking later does not record a purchase");
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("tatel.intake.v1")).completed.includes("pass")), false);
      assert.equal(await page.evaluate(() => Boolean(history.state?.tatelCheckout)), false, "The checkout history entry is removed before continuing");
      await click(page, tier === "beach" ? "Enter Accommodations" : "Enter Sessions");
      await click(page, "Home");
      await click(page, names[tier]);
      if (tier === "vip") {
        await page.getByLabel("Start a VIP booking", { exact: true }).waitFor();
        await page.getByRole("checkbox", { name: "I'm open to sharing a boat with other guests", exact: true }).click();
        for (const [label, value] of [["Your name, required", "Test Guest"], ["Email, required", "guest@example.com"], ["Phone, required", "+1 340 555 0100"]]) {
          await page.getByRole("textbox", { name: label, exact: true }).fill(value);
        }
        await click(page, "Start the booking");
        await page.getByRole("button", { name: "Open booking & pay", exact: true }).waitFor();
        assert.equal(await page.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), null, "A group link is not a paid ticket");
        await click(page, "Open booking & pay");
        await page.waitForURL(url => url.pathname === "/pass/vip/local-vip");
        await click(page, "Pay for 1 shares");
      } else {
        await page.getByTestId("stripe-test-form").waitFor();
        assert.deepEqual(requests, [{ tier }, { tier }, { tier }], "Returning to the mounted tab reopens the selected checkout once");
      }
      await page.getByTestId("stripe-test-form").scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/${engineName}-${width}-${tier}.png` });
      await click(page, "Confirm test payment");
      // No extra Continue tap after the verified success message.
      await page.waitForURL(url => url.pathname === (tier === "beach" ? "/stays" : "/agenda"));
      assert.equal(await page.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), tier);
      assert.equal(await page.evaluate(() => Boolean(history.state?.tatelCheckout)), false);
      await click(page, tier === "beach" ? "Enter Accommodations" : "Enter Sessions");
      await click(page, "Home");
      await click(page, `${names[tier]}, completed`);
      await page.waitForURL(url => url.pathname === "/tickets");
      assert.equal(new URL(page.url()).searchParams.has("checkout"), false, "A completed ticket step shows the existing ticket");
      assert.equal(await page.getByTestId("stripe-test-form").count(), 0);
      assert.equal(requests.length, tier === "vip" ? 1 : 3, "Viewing a purchased ticket must not start another checkout");
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${engineName}-${width}-${tier}: personal plan, close/reopen, book later, and automatic paid continuation passed`);
    }
    const context = await setup(browser, 390);
    const page = await context.newPage();
    await page.goto(base);
    await click(page, "I need a ticket");
    await click(page, "I'm not sure yet");
    await click(page, "My stay is already arranged");
    await click(page, "Next · Find my sub-infrastructure");
    await click(page, "See my plan");
    await click(page, "Compare tickets");
    await click(page, "Enter Tickets");
    assert.equal(new URL(page.url()).searchParams.has("checkout"), false);
    assert.equal(await page.getByTestId("stripe-test-form").count(), 0);
    const failures = [];
    page.on("pageerror", error => failures.push(error.message));
    await click(page, "Book Be on the Beach");
    await page.getByText("Checkout could not load.", { exact: false }).waitFor();
    assert.ok(await page.getByText("Checkout could not load.", { exact: false }).evaluate(node => node.getBoundingClientRect().bottom <= innerHeight), "Checkout errors must be visible without scrolling past an empty form");
    assert.equal(await page.evaluate(() => window.__checkoutKeys.length), 0, "A failed session must not initialize Stripe");
    assert.equal(await page.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), null);
    await click(page, "Close checkout");
    await context.route("**/api/checkout", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ clientSecret: "isolated-retry", sessionId: "cs_test_retry" }) }));
    await click(page, "Book Be on the Beach");
    await page.getByTestId("stripe-test-form").waitFor();
    await click(page, "Close checkout");
    assert.deepEqual(failures, []);
    let returnedPaid = false;
    await context.route("**/api/checkout/status?*", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "complete", paymentStatus: returnedPaid ? "paid" : "unpaid", tier: "beach" }) }));
    await page.goto(`${base}/tickets?checkout=return&session_id=isolated-return`);
    await page.getByLabel("Check your payment", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), null);
    await page.getByLabel("Check your payment", { exact: true }).getByRole("button", { name: "I'll book my ticket later", exact: true }).click();
    await page.waitForURL(url => url.pathname === "/agenda");
    await click(page, "Enter Sessions");
    returnedPaid = true;
    await page.goto(`${base}/tickets?checkout=return&session_id=isolated-paid-return`);
    await page.waitForURL(url => url.pathname === "/agenda");
    assert.equal(await page.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), "beach");
    await click(page, "Enter Sessions");
    await context.close();
    console.log(`${engineName}: comparison, unavailable checkout, retry, and unpaid/paid returns passed`);

    const board = await setup(browser, 390);
    await board.addInitScript(() => localStorage.setItem("tatel.intake.v1", JSON.stringify({ hasPass: "not-yet", ticketPreference: "vip", needsStay: "yes", areas: ["tech"], interests: [], completed: [], progressVersion: 2 })));
    await board.route("**/api/checkout/status?*", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "complete", paymentStatus: "paid", tier: "vip" }) }));
    const boardPage = await board.newPage();
    await boardPage.goto(`${base}/pass/vip/isolated-return?checkout=return&session_id=isolated-vip-paid`);
    await boardPage.waitForURL(url => url.pathname === "/stays");
    assert.equal(await boardPage.evaluate(() => localStorage.getItem("tatel.ownedPass.v1")), "vip");
    await click(boardPage, "Enter Accommodations");
    await boardPage.getByText("Board includes a stay aboard the charter. These options are for extra nights ashore.", { exact: true }).waitFor();
    await board.close();
    console.log(`${engineName}: paid Board return continues to requested extra nights`);
  } finally { await browser.close(); }
}
console.log("Selected-ticket checkout checks passed. Payment requests and Stripe UI were isolated test doubles.");
