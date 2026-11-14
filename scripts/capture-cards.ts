import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
const CARDS_DIR = '/home/z/my-project/video-assets/cards'
const FRAMES_DIR = '/home/z/my-project/video-assets/frames'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote'] })
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await ctx.newPage()
page.on('console', () => {}); page.on('pageerror', () => {})
for (const [name, file] of [
  ['07-restaurant', '07-restaurant.html'],
  ['08-salon', '08-salon.html'],
  ['09-pharmacy', '09-pharmacy.html'],
] as const) {
  await page.goto(`file://${path.join(CARDS_DIR, file)}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const outPath = path.join(FRAMES_DIR, `${name}.png`)
  await page.screenshot({ path: outPath })
  console.log(`captured ${name}.png (${fs.statSync(outPath).size} bytes)`)
}
await browser.close()
console.log('Done.')
