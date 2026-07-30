-- Cliente escolhe quem prepara os acompanhamentos (farofa, arroz, vinagrete, maionese):
-- acougue vende pronto, churrasqueiro prepara no local, ou nenhum (cliente resolve por conta).
-- GM decide se quer oferecer esse servico no proprio perfil.
ALTER TABLE "Grillmaster" ADD COLUMN IF NOT EXISTS "offersSideDishPrep" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sideDishPreparedBy" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sideDishFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
