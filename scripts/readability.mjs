/**
 * Fails when visible copy is cut off by an overflow-hidden ancestor,
 * ellipsized, or sitting under the tab bar.
 *
 * BASE_URL defaults to the Expo web server. Optional ROUTE filter is a comma list.
 */
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:8081";
const only = process.env.ROUTES?.split(",").map((item) => item.trim()).filter(Boolean);
const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
];
const scales = [1, 1.3];
const modes = ["browser", "standalone"];

const routes = only ?? [
  "/",
  "/agenda",
  "/explore",
  "/tickets",
  "/more",
  "/community",
  "/community-room",
  "/community-sign-in",
  "/speakers",
  "/places",
  "/network",
  "/know",
  "/routes",
  "/routes?build=1",
  "/stays",
  "/stays/st-thomas",
  "/settings",
  "/notifications",
  "/assistant",
  "/schedule",
  "/session/AI-KEYNOTE-D1",
  "/pillar/tech",
  "/speaker/sansara-cannon",
  "/venue/st-thomas",
  "/pass/vip/preview",
  "/deck",
  "/program-overview",
  "/updates",
  "/work?session=T2-D1",
  "/stays/near-tortola",
];

function dayKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

async function seed(context) {
  const today = dayKey();
  await context.addInitScript((introDay) => {
    localStorage.setItem("tatel.introDay", introDay);
    localStorage.setItem("tatel.intake.v1", JSON.stringify({
      hasPass: "not-yet",
      areas: ["tech"],
      needsStay: "browsing",
      completed: [],
      interests: ["EdTech"],
    }));
    localStorage.setItem("tatel.welcomeSeen", "1");
  }, today);
}

async function dismissChrome(page) {
  for (const name of ["Dismiss install hint", "Skip intro", "Skip"]) {
    const button = page.getByRole("button", { name, exact: true });
    if (await button.count()) {
      await button.first().click({ timeout: 1000 }).catch(() => undefined);
    }
  }
}

