"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = aiRoutes;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const supabase_js_1 = require("@supabase/supabase-js");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
// Rate limit: max 10 req/min por usuário
const suggestRateLimits = new Map();
const SYSTEM_PROMPT = `Você é a Tech Churras IA — especialista em churrasco brasileiro com 20 anos de experiência, chancelada por Jota Albuquerque (Jota Grillmaster).

REGRAS DE CÁLCULO DE QUANTIDADE:
- Homens adultos: 400g de carne por pessoa
- Mulheres adultas: 300g por pessoa
- Crianças: 150g por pessoa

MENUS EXCLUSIVOS TECH CHURRAS:

MENU TECH CHURRAS (menu_tech_churras)
O clássico reinventado. Combina cortes tradicionais do churrasco paulista com variações mineiras (frango caipira, linguiça fina, milho verde), espetinhos (coração de frango, espetinho de alcatra) e misto a gosto. Distribuição: 40% bovino (picanha, fraldinha, costela), 25% suíno/linguiça, 20% frango, 15% acompanhamentos. Estilo acessível, quantidade farta.

PARRILLADA TECH CHURRAS (parrillada_tech_churras)
Tradição gaúcha com influência argentina. Cortes: asado de tira (costela fatiada), vacío (fraldinha argentina), entraña (fraldinha fina), chorizo artesanal, costela de boi no bafo. Método: brasa lenta, sal grosso, tempero mínimo. Distribuição: 60% bovino (costela, fraldinha, entraña), 25% embutido artesanal, 15% acompanhamentos (chimichurri, pão campeiro, mandioca).

ESPECIALIDADE JOTA GRILLMASTER (especialidade_jota)
A experiência premium chancelada pessoalmente por Jota Albuquerque. Cortes nobres: picanha wagyu, tomahawk, T-bone, baby-beef, contra-filé maturado. Acompanhamentos gourmet: arroz carreteiro, vinagrete especial, pão de alho artesanal, queijo coalho gourmet. Distribuição: 70% bovino premium, 15% suíno premium, 15% acompanhamentos gourmet. Preços referenciais: Wagyu R$200/kg, Tomahawk R$150/kg, T-bone R$120/kg.

PREÇOS MÉDIOS SP 2026: Picanha R$90/kg, Costela R$46/kg, Fraldinha R$65/kg, Frango R$19/kg, Linguiça R$33/kg, Pão de alho R$13/un, Queijo coalho R$25/kg, Carvão R$30/5kg, Sal grosso R$9/kg, Wagyu R$200/kg, Tomahawk R$150/kg, T-bone R$120/kg

SEÇÃO "COMO É FEITO" (howItsMade):
Selecione 2-3 itens "estrela" do menu escolhido (os mais característicos e diferenciados) e descreva como são tradicionalmente preparados.
- Itens sugeridos por menu: menu_tech_churras → picanha, linguiça toscana, pão de alho; parrillada_tech_churras → asado de tira, chimichurri, provoleta; especialidade_jota → picanha wagyu, tomahawk, costela maturada
- "origin": origem/tradição em 2-4 palavras (ex: "Tradição gaúcha", "Parrilla argentina", "Churrasco uruguaio", "Especialidade Jota")
- "description": 2-3 frases em tom EDUCATIVO e CONVIDATIVO. Descreva a técnica de cocção, tempero típico e contexto cultural. Use linguagem como "Tradicionalmente...", "Na culinária X, esse corte costuma ser...", "É assim que esse prato ganhou fama...". NUNCA use "No seu evento faremos..." ou promessas de execução específica.
- Máximo 50 palavras por description

REGRAS ESTRITAS DO JSON:
- "category": EXATAMENTE um de: CARNE, ACOMPANHAMENTO, SAL_TEMPERO, CARVAO, BEBIDA, OUTRO
- "priority": EXATAMENTE um de: essencial, recomendado, opcional
- "unit": EXATAMENTE um de: kg, un, g, L
- "items": MÁXIMO 8 itens (apenas os mais importantes)
- "reason": máximo 6 palavras por item
- "tips": exatamente 3 dicas, cada uma com máximo 10 palavras
- "schedule": máximo 20 palavras
- "intro": máximo 25 palavras
- "howItsMade": exatamente 2-3 objetos
- Responda SOMENTE com JSON válido, SEM markdown, SEM backticks, SEM qualquer texto fora do JSON

Schema exato (copie estrutura):
{"intro":"string","totalKg":0,"estimatedCost":0,"items":[{"category":"CARNE","name":"string","quantity":0,"unit":"kg","reason":"string","estimatedPrice":0,"priority":"essencial"}],"tips":["string"],"schedule":"string","howItsMade":[{"name":"string","origin":"string","description":"string"}]}`;
// Normaliza category e priority para os enums esperados pelo frontend
function normalizeItem(item) {
    const catMap = {
        carnes: 'CARNE', carne: 'CARNE',
        acompanhamentos: 'ACOMPANHAMENTO', acompanhamento: 'ACOMPANHAMENTO',
        'temperos e insumos': 'SAL_TEMPERO', temperos: 'SAL_TEMPERO', sal: 'SAL_TEMPERO',
        carvao: 'CARVAO', carvão: 'CARVAO',
        bebidas: 'BEBIDA', bebida: 'BEBIDA',
    };
    const prioMap = {
        alta: 'essencial', alto: 'essencial', high: 'essencial',
        media: 'recomendado', média: 'recomendado', medium: 'recomendado', médio: 'recomendado', medio: 'recomendado',
        baixa: 'opcional', baixo: 'opcional', low: 'opcional',
    };
    const cat = String(item.category ?? '').toLowerCase();
    const prio = String(item.priority ?? '').toLowerCase();
    return {
        ...item,
        category: catMap[cat] ?? item.category ?? 'OUTRO',
        priority: prioMap[prio] ?? item.priority ?? 'recomendado',
    };
}
async function aiRoutes(app) {
    const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    app.post('/ai/plan-event', { preHandler: [auth_middleware_1.authenticate] }, async (request, reply) => {
        const { style = 'tradicional', homens = 5, mulheres = 3, criancas = 0, restrictions = '', hours = 4, } = request.body;
        const totalPessoas = Number(homens) + Number(mulheres) + Number(criancas);
        if (totalPessoas < 1)
            return reply.status(400).send({ error: 'Informe pelo menos 1 convidado' });
        const userPrompt = `Churrasco ${style}: ${homens}h ${mulheres}m ${criancas}c, ${hours}h.${restrictions ? ` Restrições: ${restrictions}.` : ''} Máximo 8 itens, respostas curtas. JSON puro.`;
        const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2500,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
        });
        const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';
        let plan;
        try {
            const cleaned = rawContent.replace(/^```json\s*/m, '').replace(/\s*```$/m, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            plan = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
        }
        catch {
            return reply.status(500).send({ error: 'Falha ao processar resposta da IA', raw: rawContent.slice(0, 500) });
        }
        // Normaliza arrays
        if (Array.isArray(plan.items)) {
            plan.items = plan.items.map(normalizeItem);
        }
        return reply.send({ plan, meta: { totalPessoas, style, hours } });
    });
    // ── POST /ai/suggest-product ─────────────────────────────────────────
    app.post('/ai/suggest-product', { preHandler: [auth_middleware_1.authenticate] }, async (request, reply) => {
        const userId = request.user?.userId;
        // Rate limiting
        const now = Date.now();
        const rl = suggestRateLimits.get(userId);
        if (rl && now < rl.resetAt) {
            if (rl.count >= 10)
                return reply.status(429).send({ error: 'Muitas requisições. Aguarde 1 minuto.' });
            rl.count++;
        }
        else {
            suggestRateLimits.set(userId, { count: 1, resetAt: now + 60000 });
        }
        try {
            const data = await request.file();
            if (!data)
                return reply.status(400).send({ error: 'Nenhuma imagem enviada' });
            const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
            if (!ALLOWED.includes(data.mimetype)) {
                return reply.status(400).send({ error: 'Formato inválido. Use JPG, PNG ou WebP.' });
            }
            const buffer = await data.toBuffer();
            if (buffer.byteLength > 5 * 1024 * 1024) {
                return reply.status(400).send({ error: 'Imagem muito grande. Máximo 5MB.' });
            }
            // Upload para Supabase (para usar como imageUrl do produto)
            let imageUrl;
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
            if (supabaseUrl && supabaseKey) {
                const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
                const ext = (data.filename?.split('.').pop() || 'jpg').toLowerCase();
                const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                const { error: uploadErr } = await supabase.storage
                    .from('partner-images')
                    .upload(fileName, buffer, { contentType: data.mimetype, upsert: false });
                if (!uploadErr) {
                    const { data: { publicUrl } } = supabase.storage.from('partner-images').getPublicUrl(fileName);
                    imageUrl = publicUrl;
                }
            }
            // Chama Claude Vision
            const base64 = buffer.toString('base64');
            const mediaType = data.mimetype;
            const message = await client.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 400,
                messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: { type: 'base64', media_type: mediaType, data: base64 },
                            },
                            {
                                type: 'text',
                                text: `Você é especialista em produtos de açougue brasileiro. Analise esta imagem e identifique o produto.
Responda SOMENTE com JSON válido, sem markdown, sem texto extra:
{"name":"nome comercial do corte ou produto","category":"CARNE|SAL_TEMPERO|CARVAO|ACOMPANHAMENTO|BEBIDA|OUTRO","description":"descrição comercial curta e atrativa em 1-2 frases","suggestedUnit":"kg|un|L","confidence":"alta|media|baixa"}
Regras:
- name: nome popular brasileiro (ex: Picanha, Fraldinha, Linguiça Artesanal)
- category: use EXATAMENTE um dos valores listados
- description: focada em venda, mencionando características do produto
- Se não reconhecer com confiança, retorne campos name/description vazios mas mantenha JSON válido`,
                            }
                        ],
                    }],
            });
            const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
            const defaults = { name: '', category: 'CARNE', description: '', suggestedUnit: 'kg', confidence: 'baixa' };
            try {
                const cleaned = rawText.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                const match = cleaned.match(/\{[\s\S]*\}/);
                const parsed = match ? JSON.parse(match[0]) : {};
                return reply.send({ ...defaults, ...parsed, imageUrl });
            }
            catch {
                return reply.send({ ...defaults, imageUrl });
            }
        }
        catch (err) {
            return reply.status(500).send({ error: 'Falha ao analisar imagem', details: err.message });
        }
    });
}
//# sourceMappingURL=ai.routes.js.map