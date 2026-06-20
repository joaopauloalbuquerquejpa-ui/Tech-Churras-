/**
 * Gera ícones para Android e iOS a partir de uma imagem 1024x1024.
 * Uso: node scripts/generate-icons.js <caminho-da-imagem>
 * Requisito: npm install sharp
 */
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const source = process.argv[2]
if (!source) {
  console.error('Uso: node scripts/generate-icons.js <imagem-1024x1024.png>')
  process.exit(1)
}

const ANDROID_SIZES = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
]

const IOS_SIZES = [
  { name: 'Icon-20.png',      size: 20  },
  { name: 'Icon-20@2x.png',   size: 40  },
  { name: 'Icon-20@3x.png',   size: 60  },
  { name: 'Icon-29.png',      size: 29  },
  { name: 'Icon-29@2x.png',   size: 58  },
  { name: 'Icon-29@3x.png',   size: 87  },
  { name: 'Icon-40.png',      size: 40  },
  { name: 'Icon-40@2x.png',   size: 80  },
  { name: 'Icon-40@3x.png',   size: 120 },
  { name: 'Icon-60@2x.png',   size: 120 },
  { name: 'Icon-60@3x.png',   size: 180 },
  { name: 'Icon-76.png',      size: 76  },
  { name: 'Icon-76@2x.png',   size: 152 },
  { name: 'Icon-83.5@2x.png', size: 167 },
  { name: 'Icon-1024.png',    size: 1024 },
]

const androidResDir = path.join(__dirname, '../android/app/src/main/res')
const iosIconDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset')

async function generate() {
  // Android
  for (const { dir, size } of ANDROID_SIZES) {
    const dest = path.join(androidResDir, dir, 'ic_launcher.png')
    const destRound = path.join(androidResDir, dir, 'ic_launcher_round.png')
    await sharp(source).resize(size, size).toFile(dest)
    await sharp(source).resize(size, size).toFile(destRound)
    console.log(`✓ Android ${dir} (${size}px)`)
  }

  // iOS
  fs.mkdirSync(iosIconDir, { recursive: true })
  for (const { name, size } of IOS_SIZES) {
    const dest = path.join(iosIconDir, name)
    await sharp(source).resize(size, size).toFile(dest)
    console.log(`✓ iOS ${name} (${size}px)`)
  }

  // iOS Contents.json
  const contents = {
    images: IOS_SIZES.map(({ name, size }) => ({
      filename: name,
      idiom: size >= 76 ? 'ipad' : 'iphone',
      scale: name.includes('@3x') ? '3x' : name.includes('@2x') ? '2x' : '1x',
    })),
    info: { author: 'xcode', version: 1 },
  }
  fs.writeFileSync(path.join(iosIconDir, 'Contents.json'), JSON.stringify(contents, null, 2))

  console.log('\n✅ Ícones gerados para Android e iOS!')
  console.log('Próximo passo: npm run cap:sync')
}

generate().catch(console.error)
