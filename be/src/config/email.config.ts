import { registerAs } from '@nestjs/config';

export type EmailProviderName = 'mailjet' | 'mailpit' | 'log';

// MVP 3 · BR-NOTI-02
export const emailConfig = registerAs('email', () => ({
  provider: (process.env.EMAIL_PROVIDER ?? 'log') as EmailProviderName,
  mailjetApiKey: process.env.MAILJET_API_KEY || undefined,
  mailjetSecretKey: process.env.MAILJET_SECRET_KEY || undefined,
  mailpitUrl: process.env.MAILPIT_URL ?? 'http://localhost:8025',
  from: process.env.EMAIL_FROM ?? 'no-reply@hireflow.local',
  fromName: process.env.EMAIL_FROM_NAME ?? 'HireFlow',
  appPublicUrl: (process.env.APP_PUBLIC_URL ?? 'http://localhost:5173').replace(/\/+$/, ''),
}));

export type EmailConfig = ReturnType<typeof emailConfig>;
