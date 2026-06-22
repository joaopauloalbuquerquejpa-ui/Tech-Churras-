"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewHandler = createReviewHandler;
exports.listGrillmasterReviewsHandler = listGrillmasterReviewsHandler;
exports.listBoutiqueReviewsHandler = listBoutiqueReviewsHandler;
exports.createCustomerReviewHandler = createCustomerReviewHandler;
const zod_1 = require("zod");
const reviews_service_1 = require("./reviews.service");
const createReviewSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    grillRating: zod_1.z.number().int().min(1).max(5),
    boutiqueRating: zod_1.z.number().int().min(1).max(5).optional(),
    grillComment: zod_1.z.string().max(1000).optional(),
    boutiqueComment: zod_1.z.string().max(1000).optional(),
    photos: zod_1.z.array(zod_1.z.string().url()).optional(),
});
const createCustomerReviewSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    customerRating: zod_1.z.number().int().min(1).max(5),
    customerComment: zod_1.z.string().max(1000).optional(),
});
async function createReviewHandler(req, reply) {
    try {
        const customerId = req.user.id;
        const parsed = createReviewSchema.safeParse(req.body);
        if (!parsed.success)
            return reply.status(400).send({ error: parsed.error.issues[0].message });
        const review = await (0, reviews_service_1.createReview)({ ...parsed.data, customerId });
        return reply.status(201).send(review);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function listGrillmasterReviewsHandler(req, reply) {
    try {
        const { id } = req.params;
        const reviews = await (0, reviews_service_1.listGrillmasterReviews)(id);
        return reply.send(reviews);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function listBoutiqueReviewsHandler(req, reply) {
    try {
        const { id } = req.params;
        const reviews = await (0, reviews_service_1.listBoutiqueReviews)(id);
        return reply.send(reviews);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
async function createCustomerReviewHandler(req, reply) {
    try {
        const grillmasterUserId = req.user.id;
        const parsed = createCustomerReviewSchema.safeParse(req.body);
        if (!parsed.success)
            return reply.status(400).send({ error: parsed.error.issues[0].message });
        const review = await (0, reviews_service_1.createCustomerReview)({ ...parsed.data, grillmasterUserId });
        return reply.status(201).send(review);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
//# sourceMappingURL=reviews.controller.js.map