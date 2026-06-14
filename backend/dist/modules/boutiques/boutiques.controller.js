"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoutiqueHandler = createBoutiqueHandler;
exports.listBoutiquesHandler = listBoutiquesHandler;
exports.getBoutiqueByIdHandler = getBoutiqueByIdHandler;
exports.getBoutiqueProductsHandler = getBoutiqueProductsHandler;
exports.getMyBoutiqueHandler = getMyBoutiqueHandler;
exports.updateBoutiqueHandler = updateBoutiqueHandler;
exports.getKitsByBoutiqueHandler = getKitsByBoutiqueHandler;
exports.createKitHandler = createKitHandler;
exports.updateKitHandler = updateKitHandler;
exports.deleteKitHandler = deleteKitHandler;
exports.createProductHandler = createProductHandler;
exports.updateProductHandler = updateProductHandler;
exports.deleteProductHandler = deleteProductHandler;
exports.toggleProductHandler = toggleProductHandler;
exports.getBoutiqueDashboardStatsHandler = getBoutiqueDashboardStatsHandler;
exports.getBoutiqueDemandForecastHandler = getBoutiqueDemandForecastHandler;
const boutiques_service_1 = require("./boutiques.service");
const products_service_1 = require("./products.service");
async function createBoutiqueHandler(req, reply) {
    try {
        const userId = req.user.id;
        const data = boutiques_service_1.createBoutiqueSchema.parse(req.body);
        const boutique = await (0, boutiques_service_1.createBoutique)(userId, data);
        return reply.status(201).send(boutique);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function listBoutiquesHandler(req, reply) {
    try {
        const q = req.query;
        const boutiques = await (0, boutiques_service_1.listBoutiques)({
            city: q.city || undefined,
            minRating: q.minRating ? Number(q.minRating) : undefined,
            sortBy: q.sortBy || undefined,
        });
        return reply.send(boutiques);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getBoutiqueByIdHandler(req, reply) {
    try {
        const { id } = req.params;
        const boutique = await (0, boutiques_service_1.getBoutiqueById)(id);
        return reply.send(boutique);
    }
    catch (err) {
        return reply.status(404).send({ error: err.message });
    }
}
async function getBoutiqueProductsHandler(req, reply) {
    try {
        const { id } = req.params;
        const boutique = await (0, boutiques_service_1.getBoutiqueById)(id);
        return reply.send(boutique.products);
    }
    catch (err) {
        return reply.status(404).send({ error: err.message });
    }
}
async function getMyBoutiqueHandler(req, reply) {
    try {
        const userId = req.user.id;
        const boutique = await (0, boutiques_service_1.getMyBoutique)(userId);
        return reply.send(boutique);
    }
    catch (err) {
        return reply.status(404).send({ error: err.message });
    }
}
async function updateBoutiqueHandler(req, reply) {
    try {
        const userId = req.user.id;
        const data = boutiques_service_1.updateBoutiqueSchema.parse(req.body);
        const boutique = await (0, boutiques_service_1.updateBoutique)(userId, data);
        return reply.send(boutique);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getKitsByBoutiqueHandler(req, reply) {
    try {
        const { id } = req.params;
        const kits = await (0, boutiques_service_1.getKitsByBoutique)(id);
        return reply.send(kits);
    }
    catch (err) {
        return reply.status(500).send({ error: err.message });
    }
}
async function createKitHandler(req, reply) {
    try {
        const userId = req.user.id;
        const data = boutiques_service_1.createKitSchema.parse(req.body);
        const kit = await (0, boutiques_service_1.createKit)(userId, data);
        return reply.status(201).send(kit);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function updateKitHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { kitId } = req.params;
        const data = boutiques_service_1.createKitSchema.partial().parse(req.body);
        const kit = await (0, boutiques_service_1.updateKit)(kitId, userId, data);
        return reply.send(kit);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function deleteKitHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { kitId } = req.params;
        await (0, boutiques_service_1.deleteKit)(kitId, userId);
        return reply.status(204).send();
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function createProductHandler(req, reply) {
    try {
        const userId = req.user.id;
        const data = products_service_1.createProductSchema.parse(req.body);
        const product = await (0, products_service_1.createProduct)(userId, data);
        return reply.status(201).send(product);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function updateProductHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const data = products_service_1.createProductSchema.partial().parse(req.body);
        const product = await (0, products_service_1.updateProduct)(productId, userId, data);
        return reply.send(product);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function deleteProductHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        await (0, products_service_1.deleteProduct)(productId, userId);
        return reply.status(204).send();
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function toggleProductHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const product = await (0, products_service_1.toggleProduct)(productId, userId);
        return reply.send(product);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getBoutiqueDashboardStatsHandler(req, reply) {
    try {
        const userId = req.user.id;
        const stats = await (0, boutiques_service_1.getBoutiqueDashboardStats)(userId);
        return reply.send(stats);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getBoutiqueDemandForecastHandler(req, reply) {
    try {
        const userId = req.user.id;
        const forecast = await (0, boutiques_service_1.getBoutiqueDemandForecast)(userId);
        return reply.send(forecast);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
//# sourceMappingURL=boutiques.controller.js.map