"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAddresses = listAddresses;
exports.createAddress = createAddress;
exports.updateAddress = updateAddress;
exports.deleteAddress = deleteAddress;
exports.setDefaultAddress = setDefaultAddress;
const prisma_1 = require("../../config/prisma");
async function listAddresses(userId) {
    return prisma_1.prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
}
async function createAddress(userId, data) {
    if (data.isDefault) {
        await prisma_1.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const isFirst = (await prisma_1.prisma.address.count({ where: { userId } })) === 0;
    return prisma_1.prisma.address.create({
        data: { ...data, userId, isDefault: data.isDefault ?? isFirst },
    });
}
async function updateAddress(id, userId, data) {
    const addr = await prisma_1.prisma.address.findFirst({ where: { id, userId } });
    if (!addr)
        throw new Error('Endereco nao encontrado');
    return prisma_1.prisma.address.update({ where: { id }, data });
}
async function deleteAddress(id, userId) {
    const addr = await prisma_1.prisma.address.findFirst({ where: { id, userId } });
    if (!addr)
        throw new Error('Endereco nao encontrado');
    await prisma_1.prisma.address.delete({ where: { id } });
    if (addr.isDefault) {
        const next = await prisma_1.prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
        if (next)
            await prisma_1.prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
}
async function setDefaultAddress(id, userId) {
    const addr = await prisma_1.prisma.address.findFirst({ where: { id, userId } });
    if (!addr)
        throw new Error('Endereco nao encontrado');
    await prisma_1.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return prisma_1.prisma.address.update({ where: { id }, data: { isDefault: true } });
}
//# sourceMappingURL=addresses.service.js.map