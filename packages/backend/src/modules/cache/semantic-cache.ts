import { db, prompts, responses } from '@ai-gateway/database';
import { eq } from 'drizzle-orm';
import { EmbeddingService } from './embedding-service.js';
import { v4 as uuidv4 } from 'uuid';

export interface CacheOptions {
    similarityThreshold: number;
}

export type MatchTier = 'exact' | 'high' | 'fuzzy' | 'none';

export interface CacheResult {
    response: string;
    similarity: number;
    tier: MatchTier;
}

export class SemanticCache {
    constructor(
        private embeddingService: EmbeddingService,
        private options: CacheOptions = { similarityThreshold: 0.85 }
    ) { }

    async findSimilar(text: string): Promise<CacheResult | null> {
        const queryEmbedding = await this.embeddingService.generateEmbedding(text);
        const allPrompts = await db.select().from(prompts);

        let bestMatch = null;
        let maxSimilarity = -1;

        for (const p of allPrompts) {
            // Check for exact string match first (optimization)
            if (p.text === text) {
                bestMatch = p;
                maxSimilarity = 1.0;
                break;
            }

            const storedEmbedding = JSON.parse(p.embedding) as number[];
            const similarity = this.embeddingService.calculateSimilarity(queryEmbedding, storedEmbedding);

            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                bestMatch = p;
            }
        }

        if (bestMatch && maxSimilarity >= this.options.similarityThreshold) {
            const [cachedResponse] = await db
                .select()
                .from(responses)
                .where(eq(responses.promptId, bestMatch.id))
                .limit(1);

            if (!cachedResponse) return null;

            let tier: MatchTier = 'none';
            if (maxSimilarity === 1.0) tier = 'exact';
            else if (maxSimilarity >= 0.95) tier = 'high';
            else if (maxSimilarity >= 0.85) tier = 'fuzzy';

            return {
                response: cachedResponse.text,
                similarity: maxSimilarity,
                tier
            };
        }

        return null;
    }

    async save(text: string, response: string, metadata: { model: string; tokensUsed: number }) {
        const embedding = await this.embeddingService.generateEmbedding(text);
        const promptId = uuidv4();

        await db.insert(prompts).values({
            id: promptId,
            text,
            embedding: JSON.stringify(embedding),
            createdAt: new Date(),
        });

        await db.insert(responses).values({
            id: uuidv4(),
            promptId,
            text: response,
            model: metadata.model,
            tokensUsed: metadata.tokensUsed,
            createdAt: new Date(),
        });
    }
}
