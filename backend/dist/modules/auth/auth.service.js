"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.markOnboardingCompleted = markOnboardingCompleted;
const prisma_1 = require("../../config/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['CUSTOMER', 'GRILLMASTER', 'BOUTIQUE']).default('CUSTOMER'),
    referralCode: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
async function registerUser(data) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
    if (existing)
        throw new Error('Email já cadastrado');
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
    let referredByBoutiqueId;
    if (data.referralCode) {
        const boutique = await prisma_1.prisma.boutique.findUnique({ where: { referralCode: data.referralCode.toUpperCase() } });
        if (boutique)
            referredByBoutiqueId = boutique.id;
    }
    const user = await prisma_1.prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            role: data.role,
            referredByBoutiqueId,
        },
        select: { id: true, name: true, email: true, role: true, onboardingCompleted: true, createdAt: true },
    });
    if (referredByBoutiqueId) {
        const couponCode = 'BEMVINDO-' + user.id.slice(0, 6).toUpperCase();
        await prisma_1.prisma.coupon.create({
            data: { code: couponCode, discountType: 'PERCENT', discountValue: 15, maxUses: 1, active: true },
        }).catch(() => { });
    }
    return user;
}
async function loginUser(data) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (!user) {
        throw new Error('Credenciais inválidas');
    }
    const validPassword = await bcryptjs_1.default.compare(data.password, user.password);
    if (!validPassword) {
        throw new Error('Credenciais inválidas');
    }
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
    };
}
async function markOnboardingCompleted(userId) {
    return prisma_1.prisma.user.update({ where: { id: userId }, data: { onboardingCompleted: true } });
}
//# sourceMappingURL=auth.service.js.map