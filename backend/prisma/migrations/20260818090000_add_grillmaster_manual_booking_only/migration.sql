-- Perfil premium/exclusivo (ex: CEO a R$2.000/h) fica de fora do pool de
-- "deixa com a Tech Churras" (auto-despacho) — não é notificado em pedidos
-- aleatórios e não distorce a mediana de preço cobrada nesse modo.
ALTER TABLE "Grillmaster" ADD COLUMN IF NOT EXISTS "manualBookingOnly" BOOLEAN NOT NULL DEFAULT false;
