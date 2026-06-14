"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGrillmasterHandler = createGrillmasterHandler;
exports.listGrillmastersHandler = listGrillmastersHandler;
exports.getGrillmasterHandler = getGrillmasterHandler;
exports.updateGrillmasterHandler = updateGrillmasterHandler;
exports.getMyOrdersHandler = getMyOrdersHandler;
exports.getScheduleHandler = getScheduleHandler;
exports.toggleScheduleHandler = toggleScheduleHandler;
exports.completeModuleHandler = completeModuleHandler;
exports.markUniformSentHandler = markUniformSentHandler;
const grillmasters_service_1 = require("./grillmasters.service");
async function createGrillmasterHandler(req, reply) {
    try {
        const userId = req.user.id;
        const data = grillmasters_service_1.createGrillmasterSchema.parse(req.body);
        const grillmaster = await (0, grillmasters_service_1.createGrillmaster)(userId, data);
        return reply.status(201).send(grillmaster);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function listGrillmastersHandler(req, reply) {
    try {
        const q = req.query;
        const result = await (0, grillmasters_service_1.listGrillmasters)({
            city: q.city || undefined,
            minPrice: q.minPrice ? Number(q.minPrice) : undefined,
            maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
            minRating: q.minRating ? Number(q.minRating) : undefined,
            specialty: q.specialty || undefined,
            sortBy: q.sortBy || undefined,
            available: q.available !== 'false',
            page: q.page ? Number(q.page) : 1,
            limit: q.limit ? Number(q.limit) : 9,
        });
        return reply.send(result);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getGrillmasterHandler(req, reply) {
    try {
        const { id } = req.params;
        const grillmaster = await (0, grillmasters_service_1.getGrillmasterById)(id);
        return reply.send(grillmaster);
    }
    catch (err) {
        return reply.status(404).send({ error: err.message });
    }
}
async function updateGrillmasterHandler(req, reply) {
    try {
        const userId = req.user.id;
        const data = grillmasters_service_1.createGrillmasterSchema.partial().parse(req.body);
        const grillmaster = await (0, grillmasters_service_1.updateGrillmaster)(userId, data);
        return reply.send(grillmaster);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getMyOrdersHandler(req, reply) {
    try {
        const userId = req.user.id;
        return reply.send(await (0, grillmasters_service_1.getMyGrillmasterOrders)(userId));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getScheduleHandler(req, reply) {
    try {
        const userId = req.user.id;
        return reply.send(await (0, grillmasters_service_1.getGrillmasterSchedule)(userId));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function toggleScheduleHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { date } = req.body;
        if (!date)
            return reply.status(400).send({ error: 'date required' });
        return reply.send(await (0, grillmasters_service_1.toggleScheduleDay)(userId, date));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function completeModuleHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { moduleId } = req.params;
        return reply.send(await (0, grillmasters_service_1.completeTrainingModule)(userId, Number(moduleId)));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function markUniformSentHandler(req, reply) {
    try {
        const { grillmasterId } = req.params;
        return reply.send(await (0, grillmasters_service_1.markUniformSent)(grillmasterId));
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
//# sourceMappingURL=grillmasters.controller.js.map