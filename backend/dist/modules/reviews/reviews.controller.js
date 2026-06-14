"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewHandler = createReviewHandler;
exports.listGrillmasterReviewsHandler = listGrillmasterReviewsHandler;
exports.listBoutiqueReviewsHandler = listBoutiqueReviewsHandler;
exports.createCustomerReviewHandler = createCustomerReviewHandler;
const reviews_service_1 = require("./reviews.service");
async function createReviewHandler(req, reply) {
    try {
        const customerId = req.user.id;
        const { orderId, grillRating, boutiqueRating, grillComment, boutiqueComment, photos } = req.body;
        const review = await (0, reviews_service_1.createReview)({ orderId, customerId, grillRating, boutiqueRating, grillComment, boutiqueComment, photos });
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
        const { orderId, customerRating, customerComment } = req.body;
        const review = await (0, reviews_service_1.createCustomerReview)({ orderId, grillmasterUserId, customerRating, customerComment });
        return reply.status(201).send(review);
    }
    catch (err) {
        return reply.status(400).send({ error: err.message });
    }
}
//# sourceMappingURL=reviews.controller.js.map