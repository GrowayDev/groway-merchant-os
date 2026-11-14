/**
 * Resilient scene capture for the Groway Merchant OS demo video.
 * Restarts the dev server if it dies (OOM), retries each scene up to 3x.
 * Captures 14 high-res screenshots (1600x900) — one per scene.
 */
import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

const BASE = 'http://localhost:3000'
const CARDS_DIR = '/home/z/my-project/video-assets/cards'
const FRAMES_DIR = '/home/z/my-project/video-assets/frames'
fs.mkdirSync(FRAMES_DIR, { recursive: true })

const CREDS = {
  spaza: { email: 'spaza@groway.co.za', password: 'demo1234' },
  restaurant: { email: 'restaurant@groway.co.za', password: 'demo1234' },
  salon: { email: 'salon@groway.co.za', password: 'demo1234' },
  pharmacy: { email: 'pharmacy@groway.co.za', password: 'demo1234' },
}

function serverAlive(): boolean {
  try {
    execSync('curl -sS -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function restartServer() {
  console.log('  [server] restarting dev server...')
  try { execSync('pkill -f "next-server" 2>/dev/null', { stdio: 'pipe' }) } catch {}
  try { execSync('pkill -f "next dev" 2>/dev/null', { stdio: 'pipe' }) } catch {}
  try { execSync('pkill -f "bun run dev" 2>/dev/null', { stdio: 'pipe' }) } catch {}
  // Small heap to leave room for chromium
  const env = { ...process.env, NODE_OPTIONS: '--max-old-space-size=1280' }
  const child = spawn('bun', ['run', 'dev'], {
    cwd: '/home/z/my-project',
    env,
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
  // Wait for server to be healthy
  for (let i = 0; i < 40; i++) {
    if (serverAlive()) {
      console.log(`  [server] healthy after ${i * 2}s`)
      // Extra settle time
      return new Promise<void>(resolve => setTimeout(() => resolve(), 3000)) as any
    }
    execSync('sleep 2', { stdio: 'pipe' })
  }
  console.error('  [server] FAILED to restart')
  return null
}

async function ensureServer() {
  if (!serverAlive()) {
    await restartServer()
  }
}

async function login(page, email: string, password: string) {
  await ensureServer()
  await page.goto(`${BASE}/merchant-os/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 })
  const emailInput = page.locator('input[type="email"], input[name="email"]').first()
  await emailInput.fill(email)
  const pwInput = page.locator('input[type="password"], input[name="password"]').first()
  await pwInput.fill(password)
  const btn = page.locator('button:has-text("Sign in"), button:has-text("Log in"), button[type="submit"]').first()
  await btn.click()
  await page.waitForURL(/\/merchant-os\/app/, { timeout: 25000 }).catch(() => {})
  await page.waitForTimeout(3000)
}

async function navigateToView(page, viewId: string) {
  const byTitle = page.locator(`button[title="${viewId}"]`).first()
  if (await byTitle.count() > 0) {
    await byTitle.click()
    await page.waitForTimeout(2500)
    return true
  }
  const byText = page.locator(`button:has(span:has-text("${viewId}"))`).first()
  if (await byText.count() > 0) {
    await byText.click()
    await page.waitForTimeout(2500)
    return true
  }
  const byAny = page.locator(`button:has-text("${viewId}")`).first()
  if (await byAny.count() > 0) {
    await byAny.click()
    await page.waitForTimeout(2500)
    return true
  }
  console.warn(`  WARNING: could not find nav item "${viewId}"`)
  return false
}

async function shot(page, name: string) {
  const outPath = path.join(FRAMES_DIR, `${name}.png`)
  await page.screenshot({ path: outPath, fullPage: false })
  console.log(`  captured ${name}.png (${fs.statSync(outPath).size} bytes)`)
  return outPath
}

async function retry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T | null> {
  for (let i = 1; i <= attempts; i++) {
    try {
      await ensureServer()
      return await fn()
    } catch (e) {
      console.warn(`  [retry ${i}/${attempts}] ${label} failed: ${(e as Error).message?.substring(0, 100)}`)
      if (i < attempts) {
        await restartServer()
        await new Promise(r => setTimeout(r, 4000))
      }
    }
  }
  return null
}

async function main() {
  console.log('Ensuring dev server is up...')
  await ensureServer()

  console.log('Launching Chromium...')
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-extensions','--disable-software-rasterizer','--force-device-scale-factor=1'] })
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  })
  const page = await context.newPage()
  page.on('console', () => {})
  page.on('pageerror', () => {})

  // === TEXT CARDS (1, 2, 3, 13, 14) — file:// URLs, no server needed ===
  console.log('Capturing text cards...')
  for (const [name, file] of [
    ['01-cold-open', '01-cold-open.html'],
    ['02-quote', '02-quote.html'],
    ['03-numbers', '03-numbers.html'],
    ['13-why', '13-why.html'],
    ['14-close', '14-close.html'],
  ] as const) {
    await page.goto(`file://${path.join(CARDS_DIR, file)}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    await shot(page, name)
  }

  // === APP SCENES (4-12) — resilient with retry ===
  console.log('Capturing app scenes...')

  await retry('spaza-dashboard', async () => {
    await login(page, CREDS.spaza.email, CREDS.spaza.password)
    await page.waitForTimeout(2000)
    await shot(page, '04-spaza-dashboard')
  })

  await retry('spaza-pos', async () => {
    await navigateToView(page, 'POS')
    await shot(page, '05a-spaza-pos')
  })
  await retry('spaza-inventory', async () => {
    await navigateToView(page, 'Inventory')
    await shot(page, '05b-spaza-inventory')
  })
  await retry('spaza-accounting', async () => {
    await navigateToView(page, 'Accounting')
    await shot(page, '05c-spaza-accounting')
  })
  await retry('grocredit', async () => {
    await navigateToView(page, 'GroCredit')
    await shot(page, '06a-grocredit')
  })
  await retry('grosupply', async () => {
    await navigateToView(page, 'GroSupply')
    await shot(page, '06b-grosupply')
  })

  await retry('restaurant-floorplan', async () => {
    await login(page, CREDS.restaurant.email, CREDS.restaurant.password)
    await navigateToView(page, 'Floor Plan')
    await shot(page, '07a-restaurant-floorplan')
  })
  await retry('restaurant-kitchen', async () => {
    await navigateToView(page, 'Kitchen Display')
    await shot(page, '07b-restaurant-kitchen')
  })

  await retry('salon-bookings', async () => {
    await login(page, CREDS.salon.email, CREDS.salon.password)
    await navigateToView(page, 'Bookings')
    await shot(page, '08a-salon-bookings')
  })
  await retry('salon-crm', async () => {
    await navigateToView(page, 'CRM')
    await shot(page, '08b-salon-crm')
  })

  await retry('pharmacy', async () => {
    await login(page, CREDS.pharmacy.email, CREDS.pharmacy.password)
    await navigateToView(page, 'Medical Practice')
    await shot(page, '09-pharmacy')
  })

  await retry('sape-landing', async () => {
    await login(page, CREDS.spaza.email, CREDS.spaza.password)
    await navigateToView(page, 'SAPE')
    await page.waitForTimeout(3500)
    await shot(page, '10-sape-landing')
  })

  await retry('sape-authentic', async () => {
    const authBtn = page.locator('button:has-text("Authenticate at POS")').first()
    await authBtn.click()
    await page.waitForTimeout(5000)
    await shot(page, '11-sape-authentic')
  })

  await retry('sape-counterfeit', async () => {
    const counterfeitBtn = page.locator('button:has-text("Scan Suspicious Sample")').first()
    await counterfeitBtn.click()
    await page.waitForTimeout(5000)
    await shot(page, '12-sape-counterfeit')
  })

  await browser.close()
  console.log('All scenes captured.')

  const files = fs.readdirSync(FRAMES_DIR).filter(f => f.endsWith('.png')).sort()
  console.log(`\n${files.length} frames captured:`)
  files.forEach(f => console.log(`  ${f} (${fs.statSync(path.join(FRAMES_DIR, f)).size} bytes)`))
}

main().catch(e => { console.error(e); process.exit(1) })
