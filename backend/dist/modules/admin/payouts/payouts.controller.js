"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPayoutsHandler = listPayoutsHandler;
exports.getPayoutsSummaryHandler = getPayoutsSummaryHandler;
exports.generatePayoutsHandler = generatePayoutsHandler;
exports.markPayoutPaidHandler = markPayoutPaidHandler;
const payouts_service_1 = require("./payouts.service");
async function listPayoutsHandler(req, reply) {
    const { status, weekStart, type } = req.query;
    const result = await (0, payouts_service_1.listPayouts)(status, weekStart, type);
    return reply.send(result);
}
async function getPayoutsSummaryHandler(req, reply) {
    const result = await (0, payouts_service_1.getPayoutsSummary)();
    return reply.send(result);
}
async function generatePayoutsHandler(req, reply) {
    const result = await (0, payouts_service_1.generatePayouts)();
    return reply.status(201).send(result);
}
async function markPayoutPaidHandler(req, reply) {
    const { id } = req.params;
    const result = await (0, payouts_service_1.markPayoutPaid)(id);
    return reply.send(result);
}
//# sourceMappingURL=payouts.controller.js.map