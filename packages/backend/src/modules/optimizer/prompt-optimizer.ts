import nlp from "compromise";

export class PromptOptimizer {

    // Pattern to detect code blocks, math, and technical regex
    private static SAFE_BLOCK_REGEX = /```[\s\S]*?```|\$\$[\s\S]*?\$\$|`[^`]*`|\\begin\{[\s\S]*?\\end\{/g;

    optimize(text: string): { optimized: string; isSafe: boolean } {
        // Safe Mode: Detect protected blocks
        const protectedBlocks: string[] = [];
        let placeholderCounter = 0;

        // Replace protected blocks with placeholders
        const safeText = text.replace(PromptOptimizer.SAFE_BLOCK_REGEX, (match) => {
            const placeholder = `__PROTECTED_BLOCK_${placeholderCounter}__`;
            protectedBlocks.push(match);
            placeholderCounter++;
            return placeholder;
        });

        // Use compromise to process the text OUTSIDE of protected blocks
        let doc = nlp(safeText);

        // Remove filler words, excessive adjectives/adverbs, but keep conjunctions to maintain flow
        doc.adverbs().remove(''); // remove 'very', 'really', 'extremely'
        // Be careful with adjectives, only remove very common ones if needed. For now, keep them.

        // Remove 'polite' filler words
        doc.match('(please|kindly|could you|would you)').remove('');

        // Get the optimized text
        let optimizedText = doc.text();

        // Restore protected blocks
        protectedBlocks.forEach((block, index) => {
            optimizedText = optimizedText.replace(`__PROTECTED_BLOCK_${index}__`, block);
        });

        // Basic whitespace cleanup
        optimizedText = optimizedText.replace(/\s+/g, ' ').trim();

        return {
            optimized: optimizedText,
            isSafe: true
        };
    }
}
