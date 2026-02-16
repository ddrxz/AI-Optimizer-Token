import { SemanticCache } from './cache/semantic-cache.js';
import { RoutingEngine } from './router/routing-engine.js';
import { ProviderFactory } from './providers/provider-factory.js';
import { PromptOptimizer } from './optimizer/prompt-optimizer.js';
import { TokenCounter } from './optimizer/token-counter.js';
import { ContextOptimizer } from './optimizer/context-optimizer.js';
import { PromptTemplates } from './optimizer/prompt-templates.js';
import { db, auditLogs } from '@ai-gateway/database';
import { v4 as uuidv4 } from 'uuid';

export class AIGateway {
    private promptOptimizer: PromptOptimizer;
    private tokenCounter: TokenCounter;
    private contextOptimizer: ContextOptimizer | null = null;

    constructor(
        private cache: SemanticCache,
        private router: RoutingEngine,
        private providers: ProviderFactory,
        geminiApiKey?: string
    ) {
        this.promptOptimizer = new PromptOptimizer();
        this.tokenCounter = new TokenCounter();
        if (geminiApiKey) {
            this.contextOptimizer = new ContextOptimizer(geminiApiKey);
        }
    }

    private resolveTemplates(prompt: string): string {
        if (prompt.startsWith('/explain')) {
            return PromptTemplates.optimize('codeExplain', { code: prompt.replace('/explain', '').trim() });
        }
        if (prompt.startsWith('/debug')) {
            const parts = prompt.replace('/debug', '').trim().split('\n');
            const error = parts[0];
            const code = parts.slice(1).join('\n');
            return PromptTemplates.optimize('debug', { error, code });
        }
        if (prompt.startsWith('/docs')) {
            return PromptTemplates.optimize('docs', { code: prompt.replace('/docs', '').trim() });
        }
        if (prompt.startsWith('/test')) {
            return PromptTemplates.optimize('test', { code: prompt.replace('/test', '').trim() });
        }
        return prompt;
    }

    async processChat(messages: any[]) {
        // 1. Context Optimization (Summarization)
        let optimizedMessages = messages;
        if (this.contextOptimizer) {
            optimizedMessages = await this.contextOptimizer.optimize(messages);
        }

        // 2. Extract and optimize the last prompt
        const lastMessage = optimizedMessages[optimizedMessages.length - 1];

        // Apply Templates before processing
        lastMessage.content = this.resolveTemplates(lastMessage.content);
        const initialPrompt = lastMessage.content;

        // Return standard processPrompt results but with optimized messages
        const result = await this.processPrompt(initialPrompt);

        return {
            ...result,
            optimizedMessages // Include for the caller to see what was sent to the AI
        };
    }

    async processPrompt(prompt: string) {
        const startTime = Date.now();

        // 0. Token Counting (Baseline)
        const initialTokens = this.tokenCounter.countTokens(prompt);

        // 1. Prompt Optimization
        const optimizationResult = this.promptOptimizer.optimize(prompt);
        const processedPrompt = optimizationResult.optimized;
        const optimizedTokens = this.tokenCounter.countTokens(processedPrompt);

        // Calculate optimization savings
        const promptSavings = initialTokens - optimizedTokens;

        // 2. Check Semantic Cache
        const cached = await this.cache.findSimilar(processedPrompt);

        if (cached) {
            // Calculate total savings: prompt optimization + cached response generation avoided
            const responseTokens = this.tokenCounter.countTokens(cached.response);
            const totalSaved = promptSavings + responseTokens;

            await db.insert(auditLogs).values({
                id: uuidv4(),
                action: 'CACHE_HIT',
                cacheHit: true,
                tokensSaved: totalSaved,
                timestamp: new Date(),
                metadata: JSON.stringify({
                    similarity: cached.similarity,
                    tier: cached.tier,
                    optimizationNodes: {
                        originalLength: prompt.length,
                        optimizedLength: processedPrompt.length
                    }
                }),
            });
            return {
                response: cached.response,
                source: 'cache',
                similarity: cached.similarity,
                tier: cached.tier
            };
        }

        // 3. Routing
        let routingDecision = this.router.analyzeComplexity(processedPrompt);

        // 4. Provider Execution
        const preferredProvider = routingDecision.provider;
        const providersToTry = [preferredProvider, 'gemini', 'openai'].filter((v, i, a) => a.indexOf(v) === i);

        let result;
        let lastError;

        for (const providerName of providersToTry) {
            try {
                console.log(`[DEBUG] Trying provider: ${providerName}`);
                const provider = this.providers.getProvider(providerName);
                result = await provider.complete(processedPrompt, routingDecision.model);
                console.log(`[DEBUG] Provider ${providerName} succeeded`);
                if (result) break;
            } catch (error: any) {
                console.log(`[DEBUG] Provider ${providerName} failed:`, error.message);
                lastError = error;
                continue;
            }
        }

        if (!result) {
            return {
                response: "Cache Miss: No AI providers configured or available to handle this request.",
                source: 'error',
                error: lastError?.message || 'No providers registered'
            };
        }

        // 5. Post-processing & Save Cache
        await this.cache.save(processedPrompt, result.text, {
            model: result.model,
            tokensUsed: result.tokensUsed,
        });

        await db.insert(auditLogs).values({
            id: uuidv4(),
            action: 'CACHE_MISS',
            cacheHit: false,
            tokensSaved: promptSavings, // We still saved tokens by optimizing the prompt!
            timestamp: new Date(),
            metadata: JSON.stringify({
                model: result.model,
                provider: routingDecision.provider,
                tokensUsed: result.tokensUsed,
                latency: Date.now() - startTime,
                promptOptimization: {
                    original: initialTokens,
                    optimized: optimizedTokens,
                    saved: promptSavings
                }
            }),
        });

        return {
            response: result.text,
            source: 'ai',
            model: result.model,
            optimization: {
                savedTokens: promptSavings,
                percentage: initialTokens > 0 ? ((promptSavings / initialTokens) * 100).toFixed(1) + '%' : '0%'
            }
        };
    }
}
