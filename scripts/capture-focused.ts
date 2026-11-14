/**
 * Focused capture: get the missing critical scenes (SAPE 10/11/12, Accounting, GroCredit, GroSupply)
 * Uses page.evaluate to reliably click nav buttons by searching the full DOM.
 * Runs server + capture in ONE process to keep the server alive.
 */
import { chromium } from 'playwright'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

const BASE = 'http://localhost:3000'
const FRAMES_DIR = '/home/z/my-project/video-assets/frames'
fs.mkdirSync(FRAMES_DIR, { recursive: true })

async function clickNav(page, label: string): Promise<boolean> {
  // Use page.evaluate to find and click the nav button by title or text
  const clicked = await page.evaluate((lbl) => {
    // Strategy 1: button[title="label"]
    const byTitle = document.querySelector(`button[title="${lbl}"]`) as HTMLButtonElement | null
    if (byTitle) { byTitle.click(); return true }
    // Strategy 2: any button containing a span with the text
    const buttons = Array.from(document.querySelectorAll('button'))
    for (const b of buttons) {
      const text = b.textContent || ''
      const title = b.getAttribute('title') || ''
      if (text.trim() === lbl || title === lbl || text.includes(lbl)) {
        b.click()
        return true
      }
    }
    // Strategy 3: partial match (case insensitive)
    const lower = lbl.toLowerCase()
    for (const b of buttons) {
      if ((b.textContent || '').toLowerCase().includes(lower)) {
        b.click()
        return true
      }
    }
    return false
  }, label)
  if (clicked) {
    await page.waitForTimeout(3000)
    return true
  }
  console.warn(`  WARNING: nav "${label}" not found`)
  return false
}

async function shot(page, name: string) {
  const outPath = path.join(FRAMES_DIR, `${name}.png`)
  await page.screenshot({ path: outPath, fullPage: false })
  const size = fs.statSync(outPath).size
  console.log(`  captured ${name}.png (${size} bytes)`)
}

async function login(page, email: string, password: string) {
  await page.goto(`${BASE}/merchant-os/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('button[type="submit"], button:has-text("Sign in")').first().click()
  await page.waitForURL(/\/merchant-os\/app/, { timeout: 25000 }).catch(() => {})
  await page.waitForTimeout(3000)
}

async function main() {
  console.log('Launching Chromium (lean)...')
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-extensions','--disable-software-rasterizer','--no-zygote','--force-device-scale-factor=1'] })
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('console', () => {})
  page.on('pageerror', () => {})

  console.log('Logging in as spaza...')
  await login(page, 'spaza@groway.co.za', 'demo1234')
  await page.waitForTimeout(2000)

  // Capture Accounting
  console.log('[Accounting]')
  await clickNav(page, 'Accounting')
  await shot(page, '05c-spaza-accounting')

  // Capture GroCredit
  console.log('[GroCredit]')
  await clickNav(page, 'GroCredit')
  await shot(page, '06a-grocredit')

  // Capture GroSupply
  console.log('[GroSupply]')
  await clickNav(page, 'GroSupply')
  await shot(page, '06b-grosupply')

  // Capture SAPE landing
  console.log('[SAPE landing]')
  await clickNav(page, 'SAPE')
  await page.waitForTimeout(3500)
  await shot(page, '10-sape-landing')

  // Capture SAPE authentic scan
  console.log('[SAPE authentic scan]')
  const authBtn = page.locator('button:has-text("Authenticate at POS")').first()
  if (await authBtn.count() > 0) {
    await authBtn.click()
    await page.waitForTimeout(5500)
    await shot(page, '11-sape-authentic')
  } else {
    console.warn('  WARNING: "Authenticate at POS" button not found')
  }

  // Capture SAPE counterfeit scan
  console.log('[SAPE counterfeit scan]')
  const counterfeitBtn = page.locator('button:has-text("Scan Suspicious Sample")').first()
  if (await counterfeitBtn.count() > 0) {
    await counterfeitBtn.click()
    await page.waitForTimeout(5500)
    await shot(page, '12-sape-counterfeit')
  } else {
    console.warn('  WARNING: "Scan Suspicious Sample" button not found')
  }

  // Also re-capture restaurant, salon, pharmacy with the better nav
  console.log('[Restaurant]')
  await login(page, 'restaurant@groway.co.za', 'demo1234')
  await clickNav(page, 'Floor Plan')
  await shot(page, '07a-restaurant-floorplan')
  await clickNav(page, 'Kitchen Display')
  await shot(page, '07b-restaurant-kitchen')

  console.log('[Salon]')
  await login(page, 'salon@groway.co.za', 'demo1234')
  await clickNav(page, 'Bookings')
  await shot(page, '08a-salon-bookings')
  await clickNav(page, 'CRM & Loyalty')
  await shot(page, '08b-salon-crm')

  console.log('[Pharmacy]')
  await login(page, 'pharmacy@groway.co.za', 'demo1234')
  await clickNav(page, 'Medical Practice')
  await shot(page, '09-pharmacy')

  await browser.close()
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
