-- Cliente pode deixar a Tech Churras notificar todos os churrasqueiros da
-- região em vez de escolher um específico — precisa de um valor/hora
-- comprometido pra cobrar antes de saber quem aceita, e pra impedir que um
-- churrasqueiro seja despachado pra um pedido que paga menos que o preço dele.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "estimatedHourlyRate" DOUBLE PRECISION;
