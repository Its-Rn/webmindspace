import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  SERVER_URL: z.string().url().default('http://localhost:5000'),
  MONGODB_URI: z.string().trim().optional().default(''),
  JWT_ACCESS_SECRET: z.string().trim().optional().default(''),
  JWT_REFRESH_SECRET: z.string().trim().optional().default(''),
  JWT_ACCESS_EXPIRES_IN: z.string().trim().optional().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().trim().optional().default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string().trim().optional().default(''),
  CLOUDINARY_API_KEY: z.string().trim().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().trim().optional().default(''),
  PUSHER_APP_ID: z.string().trim().optional().default(''),
  PUSHER_KEY: z.string().trim().optional().default(''),
  PUSHER_SECRET: z.string().trim().optional().default(''),
  PUSHER_CLUSTER: z.string().trim().optional().default(''),
  SMTP_HOST: z.string().trim().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().trim().optional().default(''),
  SMTP_PASS: z.string().trim().optional().default(''),
  EMAIL_FROM: z.string().trim().optional().default(''),
  CONTACT_EMAIL: z.string().trim().optional().default('')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issueLines = parsedEnv.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'env';
    return `${path}: ${issue.message}`;
  });

  throw new Error(`Invalid environment variables:\n${issueLines.join('\n')}`);
}

export const appEnv = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  clientUrl: parsedEnv.data.CLIENT_URL,
  serverUrl: parsedEnv.data.SERVER_URL,
  mongoUri: parsedEnv.data.MONGODB_URI,
  jwtAccessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: parsedEnv.data.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: parsedEnv.data.JWT_REFRESH_EXPIRES_IN,
  cloudinaryCloudName: parsedEnv.data.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: parsedEnv.data.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: parsedEnv.data.CLOUDINARY_API_SECRET,
  pusherAppId: parsedEnv.data.PUSHER_APP_ID,
  pusherKey: parsedEnv.data.PUSHER_KEY,
  pusherSecret: parsedEnv.data.PUSHER_SECRET,
  pusherCluster: parsedEnv.data.PUSHER_CLUSTER,
  smtpHost: parsedEnv.data.SMTP_HOST,
  smtpPort: parsedEnv.data.SMTP_PORT,
  smtpUser: parsedEnv.data.SMTP_USER,
  smtpPass: parsedEnv.data.SMTP_PASS,
  emailFrom: parsedEnv.data.EMAIL_FROM,
  contactEmail: parsedEnv.data.CONTACT_EMAIL
};
