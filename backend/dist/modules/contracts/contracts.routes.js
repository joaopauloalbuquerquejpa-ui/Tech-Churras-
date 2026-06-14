"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractsRoutes = contractsRoutes;
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const contracts_controller_1 = require("./contracts.controller");
async function contractsRoutes(app) {
    app.post('/contracts/generate', { preHandler: [auth_middleware_1.authenticate] }, contracts_controller_1.generateContractHandler);
    app.post('/contracts/:id/accept', { preHandler: [auth_middleware_1.authenticate] }, contracts_controller_1.acceptContractHandler);
    app.get('/contracts/my', { preHandler: [auth_middleware_1.authenticate] }, contracts_controller_1.getMyContractsHandler);
    app.get('/contracts/all', { preHandler: [auth_middleware_1.authenticate] }, contracts_controller_1.getAllContractsHandler);
    app.get('/contracts/:id', { preHandler: [auth_middleware_1.authenticate] }, contracts_controller_1.getContractByIdHandler);
}
//# sourceMappingURL=contracts.routes.js.map