"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersHandler = listUsersHandler;
exports.blockUserHandler = blockUserHandler;
exports.listGrillmastersHandler = listGrillmastersHandler;
exports.listPendingGrillmastersHandler = listPendingGrillmastersHandler;
exports.approveGrillmasterHandler = approveGrillmasterHandler;
exports.rejectGrillmasterHandler = rejectGrillmasterHandler;
exports.listPendingBoutiquesHandler = listPendingBoutiquesHandler;
exports.approveBoutiqueHandler = approveBoutiqueHandler;
exports.rejectBoutiqueHandler = rejectBoutiqueHandler;
exports.listAllOrdersHandler = listAllOrdersHandler;
exports.markOrderPaidHandler = markOrderPaidHandler;
exports.getDashboardStatsHandler = getDashboardStatsHandler;
const admin_service_1 = require("./admin.service");
async function listUsersHandler(req, reply) {
    try {
        return reply.send(await (0, admin_service_1.listUsers)());
    }
    catch (err) {
        return reply.status(500).send({ error: err.message });
    }
}
async function blockUserHandler(req, reply) {
    try {
        const { userId } = req.params;
        return reply.send(await (0, admin_service_1.blockUser)(userId));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function listGrillmastersHandler(req, reply) {
    try {
        return reply.send(await (0, admin_service_1.listGrillmasters)());
    }
    catch (err) {
        return reply.status(500).send({ error: err.message });
    }
}
async function listPendingGrillmastersHandler(req, reply) {
    try {
        return reply.send(await (0, admin_service_1.listPendingGrillmasters)());
    }
    catch (err) {
        return reply.status(500).send({ error: err.message });
    }
}
async function approveGrillmasterHandler(req, reply) {
    try {
        const { grillmasterId } = req.params;
        const { isChancelado, pricePerHour } = req.body || {};
        return reply.send(await (0, admin_service_1.approveGrillmaster)(grillmasterId, { isChancelado, pricePerHour }));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function rejectGrillmasterHandler(req, reply) {
    try {
        const { grillmasterId } = req.params;
        return reply.send(await (0, admin_service_1.rejectGrillmaster)(grillmasterId));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function listPendingBoutiquesHandler(req, reply) {
    try {
        return reply.send(await (0, admin_service_1.listPendingBoutiques)());
    }
    catch (err) {
        return reply.status(500).send({ error: err.message });
    }
}
async function approveBoutiqueHandler(req, reply) {
    try {
        const { boutiqueId } = req.params;
        return reply.send(await (0, admin_service_1.approveBoutique)(boutiqueId));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function rejectBoutiqueHandler(req, reply) {
    try {
        const { boutiqueId } = req.params;
        return reply.send(await (0, admin_service_1.rejectBoutique)(boutiqueId));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function listAllOrdersHandler(req, reply) {
    try {
        return reply.send(await (0, admin_service_1.listAllOrders)());
    }
    catch (err) {
        return reply.status(500).send({ error: err.message });
    }
}
async function markOrderPaidHandler(req, reply) {
    try {
        const { orderId } = req.params;
        return reply.send(await (0, admin_service_1.markOrderPaid)(orderId));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getDashboardStatsHandler(req, reply) {
    try {
        return reply.send(await (0, admin_service_1.getDashboardStats)());
    }
    catch (err) {
        return reply.status(500).send({ error: err.message });
    }
}
//# sourceMappingURL=admin.controller.js.map