-- Corrige drift: refundStatus existia no schema.prisma desde junho mas nunca teve migração.
-- Sem esta coluna, QUALQUER prisma.order.create() falha (RETURNING inclui todas as colunas).
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundStatus" TEXT;
