import puppeteer from 'puppeteer';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'temporary screenshots');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

// Wait for loader to vanish (all frames loaded)
await page.waitForSelector('#loader.hidden', { timeout: 90000 });
console.log('Loader hidden — frames loaded');
await new Promise(r => setTimeout(r, 500));

// Scroll via Lenis (exposed as window.__lenis) then give GSAP time to render
async function shot(label, pct) {
  await page.evaluate(async (p) => {
    const totalH = document.body.scrollHeight - window.innerHeight;
    const target = totalH * p;
    if (window.__lenis) {
      window.__lenis.scrollTo(target, { immediate: true });
    } else {
      window.scrollTo(0, target);
    }
    // Let ScrollTrigger update
    if (window.ScrollTrigger) window.ScrollTrigger.update();
  }, pct);
  await new Promise(r => setTimeout(r, 900));
  const path = join(outDir, `shot-${label}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`${label} (${Math.round(pct * 100)}%) → ${path}`);
}

// Percentages of total page height. Hero = 100vh, scroll container = 920vh → total = 1020vh
// Canvas wipe starts at 6% scroll-container progress = (100+0.06*920)/1020 = 15.8% of page
// Sections: data-enter is % of scroll-container progress → pageP = (100+p*920)/1020
const p = (sc) => (100 + sc * 920) / 1020; // convert scroll-container % → page %

await shot('01-hero',      0.00);
await shot('02-wipe',      p(0.10));   // canvas circle-wipe mid-reveal
await shot('03-canvas',    p(0.25));   // canvas fully open, watch left
await shot('04-section1',  p(0.24));   // S1: Born on Starting Grid
await shot('05-section2',  p(0.40));   // S2: Graph TPT material
await shot('06-section3',  p(0.58));   // S3: McLaren × RM
await shot('07-section4',  p(0.75));   // S4: Caliber specs
await shot('08-cta',       p(0.92));   // CTA with stats

await browser.close();
console.log('Done.');
