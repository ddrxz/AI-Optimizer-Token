export interface RoutingDecision {
    model: string;
    simplify: boolean;
    provider: 'openai' | 'anthropic' | 'gemini';
}

export class RoutingEngine {
    analyzeComplexity(text: string): RoutingDecision {
        const wordCount = text.trim().split(/\s+/).length;
        const isComplex = wordCount > 100 || /implement|architect|design|refactor/i.test(text);

        // If it's complex, we prefer a powerful model (OpenAI)
        // If simple, we prefer a fast/free model (Gemini)
        if (isComplex) {
            return {
                model: 'gpt-4o',
                provider: 'openai',
                simplify: false,
            };
        }

        return {
            model: 'gemini-3-flash-preview',
            provider: 'gemini',
            simplify: wordCount > 20,
        };
    }

    simplifyPrompt(text: string): string {
        // Basic heuristic: remove extra whitespace and truncate if very long
        // In a more advanced version, this could be a call to a tiny model
        return text
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 1000); // Caps for simplicity
    }
}
