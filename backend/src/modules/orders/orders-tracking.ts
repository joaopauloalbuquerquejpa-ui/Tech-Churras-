import { prisma } from '../../config/prisma'
import { geocodeAddress, haversineKm } from '../../utils/geo'
import { resolveOrderAccessWhere } from './orders-access'

export async function updateOrderLocation(id: string, lat: number, lng: number, userId: string) {
  const gm = await prisma.grillmaster.findUnique({ where: { userId } })
  if (!gm) throw new Error('Nao autorizado')
  const order = await prisma.order.findFirst({ where: { id, grillmasterId: gm.id } })
  if (!order) throw new Error('Pedido nao encontrado')
  return prisma.order.update({
    where: { id },
    data: { grillmasterLat: lat, grillmasterLng: lng, grillmasterLastUpdate: new Date() },
    select: { id: true, grillmasterLat: true, grillmasterLng: true, grillmasterLastUpdate: true },
  })
}

export async function getOrderEta(id: string, userId: string, role: string) {
  const whereClause = await resolveOrderAccessWhere(id, userId, role)

  const order = await prisma.order.findFirst({
    where: whereClause,
    select: {
      eventAddress: true,
      grillmasterLat: true,
      grillmasterLng: true,
      grillmasterLastUpdate: true,
      status: true,
    },
  })
  if (!order) throw new Error('Pedido nao encontrado')

  if (!order.grillmasterLat || !order.grillmasterLng) {
    return { available: false, reason: 'Localizacao do churrasqueiro nao disponivel' }
  }

  // Geocode event address (cached per-request, no DB storage needed)
  const eventCoords = await geocodeAddress(order.eventAddress)
  if (!eventCoords) {
    return { available: false, reason: 'Nao foi possivel geocodificar o endereco do evento' }
  }

  const distanceKm = haversineKm(
    order.grillmasterLat, order.grillmasterLng,
    eventCoords.lat, eventCoords.lng,
  )

  // Speed: 30 km/h urban average + 5 min buffer
  const etaMinutes = Math.round((distanceKm / 30) * 60) + 5
  const etaLabel = etaMinutes < 2 ? 'chegando' : etaMinutes < 60
    ? `~${etaMinutes} min`
    : `~${Math.round(etaMinutes / 60)}h`

  return {
    available: true,
    distanceKm: +distanceKm.toFixed(2),
    etaMinutes,
    etaLabel,
    gmLat: order.grillmasterLat,
    gmLng: order.grillmasterLng,
    eventLat: eventCoords.lat,
    eventLng: eventCoords.lng,
    lastUpdate: order.grillmasterLastUpdate,
  }
}
