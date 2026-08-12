-- Grillmaster pode declarar que traz auxiliar pra eventos acima de 30
-- convidados (regra: 1 auxiliar a cada 30 convidados extras, sem isso o
-- pedido acima de 30 fica bloqueado pra esse Grillmaster).
ALTER TABLE "Grillmaster" ADD COLUMN IF NOT EXISTS "bringsAuxiliar" BOOLEAN NOT NULL DEFAULT false;
