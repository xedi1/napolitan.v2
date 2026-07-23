import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SWAGGER_PATH: z.string().default('docs'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let envCache: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (envCache) return envCache;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Invalid environment variables:\n${errors.join('\n')}`);
  }

  envCache = result.data;
  return envCache;
}

export default () => validateEnv();
