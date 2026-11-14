// Groway demo video — Playwright scene recorder
// Records each scene as a separate webm (1280x720), then ffmpeg assembles.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = '/home/z/my-project/video-work/raw';
const DEMO_EMAIL = 'demo@groway.co.za';
const DEMO_PASS = 'demo1234';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function newCtx(browser, name, storageStatePath) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: path.join(OUT, name), size: { width: 1280, height: 720 } },
    deviceScaleFactor: 1,
    ...(storageStatePath && fs.existsSync(storageStatePath) ? { storageState: storageStatePath } : {})
  });
  return ctx;
}

async function record(name, targetMs, fn) {
  console.log(`[scene ${name}] recording (target ${Math.round(targetMs / 1000)}s)...`);
  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage', '--no-sandbox'] });
  try {
    const ctx = await newCtx(browser, name, name === 's03' ? undefined : '/home/z/my-project/video-work/auth.json');
    const page = await ctx.newPage();
    const t0 = Date.now();
    await fn(page);
    const elapsed = Date.now() - t0;
    if (elapsed < targetMs) await sleep(targetMs - elapsed);
    await page.close();
    await ctx.close(); // flushes video
    console.log(`[scene ${name}] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } finally {
    await browser.close();
  }
}

async function loginAndSaveState(browser) {
  if (fs.existsSync('/home/z/my-project/video-work/auth.json')) { console.log('[auth] already saved'); return; }
  console.log('[auth] logging in to capture storage state...');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/merchant-os/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(2500);
  await page.fill('#email', DEMO_EMAIL);
  await page.fill('#password', DEMO_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/merchant-os/app', { timeout: 90000 });
  await sleep(6000); // let dashboard widgets settle
  await ctx.storageState({ path: '/home/z/my-project/video-work/auth.json' });
  await ctx.close();
  console.log('[auth] storage state saved');
}

async function genCards(browser) {
  console.log('[cards] generating intro/outro cards...');
  if (fs.existsSync('/home/z/my-project/video-work/intro.png') && fs.existsSync('/home/z/my-project/video-work/outro.png')) {
    console.log('[cards] already exist, skipping'); return;
  }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

  const introHTML = `<!DOCTYPE html><html><head><style>
    body{margin:0;width:1280px;height:720px;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#004D40 0%,#00695C 55%,#00897B 100%);font-family:'Segoe UI',Arial,sans-serif;color:#fff}
    .logo{font-size:88px;font-weight:800;letter-spacing:-2px;margin-bottom:8px}
    .logo span{color:#A7FFEB}
    .tag{font-size:34px;font-weight:300;opacity:.92;margin-bottom:44px}
    .pill{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:40px;
      padding:14px 38px;font-size:22px;letter-spacing:.5px}
    .flag{position:absolute;bottom:38px;font-size:18px;opacity:.65;letter-spacing:3px}
  </style></head><body>
    <div class="logo">Gro<span>way</span></div>
    <div class="tag">Merchant OS — Powering South Africa's Spaza Economy</div>
    <div class="pill">Platform Demo &nbsp;•&nbsp; 3 Minutes</div>
    <div class="flag">SOWETO • KHAYELITSHA • UMLAZI • STELLENBOSCH</div>
  </body></html>`;

  const outroHTML = `<!DOCTYPE html><html><head><style>
    body{margin:0;width:1280px;height:720px;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#004D40 0%,#00695C 55%,#00897B 100%);font-family:'Segoe UI',Arial,sans-serif;color:#fff;text-align:center}
    .h{font-size:58px;font-weight:800;margin-bottom:18px}
    .s{font-size:30px;font-weight:300;opacity:.92;max-width:900px;line-height:1.45;margin-bottom:48px}
    .box{display:flex;gap:26px}
    .chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:16px;padding:18px 30px;font-size:21px}
    .url{position:absolute;bottom:44px;font-size:24px;letter-spacing:1px;color:#A7FFEB;font-weight:600}
  </style></head><body>
    <div class="h">Run your shop like a corporate.</div>
    <div class="s">POS &amp; Inventory &nbsp;•&nbsp; GroCredit working capital &nbsp;•&nbsp; Grosupply wholesale marketplace<br>
      GoPay payments &nbsp;•&nbsp; Learning Academy &nbsp;•&nbsp; Enterprise networks</div>
    <div class="box"><div class="chip">groway.co.za</div><div class="chip">Book a live demo</div></div>
    <div class="url">GROWAY — BUILT FOR SOUTH AFRICA</div>
  </body></html>`;

  const p1 = await ctx.newPage();
  await p1.setContent(introHTML); await sleep(600);
  await p1.screenshot({ path: '/home/z/my-project/video-work/intro.png' });
  await p1.close();
  const p2 = await ctx.newPage();
  await p2.setContent(outroHTML); await sleep(600);
  await p2.screenshot({ path: '/home/z/my-project/video-work/outro.png' });
  await p2.close();
  await ctx.close();
  console.log('[cards] done');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  // resume support: skip scenes that already produced a video file
  const done = (n) => {
    const dir = path.join(OUT, n);
    if (!fs.existsSync(dir)) return false;
    return fs.readdirSync(dir).some(f => f.endsWith('.webm') && fs.statSync(path.join(dir, f)).size > 100000);
  };
  const record = async (name, targetMs, fn) => {
    if (done(name)) { console.log(`[scene ${name}] already recorded, skipping`); return; }
    console.log(`[scene ${name}] recording (target ${Math.round(targetMs / 1000)}s)...`);
    const ctx = await newCtx(browser, name, name === 's03' ? undefined : '/home/z/my-project/video-work/auth.json');
    const page = await ctx.newPage();
    const t0 = Date.now();
    await fn(page);
    const elapsed = Date.now() - t0;
    if (elapsed < targetMs) await sleep(targetMs - elapsed);
    await page.close();
    await ctx.close(); // flushes video
    console.log(`[scene ${name}] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  };

  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage', '--no-sandbox'] });

  try {
  await genCards(browser);

  // s02: landing page
  await record('s02', 16500, async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(3000);
    await page.evaluate(async () => { window.scrollBy({ top: 380, behavior: 'smooth' }); });
    await sleep(3500);
    await page.evaluate(async () => { window.scrollBy({ top: 420, behavior: 'smooth' }); });
    await sleep(4000);
    await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    await sleep(2500);
  });

  // s03: login -> dashboard
  await record('s03', 23500, async (page) => {
    await page.goto(`${BASE}/merchant-os/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(2800);
    await page.click('#email');
    await page.type('#email', DEMO_EMAIL, { delay: 55 });
    await sleep(700);
    await page.click('#password');
    await page.type('#password', DEMO_PASS, { delay: 55 });
    await sleep(900);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/merchant-os/app', { timeout: 90000 });
    await sleep(9000);
    await page.mouse.move(640, 400);
    await page.evaluate(async () => { window.scrollBy({ top: 300, behavior: 'smooth' }); });
    await sleep(3500);
  });

  // capture auth state once (reuse in later scenes)
  await loginAndSaveState(browser);

  // complete the auto-config wizard (client-side state, resets every load)
  const completeWizard = async (page) => {
    await page.goto(`${BASE}/merchant-os/app`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(4000);
    await page.click('button:has-text("Food & Beverage")', { timeout: 25000 });
    await sleep(1300);
    await page.click('button:has-text("Coffee Shop")', { timeout: 25000 });
    await sleep(1300);
    await page.click('button:has-text("Launch POS")', { timeout: 25000 });
    await sleep(4500);
  };

  const sidebarScene = (label) => async (page) => {
    await completeWizard(page);
    const btn = page.locator(`button:has-text("${label}")`).first();
    await btn.click({ timeout: 25000 });
    await sleep(6000);
    await page.evaluate(async () => { window.scrollBy({ top: 300, behavior: 'smooth' }); });
    await sleep(2500);
  };

  await record('s04', 24000, sidebarScene('Inventory'));
  await record('s05', 22000, sidebarScene('Sales Report'));
  await record('s06', 23000, sidebarScene('GroCredit'));
  await record('s07', 20000, sidebarScene('CRM & Loyalty'));
  await record('s08', 19000, sidebarScene('Training'));

  // s09: Grosupply catalogue (210 suppliers)
  await record('s09', 19500, async (page) => {
    await page.goto(`${BASE}/grosupply`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(5500);
    await page.evaluate(async () => { window.scrollBy({ top: 420, behavior: 'smooth' }); });
    await sleep(4000);
    await page.evaluate(async () => { window.scrollBy({ top: 420, behavior: 'smooth' }); });
    await sleep(4000);
    await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    await sleep(2500);
  });

  // s10: GoPay
  await record('s10', 13500, async (page) => {
    await page.goto(`${BASE}/gopay`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(5000);
    await page.evaluate(async () => { window.scrollBy({ top: 400, behavior: 'smooth' }); });
    await sleep(3500);
    await page.evaluate(async () => { window.scrollBy({ top: 400, behavior: 'smooth' }); });
    await sleep(2500);
  });

  // s11: Enterprise portal (logged in via storage state)
  await record('s11', 15000, async (page) => {
    await page.goto(`${BASE}/enterprise/portal`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(6000);
    const tab = page.locator('button:has-text("Merchants"), [role="tab"]:has-text("Merchants")').first();
    try { await tab.click({ timeout: 6000 }); } catch (e) { console.log('  (Merchants tab not found, skipping click)'); }
    await sleep(4500);
  });

  console.log('ALL SCENES RECORDED');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
