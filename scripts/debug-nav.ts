import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote'] })
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await ctx.newPage()
const errors: string[] = []
page.on('pageerror', e => errors.push(e.message.substring(0, 200)))
page.on('console', m => { if (m.type() === 'error') errors.push(`[console] ${m.text().substring(0, 200)}`) })
await page.goto('http://localhost:3000/merchant-os/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForSelector('input[type="email"]', { timeout: 15000 })
await page.locator('input[type="email"]').first().fill('spaza@groway.co.za')
await page.locator('input[type="password"]').first().fill('demo1234')
await page.locator('button[type="submit"], button:has-text("Sign in")').first().click()
await page.waitForURL(/\/merchant-os\/app/, { timeout: 25000 }).catch(() => {})
console.log('URL after login:', page.url())
await page.waitForTimeout(6000) // longer wait for hydration
console.log('Page errors:', errors.length)
errors.slice(0, 5).forEach(e => console.log('  ERR:', e))
// Count all buttons
const allButtons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).length)
console.log('Total buttons on page:', allButtons)
// Get all buttons with text
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).slice(0, 30).map(b => ({
    title: b.getAttribute('title'),
    text: (b.textContent || '').trim().substring(0, 40),
    cls: b.className.substring(0, 50)
  }))
})
buttons.forEach((b, i) => console.log(`  [${i}] title="${b.title}" text="${b.text}"`))
await page.screenshot({ path: '/home/z/my-project/video-assets/frames/debug-dashboard.png' })
console.log('screenshot saved to debug-dashboard.png')
await browser.close()
