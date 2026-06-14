"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = uploadRoutes;
const supabase_js_1 = require("@supabase/supabase-js");
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
async function uploadRoutes(app) {
    app.post('/upload/image', { preHandler: [app.authenticate] }, async (req, reply) => {
        try {
            const data = await req.file();
            if (!data)
                return reply.status(400).send({ error: 'Nenhum arquivo enviado' });
            if (!ALLOWED_MIME.includes(data.mimetype)) {
                return reply.status(400).send({ error: 'Tipo de arquivo nao permitido. Use JPG, PNG ou WebP.' });
            }
            const buffer = await data.toBuffer();
            if (buffer.byteLength > MAX_SIZE) {
                return reply.status(400).send({ error: 'Arquivo muito grande. Maximo 5MB.' });
            }
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
            if (!supabaseUrl || !supabaseKey) {
                return reply.status(500).send({ error: 'Supabase nao configurado' });
            }
            const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
            const ext = data.filename.split('.').pop() || 'jpg';
            const fileName = `partner-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabase.storage
                .from('partner-images')
                .upload(fileName, buffer, { contentType: data.mimetype, upsert: false });
            if (error)
                return reply.status(500).send({ error: error.message });
            const { data: { publicUrl } } = supabase.storage.from('partner-images').getPublicUrl(fileName);
            return reply.send({ url: publicUrl });
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
}
//# sourceMappingURL=upload.routes.js.map