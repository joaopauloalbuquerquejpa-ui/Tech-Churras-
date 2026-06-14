"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsRoutes = reviewsRoutes;
const supabase_js_1 = require("@supabase/supabase-js");
const reviews_controller_1 = require("./reviews.controller");
async function reviewsRoutes(app) {
    app.post('/reviews', { preHandler: [app.authenticate] }, reviews_controller_1.createReviewHandler);
    app.post('/reviews/customer', { preHandler: [app.authenticate] }, reviews_controller_1.createCustomerReviewHandler);
    app.get('/reviews/grillmaster/:id', reviews_controller_1.listGrillmasterReviewsHandler);
    app.get('/reviews/boutique/:id', reviews_controller_1.listBoutiqueReviewsHandler);
    app.post('/reviews/upload-photo', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const data = await req.file();
            if (!data)
                return reply.status(400).send({ error: 'Nenhum arquivo enviado' });
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
            if (!supabaseUrl || !supabaseKey) {
                return reply.status(500).send({ error: 'Supabase nao configurado' });
            }
            const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
            const buffer = await data.toBuffer();
            const ext = data.filename.split('.').pop() || 'jpg';
            const fileName = `review-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabase.storage
                .from('review-photos')
                .upload(fileName, buffer, { contentType: data.mimetype, upsert: false });
            if (error)
                return reply.status(500).send({ error: error.message });
            const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(fileName);
            return reply.send({ url: publicUrl });
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
}
//# sourceMappingURL=reviews.routes.js.map