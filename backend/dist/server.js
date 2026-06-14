"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = require("./modules/auth/auth.routes");
const grillmasters_routes_1 = require("./modules/grillmasters/grillmasters.routes");
const boutiques_routes_1 = require("./modules/boutiques/boutiques.routes");
const auth_middleware_1 = require("./middlewares/auth.middleware");
const orders_routes_1 = require("./modules/orders/orders.routes");
const payments_routes_1 = require("./modules/payments/payments.routes");
const admin_routes_1 = require("./modules/admin/admin.routes");
const reviews_routes_1 = require("./modules/reviews/reviews.routes");
const favorites_routes_1 = require("./modules/favorites/favorites.routes");
const coupons_routes_1 = require("./modules/coupons/coupons.routes");
const messages_routes_1 = require("./modules/messages/messages.routes");
const push_routes_1 = require("./modules/push/push.routes");
const addresses_routes_1 = require("./modules/addresses/addresses.routes");
const cron_routes_1 = require("./modules/cron/cron.routes");
const points_routes_1 = require("./modules/points/points.routes");
const public_routes_1 = require("./modules/public/public.routes");
const upload_routes_1 = require("./modules/upload/upload.routes");
const calculator_routes_1 = require("./modules/calculator/calculator.routes");
const ai_routes_1 = require("./modules/ai/ai.routes");
const contracts_routes_1 = require("./modules/contracts/contracts.routes");
dotenv_1.default.config();
const app = (0, fastify_1.default)({ logger: true });
// Plugins
app.register(multipart_1.default, { limits: { fileSize: 10 * 1024 * 1024 } });
app.register(cors_1.default, {
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
app.register(jwt_1.default, { secret: process.env.JWT_SECRET ?? 'supersecret' });
app.register(cookie_1.default);
// Decorator de autenticaÃ§Ã£o
app.decorate('authenticate', auth_middleware_1.authenticate);
// Rotas
app.register(auth_routes_1.authRoutes);
app.register(boutiques_routes_1.boutiqueRoutes);
app.register(orders_routes_1.ordersRoutes);
app.register(payments_routes_1.paymentsRoutes);
app.register(admin_routes_1.adminRoutes);
app.register(grillmasters_routes_1.grillmastersRoutes);
app.register(reviews_routes_1.reviewsRoutes);
app.register(favorites_routes_1.favoritesRoutes);
app.register(coupons_routes_1.couponsRoutes);
app.register(messages_routes_1.messagesRoutes);
app.register(push_routes_1.pushRoutes);
app.register(addresses_routes_1.addressesRoutes);
app.register(cron_routes_1.cronRoutes);
app.register(points_routes_1.pointsRoutes);
app.register(public_routes_1.publicRoutes);
app.register(upload_routes_1.uploadRoutes);
app.register(calculator_routes_1.calculatorRoutes);
app.register(ai_routes_1.aiRoutes);
app.register(contracts_routes_1.contractsRoutes);
// Health check
app.get('/health', async () => {
    return { status: 'ok', message: 'Tech Churras API rodando! ðŸ”¥' };
});
const start = async () => {
    try {
        await app.listen({ port: 3333, host: '0.0.0.0' });
        console.log('ðŸš€ Servidor rodando em http://localhost:3333');
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map