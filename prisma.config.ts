import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { config as dotenvConfig } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const NODE_ENV = process.env.NODE_ENV || 'development';

const ENV_FILE_NAMES = [
  `.env.${NODE_ENV}.local`,
  '.env.local',
  `.env.${NODE_ENV}`,
  '.env',
];

function findProjectRoot(startDir: string): string {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return resolve(startDir);
    }
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(process.cwd());

const envFiles = ENV_FILE_NAMES.map((name) => join(PROJECT_ROOT, name)).filter(
  (file) => existsSync(file),
);

dotenvConfig({ path: envFiles, quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
