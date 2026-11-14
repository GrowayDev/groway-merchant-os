import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
const BASE = 'http://localhost:3000'
const FRAMES_DIR = '/home/z/my-project/video-assets/frames'
async function shot(page, name: string) {
  const outPath = path.join(FRAMES_DIR, `${name}.png`)
  await page.screenshot({ path: outPath, fullPage: false })
  console.log(`  captured ${name}.png (${fs.statSync(outPath).size} bytes)`)
}
async function loginAndPick(page, email: string, pw: string, vert: string) {
  await page.goto(`${BASE}/merchant-os/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(pw)
  await page.locator('button[type="submit"], button:has-text("Sign in")').first().click()
  await page.waitForURL(/\/merchant-os\/app/, { timeout: 25000 }).catch(() => {})
  await page.waitForTimeout(3000)
  const picker = page.locator(`button:has-text("${vert}")`).first()
  if (await picker.count() > 0) {
    console.log(`  picking vertical: ${vert}`)
    await picker.click()
    await page.waitForTimeout(2000)
    const sub = page.locator('button:has-text("Spaza"), button:has-text("Restaurant"), button:has-text("Hair Salon"), button:has-text("Pharmacy")').first()
    if (await sub.count() > 0) { await sub.click(); await page.waitForTimeout(3000) }
  }
  await page.waitForTimeout(2000)
}
async function clickNav(page, label: string) {
  return await page.evaluate((lbl) => {
    for (const b of Array.from(document.querySelectorAll('button'))) {
      if (b.getAttribute('title') === lbl) { b.click(); return true }
    }
    for (const b of Array.from(document.querySelectorAll('button'))) {
      if ((b.textContent || '').trim() === lbl) { b.click(); return true }
    }
    const lower = lbl.toLowerCase()
    for (const b of Array.from(document.querySelectorAll('button'))) {
      if ((b.textContent || '').toLowerCase().includes(lower)) { b.click(); return true }
    }
    return false
  }, label)
}
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-extensions','--no-zygote','--force-device-scale-factor=1'] })
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } })
const page = await ctx.newPage()
page.on('console', () => {}); page.on('pageerror', () => {})

// Scene 11: SAPE authentic — login as spaza, go to SAPE, wait for products, click first "Authenticate at POS"
console.log('[SAPE authentic]')
await loginAndPick(page, 'spaza@groway.co.za', 'demo1234', 'Grocery & FMCG')
await clickNav(page, 'SAPE')
await page.waitForTimeout(5000) // longer wait for products to load
// Try clicking via JS
const authClicked = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'))
  const t = btns.find(b => (b.textContent || '').includes('Authenticate at POS'))
  if (t) { t.click(); return true }
  return false
})
console.log(`  auth button clicked: ${authClicked}`)
if (authClicked) {
  await page.waitForTimeout(6000)
  await shot(page, '11-sape-authentic')
}

// Restaurant
console.log('[Restaurant]')
await loginAndPick(page, 'restaurant@groway.co.za', 'demo1234', 'Food & Beverage')
await shot(page, '07a-restaurant-floorplan')
await clickNav(page, 'Kitchen Display')
await page.waitForTimeout(2500)
await shot(page, '07b-restaurant-kitchen')

// Salon
console.log('[Salon]')
await loginAndPick(page, 'salon@groway.co.za', 'demo1234', 'Health & Beauty')
await shot(page, '08a-salon-bookings')
await clickNav(page, 'CRM')
await page.waitForTimeout(2500)
await shot(page, '08b-salon-crm')

// Pharmacy
console.log('[Pharmacy]')
await loginAndPick(page, 'pharmacy@groway.co.za', 'demo1234', 'Health & Pharmacy')
await shot(page, '09-pharmacy')

await browser.close()
console.log('Done.')
