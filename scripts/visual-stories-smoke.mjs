import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = process.env.BASE_URL || "http://127.0.0.1:8080";
const output = resolve(process.env.QA_OUTPUT || "qa-artifacts/visual-stories");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { channel: "msedge" } : {}) });
const results = [], errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push(e.message));
const check = async (name, fn) => {
  try { await fn(); results.push({ name, pass: true }); }
  catch (e) { results.push({ name, pass: false, error: e.message }); }
};
const at = async (selector, progress = 0) => {
  await page.evaluate(({ selector, progress }) => {
    const el = document.querySelector(selector);
    scrollTo(0, el.getBoundingClientRect().top + scrollY + Math.max(0, el.offsetHeight - innerHeight) * progress);
  }, { selector, progress });
  await page.waitForTimeout(850);
};
try {
  await page.goto(base, { waitUntil: "networkidle" });
  await check("Chart values, cumulative total, keyboard selection and disclosure", async () => {
    await at("#finpulse");
    await page.getByRole("button", { name: "Total so far", exact: true }).click();
    const sunday = page.getByRole("button", { name: "Sunday, ₹4,840", exact: true });
    await sunday.focus();
    await page.keyboard.press("Enter");
    assert.equal(await sunday.getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator(".finance-insight strong").textContent(), "₹4,840");
    await page.getByRole("button", { name: "Each day", exact: true }).click();
    await page.getByRole("button", { name: "Saturday, ₹1,480", exact: true }).click();
    assert.equal(await page.locator(".finance-insight strong").textContent(), "₹1,480");
    await page.locator(".visual-data summary").click();
    assert.equal(await page.locator(".visual-data tbody tr").count(), 7);
    const values = await page.locator(".visual-data tbody td:nth-child(2)").allTextContents();
    assert.equal(values.reduce((total, value) => total + Number(value.replace(/\D/g, "")), 0), 4840);
    await page.locator(".visual-data summary").click();
    await page.mouse.move(0, 0);
    await at("#finpulse");
    await page.screenshot({ path: `${output}/1440-finpulse.png` });
  });
  await check("ROAM scroll chapters, reverse scrolling and direct selection", async () => {
    for (const [step, progress] of [[0, .08], [1, .48], [2, .9]]) {
      await at("[data-travel-story]", progress);
      assert.equal(await page.locator("[data-travel-story]").getAttribute("data-step"), String(step));
      await page.screenshot({ path: `${output}/1440-roam-${step}.png` });
    }
    await at("[data-travel-story]", .05);
    assert.equal(await page.locator("[data-travel-story]").getAttribute("data-step"), "0");
    await page.getByRole("button", { name: "02 Translate", exact: true }).click();
    assert.equal(await page.locator("[data-travel-story]").getAttribute("data-step"), "1");
    assert(await page.getByText("Where is the museum?", { exact: true }).isVisible());
  });
  await check("320 / 390 / 768 widths and short landscape remain usable", async () => {
    for (const [width, height] of [[320, 740], [390, 844], [768, 1024], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(450);
      await at("#finpulse");
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow: ${width}`);
      await page.getByRole("button", { name: "Monday, ₹420", exact: true }).click();
      assert.equal(await page.locator(".finance-insight strong").textContent(), "₹420");
      if (width === 390) await page.locator(".finance-console").screenshot({ path: `${output}/390-finpulse.png` });
      await at("[data-travel-story]", .48);
      await page.getByRole("button", { name: "02 Translate", exact: true }).click();
      assert(await page.getByText("Where is the museum?", { exact: true }).isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `travel overflow: ${width}`);
      if (height >= 780 && width <= 390) {
        const bounds = await page.locator(".travel-product").boundingBox();
        assert(bounds.y >= 0 && bounds.y + bounds.height <= height, `panel clipped: ${width}`);
      }
      if (width === 390) await page.screenshot({ path: `${output}/390-roam.png` });
    }
  });
  await check("Reduced motion shows static chart and selectable travel concept", async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".travel-pin").evaluate((el) => getComputedStyle(el).position), "static");
    assert.equal(await page.locator("[data-fin-reveal]").getAttribute("width"), "100%");
    await at("[data-travel-story]");
    const navigate = page.getByRole("button", { name: "03 Navigate", exact: true });
    await navigate.focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("[data-travel-story]").getAttribute("data-step"), "2");
    assert.equal(await page.locator(".travel-camera").evaluate((el) => getComputedStyle(el).transform), "none");
    await page.screenshot({ path: `${output}/1440-roam-reduced.png` });
  });
  await check("No JavaScript retains chart, itinerary and project details", async () => {
    const staticPage = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await staticPage.goto(base, { waitUntil: "networkidle" });
    assert.equal(await staticPage.locator(".finance-bar").count(), 7);
    assert.equal(await staticPage.locator(".travel-pin").evaluate((el) => getComputedStyle(el).position), "static");
    assert.equal(await staticPage.locator(".travel-itinerary li").count(), 3);
    await staticPage.close();
  });
} finally {
  results.push({ name: "No browser runtime errors", pass: errors.length === 0, errors });
  writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}
if (results.some((r) => !r.pass)) process.exitCode = 1;
