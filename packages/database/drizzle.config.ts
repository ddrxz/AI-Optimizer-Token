import type { Config } from 'drizzle-kit';
import { resolve } from 'path';

export default {
    schema: './src/schema.ts',
    out: './drizzle',
    driver: 'libsql',
    dbCredentials: {
        url: `file:${resolve('../../local.db')}`,
    },
} satisfies Config;