async function scaleText(page, factor) {
  if (factor === 1) return;
  await page.evaluate((multiplier) => {
    for (const el of document.querySelectorAll("body *")) {
      const text = [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      if (!text) continue;
      const computed = getComputedStyle(el);
      const size = Number.parseFloat(computed.fontSize);
      const line = Number.parseFloat(computed.lineHeight);
      if (size) el.style.fontSize = `${size * multiplier}px`;
      if (line) el.style.lineHeight = `${line * multiplier}px`;
    }
  }, factor);
}

async function readProblems(page) {
  return page.evaluate(() => {
    const problems = [];
    const dock = document.querySelector("[data-testid='app-dock']");
    const dockBox = dock?.getBoundingClientRect();
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;

    function visibleBox(rect) {
      return rect.width > 1 && rect.height > 1 && rect.bottom > 2 && rect.top < viewH - 2 && rect.right > 2 && rect.left < viewW - 2;
    }

    for (const el of document.querySelectorAll("body *")) {
      const textNode = [...el.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      if (!textNode) continue;
      const text = textNode.textContent.trim().replace(/\s+/g, " ");
      if (!text) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      const rect = el.getBoundingClientRect();
      if (!visibleBox(rect)) continue;

      const clamp = style.webkitLineClamp;
      if ((style.textOverflow === "ellipsis" || (clamp && clamp !== "none")) && (el.scrollHeight > el.clientHeight + 3 || el.scrollWidth > el.clientWidth + 3)) {
        problems.push({ kind: "ellipsis", text: text.slice(0, 90) });
      }

      let visibleTop = Math.max(rect.top, 0);
      let visibleBottom = Math.min(rect.bottom, viewH);
      let visibleLeft = Math.max(rect.left, 0);
      let visibleRight = Math.min(rect.right, viewW);
      const fixedClips = [];
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const parentStyle = getComputedStyle(parent);
        const oy = parentStyle.overflowY;
        const ox = parentStyle.overflowX;
        const box = parent.getBoundingClientRect();
        const scrollable = parent.scrollHeight > parent.clientHeight + 4 || parent.scrollWidth > parent.clientWidth + 4;
        const clipsY = oy === "hidden" || oy === "clip" || oy === "auto" || oy === "scroll";
        const clipsX = ox === "hidden" || ox === "clip" || ox === "auto" || ox === "scroll";
        if (scrollable && (clipsY || clipsX)) {
          if (clipsY) {
            visibleTop = Math.max(visibleTop, box.top);
            visibleBottom = Math.min(visibleBottom, box.bottom);
          }
          if (clipsX) {
            visibleLeft = Math.max(visibleLeft, box.left);
            visibleRight = Math.min(visibleRight, box.right);
          }
        } else if ((oy === "hidden" || oy === "clip") && !scrollable) {
          fixedClips.push(box);
        }
        parent = parent.parentElement;
      }

      const onScreen = visibleBottom - visibleTop > 4 && visibleRight - visibleLeft > 4;
      if (onScreen) {
        for (const box of fixedClips) {
          const seen = Math.min(visibleBottom, box.bottom) - Math.max(visibleTop, box.top);
          const available = visibleBottom - visibleTop;
          if (seen > 4 && seen < available - 4) {
            problems.push({ kind: "clipped", text: text.slice(0, 90) });
            break;
          }
        }
      }

      if (dockBox && dock && !dock.contains(el) && onScreen) {
        const overlapTop = Math.max(visibleTop, dockBox.top);
        const overlapBottom = Math.min(visibleBottom, dockBox.bottom);
        const overlapLeft = Math.max(visibleLeft, dockBox.left);
        const overlapRight = Math.min(visibleRight, dockBox.right);
        if (overlapBottom - overlapTop > 4 && overlapRight - overlapLeft > 4) {
          const x = (overlapLeft + overlapRight) / 2;
          const y = (overlapTop + overlapBottom) / 2;
          const top = document.elementsFromPoint(x, y)[0];
          if (top && (top === dock || dock.contains(top))) problems.push({ kind: "dock", text: text.slice(0, 90) });
        }
      }
    }
    return problems;
  });
}

/** Text cut by a box that does not scroll, or parked outside the main scroller. */
async function clippedOrUnreachable(page) {
  return page.evaluate(() => {
    const problems = [];
    const scrollers = [...document.querySelectorAll("*")].filter((el) => {
      const style = getComputedStyle(el);
      const oy = style.overflowY;
      return (oy === "auto" || oy === "scroll" || oy === "hidden") && el.scrollHeight > el.clientHeight + 8;
    });
    const main = scrollers.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))[0] ?? null;

    for (const el of document.querySelectorAll("body *")) {
      const textNode = [...el.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      if (!textNode) continue;
      const text = textNode.textContent.trim().replace(/\s+/g, " ");
      if (!text) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      const rect = el.getBoundingClientRect();
      if (rect.height < 2 || rect.width < 2) continue;

      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const parentStyle = getComputedStyle(parent);
        const oy = parentStyle.overflowY;
        const clips = oy === "hidden" || oy === "clip" || oy === "auto" || oy === "scroll";
        const scrolls = parent.scrollHeight > parent.clientHeight + 4 && (oy === "auto" || oy === "scroll" || oy === "hidden");
        if (scrolls) break;
        if (clips) {
          const box = parent.getBoundingClientRect();
          const seen = Math.min(rect.bottom, box.bottom) - Math.max(rect.top, box.top);
          if (seen < rect.height - 4) problems.push({ kind: "clipped", text: text.slice(0, 90) });
          break;
        }
        parent = parent.parentElement;
      }

      if (!main || !main.contains(el)) continue;
      const host = main.getBoundingClientRect();
      const top = rect.top - host.top + main.scrollTop;
      const height = rect.height;
      const view = main.clientHeight;
      const maxScroll = Math.max(0, main.scrollHeight - view);
      const unreachable = height <= view + 1
        ? Math.max(0, top + height - view) > Math.min(maxScroll, top) + 2
        : top < -2 || top > maxScroll + 2 || top + height - view < -2 || top + height - view > maxScroll + 2;
      if (unreachable) problems.push({ kind: "unreachable", text: text.slice(0, 90) });
    }
    return problems;
  });
}

