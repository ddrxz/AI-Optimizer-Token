import Fastify from 'fastify';
import cors from '@fastify/cors';
import { AIGateway } from './modules/gateway.js';
import { SemanticCache } from './modules/cache/semantic-cache.js';
import { EmbeddingService } from './modules/cache/embedding-service.js';
import { RoutingEngine } from './modules/router/routing-engine.js';
import { ProviderFactory, OpenAIProvider } from './modules/providers/provider-factory.js';
import { GeminiProvider } from './modules/providers/gemini-provider.js';
import { db, auditLogs, prompts } from '@ai-gateway/database';

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../../../.env');
console.log(`[DEBUG] Attempting to load .env from: ${envPath}`);
config({ path: envPath }); // Load .env from project root relative to this file
console.log(`[DEBUG] API Keys - OpenAI: ${process.env.OPENAI_API_KEY ? 'Found' : 'Missing'}, Gemini: ${process.env.GEMINI_API_KEY ? 'Found' : 'Missing'}`);

const fastify = Fastify({ logger: true });

const start = async () => {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Initialize Modules
    const embeddingService = new EmbeddingService();
    await embeddingService.init(); // Load local model
    const cache = new SemanticCache(embeddingService);
    const router = new RoutingEngine();
    const providerFactory = new ProviderFactory();

    if (openaiKey) {
        providerFactory.register('openai', new OpenAIProvider(openaiKey));
    }

    if (geminiKey) {
        providerFactory.register('gemini', new GeminiProvider(geminiKey));
    }

    if (!openaiKey && !geminiKey) {
        fastify.log.warn('No API keys found. Completions will fail but cache will work.');
    }

    const gateway = new AIGateway(cache, router, providerFactory, geminiKey);

    await fastify.register(cors);

    fastify.post('/proxy', async (request, reply) => {
        const { prompt } = request.body as { prompt: string };
        if (!prompt) return reply.status(400).send({ error: 'Prompt is required' });

        try {
            const result = await gateway.processPrompt(prompt);
            return result;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ error: error.message });
        }
    });

    // OpenAI-compatible endpoint for IDE integration
    fastify.post('/v1/chat/completions', async (request, reply) => {
        const body = request.body as any;

        // Extract the messages array
        const messages = body.messages || [];

        if (messages.length === 0) {
            return reply.status(400).send({
                error: { message: 'No messages found in request', type: 'invalid_request_error' }
            });
        }

        try {
            // Use the new processChat for full conversation optimization
            const result = await gateway.processChat(messages);

            // Transform to OpenAI format
            return {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: (result as any).model || body.model || 'gpt-4',
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: result.response
                    },
                    finish_reason: 'stop'
                }],
                usage: {
                    prompt_tokens: Math.ceil(messages[messages.length - 1].content.length / 4),
                    completion_tokens: Math.ceil(result.response.length / 4),
                    total_tokens: Math.ceil((messages[messages.length - 1].content.length + result.response.length) / 4)
                },
                // Custom metadata for debugging
                _gateway_metadata: {
                    source: result.source,
                    model: result.model,
                    similarity: result.similarity,
                    tier: (result as any).tier,
                    optimization: (result as any).optimization
                }
            };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: { message: error.message, type: 'api_error' }
            });
        }
    });

    fastify.get('/stats', async () => {
        const logs = await db.select().from(auditLogs).limit(100); // Increased limit for better trends

        let totalCacheHits = 0;
        let totalTokensSaved = 0;
        const activityMap: Record<string, number> = {};

        logs.forEach(log => {
            if (log.cacheHit) totalCacheHits++;
            totalTokensSaved += (log.tokensSaved || 0);

            // Group by hour for Activity Trends
            if (log.timestamp) {
                const date = new Date(log.timestamp);
                const hourKey = date.toISOString().slice(0, 13); // "2023-10-27T10"
                activityMap[hourKey] = (activityMap[hourKey] || 0) + 1;
            }
        });

        // Convert activityMap to array
        const activityTrends = Object.entries(activityMap)
            .map(([time, count]) => ({ time: `${time}:00:00.000Z`, count }))
            .sort((a, b) => a.time.localeCompare(b.time));

        // Calculate Money Saved (Avg $2.50 / 1M tokens blend price)
        const moneySaved = (totalTokensSaved / 1000000) * 2.50;

        // Get unique prompts count
        const allPrompts = await db.select().from(prompts);

        return {
            totalPrompts: logs.length,
            cacheHits: totalCacheHits,
            totalTokensSaved: totalTokensSaved,
            moneySaved: moneySaved, // New metric
            activityTrends: activityTrends, // New metric
            uniquePrompts: allPrompts.length,
            recentLogs: logs.slice(-10).reverse()
        };
    });

    try {
        const port = Number(process.env.PORT) || 4000;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Gateway listening on port ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
