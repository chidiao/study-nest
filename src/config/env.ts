import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const NODE_ENV = process.env.NODE_ENV || 'development';

const ENV_FILE_NAMES = [
  `.env.${NODE_ENV}.local`,
  '.env.local',
  `.env.${NODE_ENV}`,
  '.env',
];

function currentDir(): string {
  return typeof __dirname !== 'undefined' ? __dirname : process.cwd();
}

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

const PROJECT_ROOT = findProjectRoot(currentDir());

function collectEnvFiles(): string[] {
  const candidates = [
    ...ENV_FILE_NAMES.map((name) => join(PROJECT_ROOT, name)),
    ...ENV_FILE_NAMES.map((name) => resolve(process.cwd(), name)),
  ];
  return [...new Set(candidates)].filter((file) => existsSync(file));
}

const loadedFiles = collectEnvFiles();

dotenvConfig({ path: loadedFiles, quiet: true });

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || !value.trim()) {
    const files = loadedFiles.length
      ? loadedFiles
          .map((file) => file.replace(PROJECT_ROOT, '<root>'))
          .join(', ')
      : '(未找到任何 .env 文件)';
    throw new Error(
      `[config] 缺少必需的环境变量 ${key}。\n` +
        `  - 请在项目根目录创建 .env 文件（可从 .env.example 复制），或直接在进程管理器中注入该变量。\n` +
        `  - 项目根目录: ${PROJECT_ROOT}\n` +
        `  - 已尝试加载的 env 文件: ${files}`,
    );
  }
  return value.trim();
}

export function optionalEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
}

export function validateEnv(): void {
  requireEnv('DATABASE_URL');
  const jwtSecret = requireEnv('JWT_SECRET');
  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error(
      '[config] JWT_SECRET 至少需要 32 字节，请使用随机生成的强密钥。',
    );
  }
}

export { PROJECT_ROOT };
