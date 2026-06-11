import { prisma } from '../src/config/prisma'

async function main() {
  const existing = await prisma.coupon.findUnique({ where: { code: 'BEMVINDO10' } })
  if (existing) {
    console.log('Cupom BEMVINDO10 ja existe, pulando.')
    process.exit(0)
  }
  const coupon = await prisma.coupon.create({
    data: {
      code: 'BEMVINDO10',
      discountType: 'PERCENT',
      discountValue: 10,
      active: true,
    },
  })
  console.log('Cupom criado:', coupon.code, '— 10% de desconto')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
