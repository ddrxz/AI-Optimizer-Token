import { pipeline } from '@xenova/transformers';

export class EmbeddingService {
    private extractor: any = null;

    async init() {
        if (!this.extractor) {
            this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.extractor) {
            await this.init();
        }

        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    calculateSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
}
