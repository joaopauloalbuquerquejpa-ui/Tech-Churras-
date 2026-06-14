"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductSchema = void 0;
exports.createProduct = createProduct;
exports.listProducts = listProducts;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.toggleProduct = toggleProduct;
const prisma_1 = require("../../config/prisma");
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    unit: zod_1.z.string().default('kg'),
    category: zod_1.z.enum(['CARNE', 'SAL_TEMPERO', 'CARVAO', 'ACOMPANHAMENTO', 'BEBIDA', 'OUTRO']).default('CARNE'),
    available: zod_1.z.boolean().default(true),
    stockQuantity: zod_1.z.number().int().min(0).nullable().optional(),
    imageUrl: zod_1.z.string().optional(),
    discountPercent: zod_1.z.number().min(0).max(100).nullable().optional(),
    discountValidUntil: zod_1.z.string().datetime({ offset: true }).nullable().optional(),
});
async function createProduct(userId, data) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Voce precisa ter um acougue cadastrado');
    return prisma_1.prisma.product.create({ data: { ...data, boutiqueId: boutique.id } });
}
async function listProducts(boutiqueId) {
    return prisma_1.prisma.product.findMany({
        where: { boutiqueId, available: true },
        orderBy: { name: 'asc' },
    });
}
async function updateProduct(id, userId, data) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    return prisma_1.prisma.product.update({ where: { id }, data });
}
async function deleteProduct(id, userId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    await prisma_1.prisma.product.delete({ where: { id } });
}
async function toggleProduct(id, userId) {
    const boutique = await prisma_1.prisma.boutique.findUnique({ where: { userId } });
    if (!boutique)
        throw new Error('Acougue nao encontrado');
    const product = await prisma_1.prisma.product.findUnique({ where: { id } });
    if (!product || product.boutiqueId !== boutique.id)
        throw new Error('Produto nao encontrado');
    return prisma_1.prisma.product.update({ where: { id }, data: { available: !product.available } });
}
//# sourceMappingURL=products.service.js.map