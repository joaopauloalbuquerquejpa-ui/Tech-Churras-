const puppeteer = require('puppeteer')
const path = require('path')

const screens = [
  { file: 'screenshot-1.html', out: 'screenshot-1.png' },
  { file: 'screenshot-2.html', out: 'screenshot-2.png' },
  { file: 'screenshot-3.html', out: 'screenshot-3.png' },
  { file: 'screenshot-4.html', out: 'screenshot-4.png' },
]

;(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1080, height: 2000, deviceScaleFactor: 1 })

  for (const s of screens) {
    const filePath = 'file:///' + path.join(__dirname, s.file).replace(/\\/g, '/')
    await page.goto(filePath, { waitUntil: 'networkidle0' })
    // Altura total: 80px label + 1920px screen
    await page.setViewport({ width: 1080, height: 2000, deviceScaleFactor: 1 })
    const outPath = path.join(__dirname, s.out)
    await page.screenshot({ path: outPath, clip: { x: 0, y: 80, width: 1080, height: 1920 } })
    console.log('✅ Salvo:', s.out)
  }

  await browser.close()
  console.log('\n🎉 4 screenshots prontos em frontend/store-assets/')
})()
