import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const prompts = sqliteTable('prompts', {
    id: text('id').primaryKey(),
    text: text('text').notNull(),
    embedding: text('embedding').notNull(), // JSON stringified array
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const responses = sqliteTable('responses', {
    id: text('id').primaryKey(),
    promptId: text('prompt_id').references(() => prompts.id).notNull(),
    text: text('text').notNull(),
    model: text('model').notNull(),
    tokensUsed: integer('tokens_used').notNull(),
    tokensSaved: integer('tokens_saved').default(0),
    latency: integer('latency'), // in ms
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
    id: text('id').primaryKey(),
    promptId: text('prompt_id').references(() => prompts.id),
    action: text('action').notNull(), // 'CACHE_HIT', 'CACHE_MISS', 'PROVIDER_FALLBACK', 'SIMPLIFICATION'
    metadata: text('metadata'), // JSON stringified extra info
    cacheHit: integer('cache_hit', { mode: 'boolean' }).default(false),
    tokensSaved: integer('tokens_saved').default(0),
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});
