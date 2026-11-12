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
      assert.match(copy, /Rotate saved credentials/)
      assert.match(copy, /destination stays fixed and existing secrets stay on the agent/)
      assert.doesNotMatch(copy, /not a replacement for the Proxmox UI|leaves cluster administration where it belongs/)
      assert.match(copy, /toward a full replacement for the Proxmox VE web interface/)
      const roadmap = page.getByRole('region', { name: 'A broader workspace, in stages.' })
      assert.ok(await roadmap.isVisible())
      assert.equal(await roadmap.locator('article').count(), 3)
      const labels = roadmap.locator('.steps article > span')
      const foregrounds = await labels.evaluateAll(elements => elements.map(element => getComputedStyle(element).color))
      for (const [index, label] of (await labels.all()).entries()) {
        const foreground = foregrounds[index]
        // Sample the actual glass/gradient background with only the label ink hidden.
        const background = await label.screenshot({ style: '#roadmap .steps article > span { color: transparent; } header { visibility: hidden; }' })
        const contrast = await page.evaluate(async ({ foreground, background }) => {
          const image = new Image()
          image.src = `data:image/png;base64,${background}`
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = image.width; canvas.height = image.height
          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0)
          const backdrop = [...context.getImageData(Math.floor(image.width / 2), Math.floor(image.height / 2), 1, 1).data].slice(0, 3)
          const ink = foreground.match(/[\d.]+/g).map(Number)
          const alpha = ink[3] ?? 1
          const composite = ink.slice(0, 3).map((channel, index) => channel * alpha + backdrop[index] * (1 - alpha))
          const luminance = rgb => rgb.map(channel => channel / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
          const values = [luminance(composite), luminance(backdrop)].sort((a, b) => a - b)
          return (values[1] + 0.05) / (values[0] + 0.05)
        }, { foreground, background: background.toString('base64') })
        assert.ok(contrast >= 4.5, `${await label.textContent()} label at ${width}px needs AA contrast >= 4.5:1; measured ${contrast.toFixed(2)}:1 (${foreground})`)
        console.log(`PASS: ${width}px roadmap label "${await label.textContent()}" contrast ${contrast.toFixed(2)}:1`)
      }
      const available = await roadmap.locator('article').nth(0).textContent()
      const planned = await roadmap.locator('article').nth(1).textContent()
      const later = await roadmap.locator('article').nth(2).textContent()
      assert.match(available, /Available now/)
      assert.match(available, /backup restore to a new guest/)
      assert.match(available, /native text and graphical consoles/)
      assert.match(planned, /Planned/)
      assert.doesNotMatch(planned, /graphical consoles/i)
      assert.match(planned, /hardware editing/)
      assert.match(later, /Planned/)
      for (const capability of ['storage', 'network', 'firewall', 'cluster', 'backup administration', 'accounts', 'audit', 'notifications']) {
        assert.ok(later.includes(capability), `Broader administration remains planned: ${capability}`)
      }
      assert.match(await roadmap.textContent(), /live Proxmox VE 8\/9 and PBS validation remains pending/)
      const operations = await page.getByRole('region', { name: 'Snapshots, backups, and a change of node.' }).textContent()
      assert.match(operations, /unused guest ID on the same node/)
      assert.match(operations, /five-minute, single-use plan/)
      assert.match(operations, /source stays intact/)
      assert.match(operations, /Restore requests a stopped guest with start-at-boot disabled/)
      assert.match(operations, /inspect its identity and configuration before starting it/)
      assert.match(operations, /Graphical display or Serial text/)
      assert.match(operations, /focus the console to send input/)
      assert.match(operations, /Phone keys and manual clipboard transfers/)
      assert.match(operations, /system clipboard contents never sync automatically/)
      assert.match(operations, /Native tickets and generated VNC passwords stay on the agent/)
      assert.match(operations, /never starts the guest, changes its display configuration or reconnects automatically/)
      assert.match(operations, /Console output is not automatically shared with Lynx/)
      assert.match(operations, /Live Proxmox VE 8\/9 graphical validation remains pending/)
      await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager' }))
      await page.locator('footer').scrollIntoViewIfNeeded()
      await page.waitForFunction(() => [...document.images].filter(image => !image.complete).length === 0)
      assert.deepEqual(await page.locator('img').evaluateAll(images => images.filter(image => image.naturalWidth === 0).map(image => image.src)), [])
      const overflow = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }))
      assert.ok(overflow.content <= overflow.viewport, `No horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`)
      await page.evaluate(() => scrollTo(0, 0))
      await page.screenshot({ path: `/tmp/proxmiu-site-${width}.png` })
      await page.locator('#advisor').screenshot({ path: `/tmp/proxmiu-site-advisor-${width}.png` })
      await roadmap.screenshot({ path: `/tmp/proxmiu-site-roadmap-${width}.png`, style: 'header { visibility: hidden; }' })
    }
    assert.deepEqual(errors, [])
    console.log('PASS: actual site companion, keyboard focus, current feature/privacy copy, loaded images, desktop and 390px overflow, reduced-motion layouts')
  } finally {
    if (browser) await browser.close()
    server.close()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
