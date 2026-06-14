"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGrillmasterSchema = void 0;
exports.createGrillmaster = createGrillmaster;
exports.listGrillmasters = listGrillmasters;
exports.getGrillmasterById = getGrillmasterById;
exports.updateGrillmaster = updateGrillmaster;
exports.getMyGrillmasterOrders = getMyGrillmasterOrders;
exports.getGrillmasterSchedule = getGrillmasterSchedule;
exports.toggleScheduleDay = toggleScheduleDay;
exports.completeTrainingModule = completeTrainingModule;
exports.markUniformSent = markUniformSent;
const prisma_1 = require("../../config/prisma");
const zod_1 = require("zod");
exports.createGrillmasterSchema = zod_1.z.object({
    bio: zod_1.z.string().optional(),
    experience: zod_1.z.number().int().min(0).default(0),
    pricePerHour: zod_1.z.number().positive(),
    city: zod_1.z.string().min(2),
    state: zod_1.z.string().min(2),
    specialties: zod_1.z.string().optional(),
    available: zod_1.z.boolean().optional(),
    photoUrl: zod_1.z.string().optional(),
    galleryUrls: zod_1.z.array(zod_1.z.string()).optional(),
    instagram: zod_1.z.string().optional(),
    videoUrl: zod_1.z.string().optional(),
    churrascoStyle: zod_1.z.string().optional(),
    bringsEquipment: zod_1.z.boolean().optional(),
    minGuests: zod_1.z.number().int().optional(),
    maxGuests: zod_1.z.number().int().optional(),
});
async function createGrillmaster(userId, data) {
    const existing = await prisma_1.prisma.grillmaster.findUnique({ where: { userId } });
    if (existing)
        throw new Error('Perfil de churrasqueiro j� existe');
    return prisma_1.prisma.grillmaster.create({
        data: { userId, ...data },
        include: { user: { select: { name: true, email: true } } },
    });
}
async function listGrillmasters(params = {}) {
    const { city, minPrice, maxPrice, minRating, specialty, sortBy, available = true, page = 1, limit = 9 } = params;
    const where = {};
    if (available)
        where.available = true;
    if (city)
        where.city = { contains: city, mode: 'insensitive' };
    if (minPrice != null)
        where.pricePerHour = { ...where.pricePerHour, gte: minPrice };
    if (maxPrice != null)
        where.pricePerHour = { ...where.pricePerHour, lte: maxPrice };
    if (minRating != null)
        where.rating = { gte: minRating };
    if (specialty)
        where.specialties = { contains: specialty, mode: 'insensitive' };
    let orderBy = [{ rating: 'desc' }];
    if (sortBy === 'price_asc')
        orderBy = [{ pricePerHour: 'asc' }];
    else if (sortBy === 'price_desc')
        orderBy = [{ pricePerHour: 'desc' }];
    const skip = (page - 1) * limit;
    const [grillmasters, total] = await Promise.all([
        prisma_1.prisma.grillmaster.findMany({
            where,
            include: { user: { select: { name: true, email: true } } },
            orderBy,
            skip,
            take: limit,
        }),
        prisma_1.prisma.grillmaster.count({ where }),
    ]);
    return { grillmasters, total, page, limit, totalPages: Math.ceil(total / limit) };
}
async function getGrillmasterById(id) {
    const grillmaster = await prisma_1.prisma.grillmaster.findUnique({
        where: { id },
        include: { user: { select: { name: true, email: true } } },
    });
    if (!grillmaster)
        throw new Error('Churrasqueiro n�o encontrado');
    return grillmaster;
}
async function updateGrillmaster(userId, data) {
    return prisma_1.prisma.grillmaster.update({
        where: { userId },
        data,
    });
}
async function getMyGrillmasterOrders(userId) {
    const gm = await prisma_1.prisma.grillmaster.findUnique({ where: { userId } });
    if (!gm)
        throw new Error('Perfil de churrasqueiro nao encontrado');
    return {
        grillmaster: gm,
        orders: await prisma_1.prisma.order.findMany({
            where: { grillmasterId: gm.id },
            include: {
                customer: { select: { name: true, email: true } },
                boutique: { select: { name: true } },
                items: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
    };
}
async function getGrillmasterSchedule(userId) {
    const gm = await prisma_1.prisma.grillmaster.findUnique({ where: { userId } });
    if (!gm)
        throw new Error('Perfil de churrasqueiro nao encontrado');
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() + 60);
    return prisma_1.prisma.grillmasterSchedule.findMany({
        where: { grillmasterId: gm.id, date: { gte: from, lte: to } },
        orderBy: { date: 'asc' },
    });
}
async function toggleScheduleDay(userId, dateStr) {
    const gm = await prisma_1.prisma.grillmaster.findUnique({ where: { userId } });
    if (!gm)
        throw new Error('Perfil de churrasqueiro nao encontrado');
    const date = new Date(dateStr);
    date.setUTCHours(12, 0, 0, 0);
    const existing = await prisma_1.prisma.grillmasterSchedule.findUnique({
        where: { grillmasterId_date: { grillmasterId: gm.id, date } },
    });
    if (existing) {
        return prisma_1.prisma.grillmasterSchedule.update({
            where: { id: existing.id },
            data: { available: !existing.available },
        });
    }
    return prisma_1.prisma.grillmasterSchedule.create({
        data: { grillmasterId: gm.id, date, available: false },
    });
}
async function completeTrainingModule(userId, moduleId) {
    if (moduleId < 1 || moduleId > 4)
        throw new Error('Modulo invalido');
    const gm = await prisma_1.prisma.grillmaster.findUnique({ where: { userId } });
    if (!gm)
        throw new Error('Perfil de churrasqueiro nao encontrado');
    const modules = Array.from(new Set([...gm.trainingModules, moduleId])).sort();
    const allDone = [1, 2, 3, 4].every(m => modules.includes(m));
    const data = { trainingModules: modules };
    if (allDone && !gm.certifiedAt) {
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
        data.certificationCode = 'TC-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
        data.certifiedAt = new Date();
    }
    return prisma_1.prisma.grillmaster.update({ where: { userId }, data });
}
async function markUniformSent(grillmasterId) {
    return prisma_1.prisma.grillmaster.update({
        where: { id: grillmasterId },
        data: { uniformSent: true, uniformSentAt: new Date() },
    });
}
//# sourceMappingURL=grillmasters.service.js.map