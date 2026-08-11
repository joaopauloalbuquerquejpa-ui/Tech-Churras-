-- Corrige drift: schema.prisma declara commissionRate @default(0.10) desde sempre,
-- mas a migration original (20260609235907) gravou DEFAULT 0.03 e nunca foi corrigida.
-- Campo não é lido em nenhum lugar do código hoje (a comissão real é fixa em
-- payouts.service.ts), mas o default errado é uma armadilha pra quem confiar nele no futuro.
ALTER TABLE "Boutique" ALTER COLUMN "commissionRate" SET DEFAULT 0.10;

-- Linhas existentes que nunca tiveram o valor setado explicitamente ficaram com 0.03
-- do default antigo — realinha com o valor pretendido.
UPDATE "Boutique" SET "commissionRate" = 0.10 WHERE "commissionRate" = 0.03;
