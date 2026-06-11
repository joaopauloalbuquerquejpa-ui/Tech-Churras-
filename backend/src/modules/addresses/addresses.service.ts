import { prisma } from '../../config/prisma'

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function createAddress(userId: string, data: {
  label: string; street: string; number: string; complement?: string
  neighborhood: string; city: string; state: string; zipCode: string; isDefault?: boolean
}) {
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  }
  const isFirst = (await prisma.address.count({ where: { userId } })) === 0
  return prisma.address.create({
    data: { ...data, userId, isDefault: data.isDefault ?? isFirst },
  })
}

export async function updateAddress(id: string, userId: string, data: {
  label?: string; street?: string; number?: string; complement?: string
  neighborhood?: string; city?: string; state?: string; zipCode?: string
}) {
  const addr = await prisma.address.findFirst({ where: { id, userId } })
  if (!addr) throw new Error('Endereco nao encontrado')
  return prisma.address.update({ where: { id }, data })
}

export async function deleteAddress(id: string, userId: string) {
  const addr = await prisma.address.findFirst({ where: { id, userId } })
  if (!addr) throw new Error('Endereco nao encontrado')
  await prisma.address.delete({ where: { id } })
  if (addr.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } })
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } })
  }
}

export async function setDefaultAddress(id: string, userId: string) {
  const addr = await prisma.address.findFirst({ where: { id, userId } })
  if (!addr) throw new Error('Endereco nao encontrado')
  await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  return prisma.address.update({ where: { id }, data: { isDefault: true } })
}
