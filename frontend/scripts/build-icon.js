const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const SOURCE = process.argv[2] || 'c:/Users/DrButeko/Pictures/high-level-description-a-two-variant-log_EsRnvxjwWomw03BLikxrNw_28HXF318TBuWEaRnzfTMkw_cover.jpg'
const OUT_DIR = path.join(__dirname, '../public/icons')
const ICON_1024 = path.join(OUT_DIR, 'icon-1024.png')

// Android sizes
const ANDROID = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
]

// iOS sizes
const IOS = [
  { name: 'Icon-20.png',      size: 20   },
  { name: 'Icon-20@2x.png',   size: 40   },
  { name: 'Icon-20@3x.png',   size: 60   },
  { name: 'Icon-29.png',      size: 29   },
  { name: 'Icon-29@2x.png',   size: 58   },
  { name: 'Icon-29@3x.png',   size: 87   },
  { name: 'Icon-40.png',      size: 40   },
  { name: 'Icon-40@2x.png',   size: 80   },
  { name: 'Icon-40@3x.png',   size: 120  },
  { name: 'Icon-60@2x.png',   size: 120  },
  { name: 'Icon-60@3x.png',   size: 180  },
  { name: 'Icon-76.png',      size: 76   },
  { name: 'Icon-76@2x.png',   size: 152  },
  { name: 'Icon-83.5@2x.png', size: 167  },
  { name: 'Icon-1024.png',    size: 1024 },
]

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // 1. Discover image dimensions
  const meta = await sharp(SOURCE).metadata()
  console.log(`Imagem original: ${meta.width}x${meta.height}px`)

  // 2. The logo is in the lower ~65% of the portrait poster.
  //    Crop that region, then place on a perfect black 1024x1024 square.
  const cropTop    = Math.floor(meta.height * 0.33)
  const cropHeight = meta.height - cropTop
  const cropWidth  = meta.width

  const bg = { r: 10, g: 10, b: 10, alpha: 1 }

  await sharp(SOURCE)
    .extract({ left: 0, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(900, 900, { fit: 'contain', background: bg })
    .flatten({ background: bg })
    .extend({ top: 62, bottom: 62, left: 62, right: 62, background: bg })
    .resize(1024, 1024)
    .png()
    .toFile(ICON_1024)

  console.log(`✓ Ícone base gerado: ${ICON_1024}`)

  // 3. Android icons
  const androidResDir = path.join(__dirname, '../android/app/src/main/res')
  for (const { dir, size } of ANDROID) {
    const dest      = path.join(androidResDir, dir, 'ic_launcher.png')
    const destRound = path.join(androidResDir, dir, 'ic_launcher_round.png')
    await sharp(ICON_1024).resize(size, size).toFile(dest)
    await sharp(ICON_1024).resize(size, size).toFile(destRound)
    console.log(`✓ Android ${dir} (${size}px)`)
  }

  // 4. iOS icons
  const iosIconDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset')
  fs.mkdirSync(iosIconDir, { recursive: true })

  for (const { name, size } of IOS) {
    await sharp(ICON_1024).resize(size, size).toFile(path.join(iosIconDir, name))
    console.log(`✓ iOS ${name} (${size}px)`)
  }

  // 5. iOS Contents.json
  const images = IOS.map(({ name, size }) => {
    let idiom = 'iphone'
    if (size === 1024) idiom = 'ios-marketing'
    else if (size >= 76) idiom = 'ipad'
    return {
      filename: name,
      idiom,
      scale: name.includes('@3x') ? '3x' : name.includes('@2x') ? '2x' : '1x',
    }
  })
  fs.writeFileSync(
    path.join(iosIconDir, 'Contents.json'),
    JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 2)
  )

  console.log('\n✅ Todos os ícones gerados!')
  console.log(`   Android: ${androidResDir}`)
  console.log(`   iOS:     ${iosIconDir}`)
  console.log(`   Web:     ${OUT_DIR}`)
}

main().catch(err => { console.error(err); process.exit(1) })
