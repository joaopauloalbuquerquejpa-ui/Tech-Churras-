const puppeteer = require('puppeteer')
const path = require('path')

const screens = [
  { file: 'screenshot-androidxr-1.html', out: 'screenshot-androidxr-1.png' },
  { file: 'screenshot-androidxr-2.html', out: 'screenshot-androidxr-2.png' },
  { file: 'screenshot-androidxr-3.html', out: 'screenshot-androidxr-3.png' },
  { file: 'screenshot-androidxr-4.html', out: 'screenshot-androidxr-4.png' },
]

;(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  for (const s of screens) {
    const filePath = 'file:///' + path.join(__dirname, s.file).replace(/\\/g, '/')
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 })
    await page.goto(filePath, { waitUntil: 'networkidle0' })
    await page.screenshot({ path: path.join(__dirname, s.out), clip: { x: 0, y: 0, width: 1280, height: 720 } })
    console.log('✅', s.out)
  }
  await browser.close()
  console.log('\n🎉 4 screenshots Android XR prontos!')
})()
