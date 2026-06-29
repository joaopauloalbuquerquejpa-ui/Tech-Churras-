const puppeteer = require('puppeteer')
const path = require('path')

;(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 })
  const filePath = 'file:///' + path.join(__dirname, 'feature-graphic.html').replace(/\\/g, '/')
  await page.goto(filePath, { waitUntil: 'networkidle0' })
  const outPath = path.join(__dirname, 'feature-graphic.png')
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1024, height: 500 } })
  console.log('✅ Salvo: feature-graphic.png')
  await browser.close()
})()
