"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatorRoutes = calculatorRoutes;
const zod_1 = require("zod");
const prisma_1 = require("../../config/prisma");
const meatSuggestionSchema = zod_1.z.object({
    men: zod_1.z.number().int().min(0).default(0),
    women: zod_1.z.number().int().min(0).default(0),
    children: zod_1.z.number().int().min(0).default(0),
    boutiqueId: zod_1.z.string().optional(),
});
const BREAKDOWN_DEF = [
    { category: 'Carne Bovina Nobre', productCategory: 'CARNE', pct: 0.40, unit: 'kg' },
    { category: 'Porco e Linguiça', productCategory: 'CARNE', pct: 0.25, unit: 'kg' },
    { category: 'Frango', productCategory: 'CARNE', pct: 0.20, unit: 'kg' },
    { category: 'Acompanhamentos', productCategory: 'ACOMPANHAMENTO', pct: 0.15, unit: 'kg' },
];
async function calculatorRoutes(app) {
    app.post('/calculator/meat-suggestion', async (req, reply) => {
        const parsed = meatSuggestionSchema.safeParse(req.body);
        if (!parsed.success)
            return reply.code(400).send({ error: parsed.error.issues[0].message });
        const { men, women, children, boutiqueId } = parsed.data;
        const totalGrams = men * 400 + women * 300 + children * 150;
        const totalKg = +(totalGrams / 1000).toFixed(2);
        const totalPessoas = men + women + children;
        let productsByCategory = {};
        if (boutiqueId) {
            const products = await prisma_1.prisma.product.findMany({
                where: { boutiqueId, available: true },
            });
            for (const p of products) {
                if (!productsByCategory[p.category])
                    productsByCategory[p.category] = [];
                productsByCategory[p.category].push(p);
            }
        }
        const breakdown = BREAKDOWN_DEF.map(b => ({
            category: b.category,
            productCategory: b.productCategory,
            percentage: b.pct,
            kg: +(totalKg * b.pct).toFixed(2),
            unit: b.unit,
            suggestedProducts: (productsByCategory[b.productCategory] || []).slice(0, 4),
        }));
        return { totalKg, totalPessoas, breakdown };
    });
}
//# sourceMappingURL=calculator.routes.js.map