import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, ProviderResponse } from "./provider-factory.js";

export class GeminiProvider implements AIProvider {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async complete(prompt: string, model: string): Promise<ProviderResponse> {
        const genModel = this.genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });

        const result = await genModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            text: text,
            tokensUsed: 0, // Gemini SDK doesn't return usage directly in this simple call easily without more complex metadata extraction
            model: model || 'gemini-1.5-flash',
        };
    }
}
