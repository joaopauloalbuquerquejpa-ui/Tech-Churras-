import { prisma } from '../../config/prisma'

export async function addFavorite(userId: string, targetType: string, targetId: string) {
  return prisma.favorite.upsert({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
    create: { userId, targetType, targetId },
    update: {},
  })
}

export async function removeFavorite(userId: string, targetType: string, targetId: string) {
  await prisma.favorite.deleteMany({ where: { userId, targetType, targetId } })
}

export async function listFavorites(userId: string) {
  const favs = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const gmIds = favs.filter(f => f.targetType === 'GRILLMASTER').map(f => f.targetId)
  const btIds = favs.filter(f => f.targetType === 'BOUTIQUE').map(f => f.targetId)

  const [grillmasters, boutiques] = await Promise.all([
    gmIds.length > 0
      ? prisma.grillmaster.findMany({
          where: { id: { in: gmIds } },
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([]),
    btIds.length > 0
      ? prisma.boutique.findMany({ where: { id: { in: btIds } } })
      : Promise.resolve([]),
  ])

  return {
    grillmasters: grillmasters.map(gm => ({
      ...gm,
      favoritedAt: favs.find(f => f.targetId === gm.id)?.createdAt,
    })),
    boutiques: boutiques.map(b => ({
      ...b,
      favoritedAt: favs.find(f => f.targetId === b.id)?.createdAt,
    })),
    raw: favs,
  }
}
