import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.env.BASE_URL || "http://127.0.0.1:8080";
const browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { channel: "msedge" } : {}) });
const results = [];
const run = async (name, check) => { try { await check(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, error: error.message }); } };
try {
  await run("Opening mounts the solar scene without external fonts; identity fits", async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const requests = []; page.on("request", r => requests.push(r.url()));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.classList.contains("motion-ready"));
    await page.waitForSelector("[data-solar-globe] canvas", { timeout: 8000 });
    assert(!requests.some(url => /fonts\.googleapis|fonts\.gstatic/.test(url)));
    const size = await page.locator("[data-yash]").evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    assert(size > 60 && size < 85);
    await page.close();
  });
  await run("Direct ROAM anchor remains aligned after deferred animation setup", async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}/#roam`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.classList.contains("motion-ready"));
    await page.waitForTimeout(800);
    assert(Math.abs(await page.locator("#roam").evaluate(el => el.getBoundingClientRect().top)) < 100);
    await page.close();
  });
  await run("Phone destination selection stays visible above the foreground panel", async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "03 Lodhi Gardens", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("[data-travel-story]")?.getAttribute("data-stop") === "2");
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".travel-product")).width === "170px");
    assert.equal(await page.locator("[data-travel-story]").getAttribute("data-stop"), "2");
    const boxes = await page.evaluate(() => ({ panel: document.querySelector('.travel-product').getBoundingClientRect().toJSON() }));
    // Select by its visible name to avoid depending on unrelated SVG group order.
    const label = await page.locator(".travel-node-label").filter({ hasText: "Lodhi Gardens" }).boundingBox();
    assert(label && (label.x + label.width <= boxes.panel.left || boxes.panel.right <= label.x || label.y + label.height <= boxes.panel.top || boxes.panel.bottom <= label.y), JSON.stringify({ label, panel: boxes.panel }));
    const map = await page.request.get(`${base}/assets/maps/delhi.svg`);
    assert(map.ok()); assert((await map.text()).includes("OpenStreetMap"));
    assert(await page.getByRole("link", { name: "© OpenStreetMap contributors" }).isVisible());
    await page.close();
  });
  await run("Reading layout survives an unavailable choreography chunk", async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(await page.locator("[data-identity]").evaluate(el => getComputedStyle(el).opacity), "1");
    assert(await page.getByRole("heading", { name: "Yash Khairwal. AI & full-stack." }).count());
    await page.close();
  });
} finally {
  await browser.close(); mkdirSync("qa-artifacts", { recursive: true });
  writeFileSync("qa-artifacts/clarity-smoke.json", JSON.stringify({ base, results }, null, 2));
  console.log(JSON.stringify(results, null, 2)); if (results.some(r => !r.pass)) process.exitCode = 1;
}
