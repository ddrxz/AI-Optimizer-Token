import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDbPath = join(__dirname, '../../../local.db');

const client = createClient({
    url: process.env.DATABASE_URL || `file:${defaultDbPath}`,
});

export const db = drizzle(client, { schema });
export { prompts, responses, auditLogs } from './schema.js';
