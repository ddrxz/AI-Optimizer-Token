import OpenAI from 'openai';

export interface ProviderResponse {
    text: string;
    tokensUsed: number;
    model: string;
}

export interface AIProvider {
    complete(prompt: string, model: string): Promise<ProviderResponse>;
}

export class OpenAIProvider implements AIProvider {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    async complete(prompt: string, model: string): Promise<ProviderResponse> {
        const response = await this.openai.chat.completions.create({
            model,
            messages: [{ role: 'user', content: prompt }],
        });

        return {
            text: response.choices[0].message.content || '',
            tokensUsed: response.usage?.total_tokens || 0,
            model,
        };
    }
}

export class ProviderFactory {
    private providers: Record<string, AIProvider> = {};

    register(name: string, provider: AIProvider) {
        this.providers[name] = provider;
    }

    getProvider(name: string): AIProvider {
        const provider = this.providers[name];
        if (!provider) throw new Error(`Provider ${name} not found`);
        return provider;
    }
}
