export class PromptTemplates {
    static optimize(templateName: string, variables: Record<string, string>): string {
        switch (templateName) {
            case 'codeExplain':
                return `Explain code logic concisely:\n\`\`\`\n${variables.code}\n\`\`\``;

            case 'debug':
                return `Fix error:\nError: ${variables.error}\nCode:\n\`\`\`\n${variables.code}\n\`\`\``;

            case 'docs':
                return `Generate TSDoc for:\n\`\`\`\n${variables.code}\n\`\`\``;

            case 'test':
                return `Write Vitest unit tests for:\n\`\`\`\n${variables.code}\n\`\`\``;

            default:
                // Fallback: return the first variable as is
                return Object.values(variables)[0] || '';
        }
    }
}
