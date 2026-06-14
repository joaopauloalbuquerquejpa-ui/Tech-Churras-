"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderHandler = createOrderHandler;
exports.listOrdersHandler = listOrdersHandler;
exports.getOrderHandler = getOrderHandler;
exports.updateStatusDetailHandler = updateStatusDetailHandler;
exports.updateOrderStatusHandler = updateOrderStatusHandler;
exports.updateLocationHandler = updateLocationHandler;
exports.cancelOrderHandler = cancelOrderHandler;
exports.getRepeatDataHandler = getRepeatDataHandler;
exports.getOrderByPublicTokenHandler = getOrderByPublicTokenHandler;
exports.shareOrderHandler = shareOrderHandler;
const orders_service_1 = require("./orders.service");
async function createOrderHandler(req, reply) {
    try {
        const customerId = req.user.id;
        const data = orders_service_1.createOrderSchema.parse(req.body);
        const order = await (0, orders_service_1.createOrder)(customerId, data);
        return reply.status(201).send(order);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function listOrdersHandler(req, reply) {
    try {
        const customerId = req.user.id;
        const orders = await (0, orders_service_1.listOrders)(customerId);
        return reply.send(orders);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getOrderHandler(req, reply) {
    try {
        const userId = req.user.id;
        const role = req.user.role ?? 'CUSTOMER';
        const { id } = req.params;
        const order = await (0, orders_service_1.getOrderById)(id, userId, role);
        return reply.send(order);
    }
    catch (err) {
        return reply.status(404).send({ error: err.message });
    }
}
async function updateStatusDetailHandler(req, reply) {
    try {
        const userId = req.user.id;
        const role = req.user.role ?? 'CUSTOMER';
        const { id } = req.params;
        const { statusDetail } = req.body;
        const order = await (0, orders_service_1.updateOrderStatusDetail)(id, statusDetail, userId, role);
        return reply.send(order);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function updateOrderStatusHandler(req, reply) {
    try {
        const userId = req.user.id;
        const role = req.user.role ?? 'CUSTOMER';
        const { id } = req.params;
        const { status } = req.body;
        const order = await (0, orders_service_1.updateOrderStatus)(id, status, userId, role);
        return reply.send(order);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function updateLocationHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { lat, lng } = req.body;
        const result = await (0, orders_service_1.updateOrderLocation)(id, lat, lng, userId);
        return reply.send(result);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function cancelOrderHandler(req, reply) {
    try {
        const userId = req.user.id;
        const role = req.user.role ?? 'CUSTOMER';
        const { id } = req.params;
        const { reason } = req.body ?? {};
        const order = await (0, orders_service_1.cancelOrder)(id, userId, role, reason ?? '');
        return reply.send(order);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getRepeatDataHandler(req, reply) {
    try {
        const userId = req.user.id;
        const role = req.user.role ?? 'CUSTOMER';
        const { id } = req.params;
        const data = await (0, orders_service_1.getRepeatData)(id, userId, role);
        return reply.send(data);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getOrderByPublicTokenHandler(req, reply) {
    try {
        const { token } = req.params;
        const data = await (0, orders_service_1.getOrderByPublicToken)(token);
        return reply.send(data);
    }
    catch (err) {
        return reply.status(404).send({ error: err.message });
    }
}
async function shareOrderHandler(req, reply) {
    try {
        const userId = req.user.id;
        const role = req.user.role ?? 'CUSTOMER';
        const { id } = req.params;
        const data = await (0, orders_service_1.generateShareToken)(id, userId, role);
        return reply.send(data);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
//# sourceMappingURL=orders.controller.js.map