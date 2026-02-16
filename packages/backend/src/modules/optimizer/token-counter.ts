import { encoding_for_model, TiktokenModel, get_encoding } from "tiktoken";

export class TokenCounter {
    private encodings: Map<string, any> = new Map();

    private getEncodingForModel(model: string) {
        if (this.encodings.has(model)) {
            return this.encodings.get(model);
        }

        let encoding;
        try {
            // Try to get encoding for specific model
            encoding = encoding_for_model(model as TiktokenModel);
        } catch (e) {
            // Fallback based on model family or default to cl100k_base (GPT-4 standard)
            if (model.includes("gpt-4o")) {
                encoding = get_encoding("o200k_base");
            } else {
                encoding = get_encoding("cl100k_base");
            }
        }

        this.encodings.set(model, encoding);
        return encoding;
    }

    countTokens(text: string, model: string = "gpt-4"): number {
        if (!text) return 0;
        const encoding = this.getEncodingForModel(model);
        const tokens = encoding.encode(text);
        // We don't free the encoding here to reuse it, as creating it is expensive.
        // In a long-running process, we might want to clear this cache occasionally if many models are used.
        return tokens.length;
    }

    calculateSavings(original: string, optimized: string, model: string = "gpt-4") {
        const originalCount = this.countTokens(original, model);
        const optimizedCount = this.countTokens(optimized, model);
        const saved = Math.max(0, originalCount - optimizedCount);
        const percentage = originalCount > 0 ? (saved / originalCount) * 100 : 0;

        return {
            originalTokens: originalCount,
            optimizedTokens: optimizedCount,
            savedTokens: saved,
            savingsPercentage: parseFloat(percentage.toFixed(2))
        };
    }
}
