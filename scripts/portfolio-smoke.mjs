import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

// Run against npm run dev or npm run preview. No external account is contacted.
const baseURL = process.env.BASE_URL || "http://127.0.0.1:8080";
const channel = process.env.BROWSER_CHANNEL || (process.platform === "win32" ? "msedge" : undefined);
const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
const results = [];
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (error) => errors.push(error.message));
const at = async (selector, progress) => {
  await page.evaluate(({ selector, progress }) => {
    const scene = document.querySelector(selector);
    window.scrollTo(0, scene.offsetTop + Math.max(0, scene.offsetHeight - innerHeight) * progress);
  }, { selector, progress });
  await page.waitForTimeout(800);
};
const check = async (name, fn) => {
  try { await fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, error: error.message }); }
};
try {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await check("Identity, modal and focus return", async () => {
    await at("[data-hero-scene]", 0);
    assert.equal(await page.locator("[data-solar-globe]").count(), 0, "WebGL should not load before the solar beat");
    assert.equal(await page.locator("[data-identity]").evaluate((el) => getComputedStyle(el).opacity), "1");
    const button = page.getByRole("button", { name: "Start a project", exact: true }).first();
    await button.click();
    assert(await page.locator("dialog").isVisible());
    await page.keyboard.press("Escape");
    assert(await button.evaluate((el) => el === document.activeElement));
  });
  await check("DO finishes after incidental interaction", async () => {
    await at("#do", .9);
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await page.locator(".phone-bar").dispatchEvent("pointerdown");
    await page.waitForTimeout(800);
    assert(await page.getByRole("button", { name: "Another request", exact: true }).isVisible());
  });
  await check("Words fit at mobile and desktop widths", async () => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(400);
      for (const [word, progress] of [["agents", .755], ["auto", .85], ["sys", .945]]) {
        await at("[data-hero-scene]", progress);
        const edges = await page.locator(`[data-sys="${word}"] [data-ch]`).evaluateAll((nodes) => nodes.map((el) => ({ left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right })));
        assert(edges.every(({ left, right }) => left >= -1 && right <= width + 1), `${word} clipped at ${width}`);
      }
    }
  });
  await check("Reduced motion changes live", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(600);
    assert.equal(await page.locator("[data-hero-pin]").evaluate((el) => getComputedStyle(el).position), "relative");
    assert.equal(await page.locator("[data-solar-globe]").count(), 0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(600);
    assert.equal(await page.locator("[data-hero-pin]").evaluate((el) => getComputedStyle(el).position), "sticky");
  });
  await check("Identity returns after a breakpoint change at the end of the hero", async () => {
    for (const width of [390, 1440]) {
      await at("[data-hero-scene]", .945);
      await page.setViewportSize({ width, height: 844 });
      await at("[data-hero-scene]", 0);
      for (const selector of ["[data-hero-exit]", "[data-identity]"]) {
        assert.equal(await page.locator(selector).evaluate((el) => getComputedStyle(el).opacity), "1");
      }
      assert.equal(await page.locator("[data-systems-over]").evaluate((el) => getComputedStyle(el).opacity), "0");
    }
  });
  await check("GPU pauses then resumes on reverse scroll", async () => {
    await at("[data-hero-scene]", .1);
    await page.waitForFunction(() => document.querySelector("[data-solar-globe]")?.getAttribute("data-rendering") === "active", undefined, { timeout: 15000 }).catch(async (error) => {
      const state = await page.evaluate(() => ({ progress: document.querySelector("[data-hero-pin]")?.getAttribute("data-p"), globe: document.querySelector("[data-solar-globe]")?.outerHTML, hidden: document.hidden, motion: document.documentElement.className }));
      throw new Error(`${error.message}; ${JSON.stringify(state)}`);
    });
    await at("[data-hero-scene]", .85);
    assert.equal(await page.locator("[data-solar-globe]").getAttribute("data-rendering"), "paused");
    await at("[data-hero-scene]", .1);
    assert.equal(await page.locator("[data-solar-globe]").getAttribute("data-rendering"), "active");
  });
} finally {
  await browser.close();
  mkdirSync("qa-artifacts", { recursive: true });
  writeFileSync("qa-artifacts/browser-smoke.json", JSON.stringify({ baseURL, results, errors }, null, 2));
  console.log(JSON.stringify({ results, errors }, null, 2));
  if (results.some((result) => !result.pass) || errors.length) process.exitCode = 1;
}
