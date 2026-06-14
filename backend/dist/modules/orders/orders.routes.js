"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRoutes = ordersRoutes;
const orders_controller_1 = require("./orders.controller");
async function ordersRoutes(app) {
    app.post('/orders', { preHandler: [app.authenticate] }, orders_controller_1.createOrderHandler);
    app.get('/orders', { preHandler: [app.authenticate] }, orders_controller_1.listOrdersHandler);
    app.get('/orders/:id', { preHandler: [app.authenticate] }, orders_controller_1.getOrderHandler);
    app.patch('/orders/:id/status', { preHandler: [app.authenticate] }, orders_controller_1.updateOrderStatusHandler);
    app.patch('/orders/:id/status-detail', { preHandler: [app.authenticate] }, orders_controller_1.updateStatusDetailHandler);
    app.patch('/orders/:id/location', { preHandler: [app.authenticate] }, orders_controller_1.updateLocationHandler);
    app.patch('/orders/:id/cancel', { preHandler: [app.authenticate] }, orders_controller_1.cancelOrderHandler);
    app.get('/orders/:id/repeat-data', { preHandler: [app.authenticate] }, orders_controller_1.getRepeatDataHandler);
    app.post('/orders/:id/share', { preHandler: [app.authenticate] }, orders_controller_1.shareOrderHandler);
}
//# sourceMappingURL=orders.routes.js.map