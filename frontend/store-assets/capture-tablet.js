const puppeteer = require('puppeteer')
const path = require('path')

const screens = [
  { file: 'screenshot-tablet-1.html', out: 'screenshot-tablet-1.png' },
  { file: 'screenshot-tablet-2.html', out: 'screenshot-tablet-2.png' },
]

;(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()

  for (const s of screens) {
    const filePath = 'file:///' + path.join(__dirname, s.file).replace(/\\/g, '/')
    await page.setViewport({ width: 1200, height: 1920, deviceScaleFactor: 1 })
    await page.goto(filePath, { waitUntil: 'networkidle0' })
    const outPath = path.join(__dirname, s.out)
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1200, height: 1920 } })
    console.log('✅ Salvo:', s.out)
  }

  await browser.close()
  console.log('\n🎉 2 screenshots de tablet prontos!')
})()
