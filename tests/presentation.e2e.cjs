// Requires Node.js and Playwright. CHROMIUM_PATH selects a system Chromium.
const { chromium } = require('playwright')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

async function main() {
  const root = process.env.SITE_ROOT ? path.resolve(process.env.SITE_ROOT) : path.resolve(__dirname, '..')
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }
  const server = http.createServer((request, response) => {
    const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const file = path.resolve(root, `.${requested === '/' ? '/index.html' : requested}`)
    if (!file.startsWith(`${root}/`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end()
      return
    }
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream')
    fs.createReadStream(file).pipe(response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let browser
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
    const page = await browser.newPage()
    page.setDefaultTimeout(8000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const origin = `http://127.0.0.1:${server.address().port}`
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
      await page.goto(origin)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const demo = page.getByRole('link', { name: 'Try the demo', exact: true })
      assert.ok(await demo.isVisible())
      assert.equal(await demo.getAttribute('href'), '/demo/')
      assert.match(await page.locator('main').textContent(), /read-only demo with sample data/)
      const meet = page.getByRole('button', { name: 'Meet your lynx', exact: true })
      assert.equal(await meet.count(), 1, 'A visible hero control makes the companion discoverable')
      assert.ok(await meet.isVisible())
      assert.equal(await page.locator('[data-lynx-portrait] svg').count(), 1, 'The existing lynx illustration is visible in the hero')
      await meet.focus()
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('#proxmiu-lynx').count(), 1)
      await page.keyboard.press('Escape')
      assert.ok(await meet.evaluate(element => element === document.activeElement))
      for (const heading of ['Snapshots, backups, and a change of node.', 'Chat with Lynx. Keep the controls.']) {
        assert.ok(await page.getByRole('heading', { name: heading }).isVisible())
      }
      const copy = await page.locator('main').textContent()
      assert.match(copy, /Proxmox description field/)
      assert.match(copy, /names, IP addresses, notes or secrets/i)
      assert.match(copy, /encrypted on your agent/)
      assert.match(copy, /OpenRouter/)
      assert.match(copy, /Chat messages go to your configured provider/)
      assert.match(copy, /never applies infrastructure changes automatically/)
      assert.match(copy, /Approve the exact preview/)
      assert.match(copy, /Check the before and after, then confirm/)
      assert.match(copy, /never stops it for you/)
      assert.match(copy, /Plan a new guest/)
      assert.match(copy, /Review in Create/)
      assert.match(copy, /before you explicitly create the guest/)
      assert.match(copy, /Proxmox task/)
      assert.match(copy, /history survives agent restarts in an encrypted local journal/)
      assert.match(copy, /Interrupted runs retain their last saved steps/)
      assert.match(copy, /never resumes setup commands automatically/)
      assert.match(copy, /native Proxmox console/)
      assert.match(copy, /configured VM serial sockets/)
      assert.match(copy, /grant VM.Console on the intended guests/)
      await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager' }))
      await page.locator('footer').scrollIntoViewIfNeeded()
      await page.waitForFunction(() => [...document.images].filter(image => !image.complete).length === 0)
      assert.deepEqual(await page.locator('img').evaluateAll(images => images.filter(image => image.naturalWidth === 0).map(image => image.src)), [])
      const overflow = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }))
      assert.ok(overflow.content <= overflow.viewport, `No horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`)
      await page.evaluate(() => scrollTo(0, 0))
      await page.screenshot({ path: `/tmp/proxmiu-site-${width}.png` })
      await page.locator('#advisor').screenshot({ path: `/tmp/proxmiu-site-advisor-${width}.png` })
    }
    assert.deepEqual(errors, [])
    console.log('PASS: actual site companion, keyboard focus, current feature/privacy copy, loaded images, desktop and 390px overflow, reduced-motion layouts')
  } finally {
    if (browser) await browser.close()
    server.close()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
