"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContractHandler = generateContractHandler;
exports.acceptContractHandler = acceptContractHandler;
exports.getMyContractsHandler = getMyContractsHandler;
exports.getAllContractsHandler = getAllContractsHandler;
exports.getContractByIdHandler = getContractByIdHandler;
const contracts_service_1 = require("./contracts.service");
async function generateContractHandler(req, reply) {
    try {
        const userId = req.user.id;
        const data = contracts_service_1.generateContractSchema.parse(req.body);
        const contract = await (0, contracts_service_1.generateContract)(userId, data);
        return reply.status(201).send(contract);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function acceptContractHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const ip = req.headers['x-forwarded-for'] || req.ip || '';
        const ua = req.headers['user-agent'] || '';
        const contract = await (0, contracts_service_1.acceptContract)(id, userId, ip, ua);
        return reply.send(contract);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getMyContractsHandler(req, reply) {
    try {
        const userId = req.user.id;
        const contracts = await (0, contracts_service_1.getMyContracts)(userId);
        return reply.send(contracts);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getAllContractsHandler(req, reply) {
    try {
        const user = req.user;
        if (user.role !== 'ADMIN')
            return reply.status(403).send({ error: 'Acesso negado' });
        const contracts = await (0, contracts_service_1.getAllContracts)();
        return reply.send(contracts);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function getContractByIdHandler(req, reply) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const contract = await (0, contracts_service_1.getContractById)(id, userId);
        return reply.send(contract);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
//# sourceMappingURL=contracts.controller.js.map