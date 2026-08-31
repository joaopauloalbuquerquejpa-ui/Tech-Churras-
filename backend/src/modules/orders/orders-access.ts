import { prisma } from '../../config/prisma'

// Resolve o filtro "quem pode ver/mexer nesse pedido" por role — antes essa
// lógica estava copiada em 5 funções diferentes deste módulo, com risco de
// divergir silenciosamente entre as cópias a cada ajuste de regra de acesso.
// allowGrillmaster=false replica o comportamento de generateShareToken/rescheduleOrder,
// que hoje não dão acesso a GRILLMASTER (cai em customerId, não encontra o pedido).
export async function resolveOrderAccessWhere(id: string, userId: string, role: string, opts: { allowGrillmaster?: boolean } = {}): Promise<Record<string, any>> {
  if (role === 'ADMIN') return { id }
  if (role === 'GRILLMASTER' && opts.allowGrillmaster !== false) {
    const gm = await prisma.grillmaster.findUnique({ where: { userId } })
    if (!gm) throw new Error('Churrasqueiro nao encontrado')
    return { id, grillmasterId: gm.id }
  }
  return { id, customerId: userId }
}
