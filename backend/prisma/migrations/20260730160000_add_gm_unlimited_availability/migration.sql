-- GM que representa uma equipe de multiplos churrasqueiros reais (ex: Team Jota,
-- 30+ profissionais) pode aceitar eventos simultaneos no mesmo dia sem ser
-- bloqueado pelo check de conflito de agenda pensado pra uma pessoa so.
ALTER TABLE "Grillmaster" ADD COLUMN IF NOT EXISTS "unlimitedAvailability" BOOLEAN NOT NULL DEFAULT false;
