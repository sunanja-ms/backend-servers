import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  RATE_LIMIT_MAX: z.string().default('1000'),
  RATE_LIMIT_WINDOW: z.string().default('60000'),
  RATE_LIMIT_AUTH_MAX: z.string().default('20'),
  RATE_LIMIT_AUTH_WINDOW: z.string().default('60000'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  BCRYPT_ROUNDS: z.string().default('12'),
  API_KEY_EXPIRY_DAYS: z.string().default('30'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@example.com'),
  APP_URL: z.string().default('http://localhost:3000'),
});

const env = envSchema.parse(process.env);
export default env;