async function sweep(page) {
  const found = [];
  for (let step = 0; step < 14; step += 1) {
    found.push(...await readProblems(page));
    const moved = await page.evaluate(() => {
      const scrollers = [...document.querySelectorAll("*")].filter((el) => {
        const style = getComputedStyle(el);
        return (style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 8;
      });
      const main = scrollers.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))[0];
      if (!main) return false;
      const next = Math.min(main.scrollTop + main.clientHeight * 0.8, main.scrollHeight);
      if (next <= main.scrollTop + 2) return false;
      main.scrollTop = next;
      return true;
    });
    if (!moved) break;
    await page.waitForTimeout(40);
  }
  const seen = new Set();
  return found.filter((item) => {
    const key = `${item.kind}|${item.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function clickIf(page, name) {
  const button = page.getByRole("button", { name, exact: true });
  if (!(await button.count())) return false;
  await button.first().click({ timeout: 2000 }).catch(() => undefined);
  await page.waitForTimeout(250);
  return true;
}

const failures = [];

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    for (const scale of scales) {
      for (const mode of modes) {
        const context = await browser.newContext({ viewport });
        await seed(context);
        const page = await context.newPage();
        await page.emulateMedia({ reducedMotion: "reduce" });
        if (mode === "standalone") {
          const client = await context.newCDPSession(page);
          await client.send("Emulation.setEmulatedMedia", {
            features: [{ name: "display-mode", value: "standalone" }],
          }).catch(() => undefined);
          await client.send("Emulation.setSafeAreaInsetsOverride", {
            insets: { top: 32, left: 0, bottom: 24, right: 0 },
          }).catch(() => undefined);
        }
        const label = `${viewport.width}x${viewport.height} ${mode} ${scale}x`;
        for (const route of routes) {
          await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 45000 });
          await page.waitForTimeout(350);
          await dismissChrome(page);
          await scaleText(page, scale);
          await page.waitForTimeout(80);
          const issues = [...await clippedOrUnreachable(page), ...await sweep(page)];
          for (const issue of issues) failures.push({ ...issue, where: `${label} ${route}` });
          if (issues.length) console.error(`FAIL ${label} ${route}: ${issues.map((item) => `${item.kind}: ${item.text}`).join(" | ")}`);
          else console.log(`ok ${label} ${route}`);
        }

        if (!only) {
          await page.goto(base + "/", { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(300);
          await dismissChrome(page);
          await scaleText(page, scale);
          if (await clickIf(page, "What is TATEL")) {
            const issues = [...await clippedOrUnreachable(page), ...await sweep(page)];
            for (const issue of issues) failures.push({ ...issue, where: `${label} / story` });
            await clickIf(page, "Skip");
            await clickIf(page, "Close");
          }
          if (await clickIf(page, "Retake questions")) {
            const issues = [...await clippedOrUnreachable(page), ...await sweep(page)];
            for (const issue of issues) failures.push({ ...issue, where: `${label} / questions` });
            await clickIf(page, "Plan later");
          }
          await page.goto(base + "/agenda", { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(300);
          await scaleText(page, scale);
          if (await clickIf(page, "Filter")) {
            const issues = [...await clippedOrUnreachable(page), ...await sweep(page)];
            for (const issue of issues) failures.push({ ...issue, where: `${label} /agenda filter` });
            await clickIf(page, "Done");
          }
          await page.goto(base + "/explore", { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(300);
          await scaleText(page, scale);
          if (await clickIf(page, "Scan an island code")) {
            const issues = [...await clippedOrUnreachable(page), ...await sweep(page)];
            for (const issue of issues) failures.push({ ...issue, where: `${label} /explore scan` });
            await clickIf(page, "Close scanner");
          }
        }
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\n${failures.length} readability problems`);
  for (const failure of failures.slice(0, 40)) console.error(`- ${failure.where} [${failure.kind}] ${failure.text}`);
  process.exit(1);
}
console.log("\nreadability ok");
