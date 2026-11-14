/**
 * Capture the critical SAPE scenes + dashboard.
 * Handles the vertical picker (click Grocery & FMCG → Spaza).
 * Must run while the dev server is alive (start server + this script in ONE command).
 */
import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const BASE = 'http://localhost:3000'
const FRAMES_DIR = '/home/z/my-project/video-assets/frames'
fs.mkdirSync(FRAMES_DIR, { recursive: true })

async function shot(page, name: string) {
  const outPath = path.join(FRAMES_DIR, `${name}.png`)
  await page.screenshot({ path: outPath, fullPage: false })
  console.log(`  captured ${name}.png (${fs.statSync(outPath).size} bytes)`)
}

async function loginAndPickVertical(page, email: string, password: string, verticalText: string) {
  await page.goto(`${BASE}/merchant-os/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('button[type="submit"], button:has-text("Sign in")').first().click()
  await page.waitForURL(/\/merchant-os\/app/, { timeout: 25000 }).catch(() => {})
  await page.waitForTimeout(3000)

  // Check if we're on the vertical picker
  const pickerVisible = await page.locator('button:has-text("' + verticalText + '")').first().count()
  if (pickerVisible > 0) {
    console.log(`  picking vertical: ${verticalText}`)
    await page.locator(`button:has-text("${verticalText}")`).first().click()
    await page.waitForTimeout(2000)
    // Might need to pick a sub-vertical too
    const subVerticalBtn = page.locator('button:has-text("Spaza"), button:has-text("Restaurant"), button:has-text("Hair Salon"), button:has-text("Pharmacy")').first()
    if (await subVerticalBtn.count() > 0) {
      console.log(`  picking sub-vertical`)
      await subVerticalBtn.click()
      await page.waitForTimeout(3000)
    }
  } else {
    console.log(`  vertical picker not shown, already in app`)
  }
  await page.waitForTimeout(2000)
}

async function clickNav(page, label: string): Promise<boolean> {
  return await page.evaluate((lbl) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    // Exact title match
    for (const b of buttons) {
      if (b.getAttribute('title') === lbl) { b.click(); return true }
    }
    // Exact text match
    for (const b of buttons) {
      if ((b.textContent || '').trim() === lbl) { b.click(); return true }
    }
    // Partial text match (case insensitive)
    const lower = lbl.toLowerCase()
    for (const b of buttons) {
      if ((b.textContent || '').toLowerCase().includes(lower)) { b.click(); return true }
    }
    return false
  }, label)
}

async function main() {
  console.log('Launching Chromium...')
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-extensions','--no-zygote','--force-device-scale-factor=1'] })
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('console', () => {})
  page.on('pageerror', () => {})

  // Spaza: dashboard + POS + SAPE scenes
  console.log('[Spaza] login + pick Grocery & FMCG → Spaza')
  await loginAndPickVertical(page, 'spaza@groway.co.za', 'demo1234', 'Grocery & FMCG')
  await shot(page, '04-spaza-dashboard')

  console.log('[Spaza] POS')
  await clickNav(page, 'POS')
  await page.waitForTimeout(2500)
  await shot(page, '05a-spaza-pos')

  console.log('[Spaza] Inventory')
  await clickNav(page, 'Inventory')
  await page.waitForTimeout(2500)
  await shot(page, '05b-spaza-inventory')

  console.log('[Spaza] Accounting')
  await clickNav(page, 'Accounting')
  await page.waitForTimeout(2500)
  await shot(page, '05c-spaza-accounting')

  console.log('[Spaza] GroCredit')
  await clickNav(page, 'GroCredit')
  await page.waitForTimeout(2500)
  await shot(page, '06a-grocredit')

  console.log('[Spaza] GroSupply')
  await clickNav(page, 'GroSupply')
  await page.waitForTimeout(2500)
  await shot(page, '06b-grosupply')

  console.log('[SAPE] landing')
  await clickNav(page, 'SAPE')
  await page.waitForTimeout(4000)
  await shot(page, '10-sape-landing')

  console.log('[SAPE] authentic scan')
  // Find the first "Authenticate at POS" button and click via JS
  const authClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const target = btns.find(b => (b.textContent || '').includes('Authenticate at POS'))
    if (target) { target.click(); return true }
    return false
  })
  if (authClicked) {
    await page.waitForTimeout(5500)
    await shot(page, '11-sape-authentic')
  } else {
    console.warn('  WARNING: Authenticate button not found')
  }

  console.log('[SAPE] counterfeit scan')
  const counterfeitClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const target = btns.find(b => (b.textContent || '').includes('Scan Suspicious Sample'))
    if (target) { target.click(); return true }
    return false
  })
  if (counterfeitClicked) {
    await page.waitForTimeout(5500)
    await shot(page, '12-sape-counterfeit')
  } else {
    console.warn('  WARNING: Counterfeit button not found')
  }

  // Restaurant
  console.log('[Restaurant] login + pick Food & Beverage → Restaurant')
  await loginAndPickVertical(page, 'restaurant@groway.co.za', 'demo1234', 'Food & Beverage')
  await shot(page, '07a-restaurant-floorplan')
  await clickNav(page, 'Kitchen Display')
  await page.waitForTimeout(2500)
  await shot(page, '07b-restaurant-kitchen')

  // Salon
  console.log('[Salon] login + pick Health & Beauty → Hair Salon')
  await loginAndPickVertical(page, 'salon@groway.co.za', 'demo1234', 'Health & Beauty')
  await shot(page, '08a-salon-bookings')
  await clickNav(page, 'CRM & Loyalty')
  await page.waitForTimeout(2500)
  await shot(page, '08b-salon-crm')

  // Pharmacy
  console.log('[Pharmacy] login + pick Health & Pharmacy → Pharmacy')
  await loginAndPickVertical(page, 'pharmacy@groway.co.za', 'demo1234', 'Health & Pharmacy')
  await shot(page, '09-pharmacy')

  await browser.close()
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
