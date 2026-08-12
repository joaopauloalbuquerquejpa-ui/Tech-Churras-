-- Açougue pode declarar se quer oferecer preparo de acompanhamentos no
-- estabelecimento — mesma ideia já existente pro Grillmaster
-- (Grillmaster.offersSideDishPrep). Se o açougue não quiser, a opção do
-- Grillmaster (quando ele oferecer) continua disponível no pedido.
ALTER TABLE "Boutique" ADD COLUMN IF NOT EXISTS "offersSideDishPrep" BOOLEAN NOT NULL DEFAULT false;
