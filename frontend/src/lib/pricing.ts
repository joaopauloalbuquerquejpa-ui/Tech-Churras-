// Espelha as mesmas constantes do backend (backend/src/modules/orders/orders.service.ts).
// Fonte única pro frontend — antes cada wizard (pedido/page.tsx, orders/new/page.tsx)
// tinha sua própria cópia hardcoded, com risco real de divergir e cobrar valores
// diferentes pro mesmo tipo de pedido. O valor cobrado de verdade sempre vem do
// backend; isso aqui é só pra estimativa mostrada ao cliente antes de confirmar.
export const SERVICE_FEE_RATE = 0.06
export const SIDE_DISH_RATE_ACOUGUE = 18.50
export const SIDE_DISH_RATE_GRILLMASTER = 25.00
