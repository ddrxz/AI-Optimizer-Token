import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
    role: string;
    content: string;
}

export class ContextOptimizer {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async optimize(messages: Message[]): Promise<Message[]> {
        // If history is short, no need to compress
        if (messages.length <= 5) {
            return messages;
        }

        // Keep the last 3 messages fully intact to preserve immediate flow
        const recentMessages = messages.slice(-3);

        // Messages to be summarized (everything before the last 3)
        const olderMessages = messages.slice(0, -3);

        // Format older messages for summarization
        const conversationText = olderMessages.map(m => `${m.role}: ${m.content}`).join("\n");

        try {
            const summaryPrompt = `
            Summarize the following conversation history into a concise context paragraph. 
            Capture key decisions, user goals, and important entities. 
            Ignore filler words.
            
            Conversation:
            ${conversationText}
            `;

            const result = await this.model.generateContent(summaryPrompt);
            const response = await result.response;
            const summary = response.text();

            // Create a new system message with the summary
            const summaryMessage: Message = {
                role: 'system',
                content: `[Previous Context Summary]: ${summary}`
            };

            // Return optimized history: Summary + Recent Messages
            return [summaryMessage, ...recentMessages];

        } catch (error) {
            console.error("Context optimization failed, returning original messages:", error);
            return messages; // Fallback to original if summarization fails
        }
    }
}
