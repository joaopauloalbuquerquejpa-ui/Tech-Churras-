-- "Reprovar" só marcava approved=false, que já é o default de cadastro
-- novo — sem um estado "rejeitado" distinto de "ainda não avaliado", o
-- item rejeitado sempre voltava a aparecer na lista de pendentes.
ALTER TABLE "Grillmaster" ADD COLUMN IF NOT EXISTS "rejected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Boutique" ADD COLUMN IF NOT EXISTS "rejected" BOOLEAN NOT NULL DEFAULT false;
