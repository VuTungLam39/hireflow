import { Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { EmailConfig } from '../../config/email.config.js';
import type { EmailMessage, EmailProvider } from './email.types.js';

const SEND_TIMEOUT_MS = 15_000;

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// https://dev.mailjet.com/email/guides/send-api-v31/ · EMAIL_FROM phải là địa chỉ đã xác minh trên Mailjet
export class MailjetEmailProvider implements EmailProvider {
  readonly name = 'mailjet';
  private readonly auth: string;
  constructor(
    private readonly config: EmailConfig,
    apiKey: string,
    secretKey: string,
  ) {
    this.auth = `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`;
  }

  send(m: EmailMessage): Promise<void> {
    return post(
      'https://api.mailjet.com/v3.1/send',
      { authorization: this.auth },
      {
        Messages: [
          {
            From: { Email: this.config.from, Name: this.config.fromName },
            To: [{ Email: m.to }],
            Subject: m.subject,
            TextPart: m.text,
            HTMLPart: m.html,
          },
        ],
      },
    );
  }
}

// https://mailpit.axllent.org/docs/api-v1/view.html#post-/api/v1/send
export class MailpitEmailProvider implements EmailProvider {
  readonly name = 'mailpit';
  constructor(private readonly config: EmailConfig) {}

  send(m: EmailMessage): Promise<void> {
    return post(
      `${this.config.mailpitUrl.replace(/\/+$/, '')}/api/v1/send`,
      {},
      {
        From: { Email: this.config.from, Name: this.config.fromName },
        To: [{ Email: m.to }],
        Subject: m.subject,
        HTML: m.html,
        Text: m.text,
      },
    );
  }
}

// e2e, CI: không gửi thật, không ghi nội dung (có link chứa token)
export class LogEmailProvider implements EmailProvider {
  readonly name = 'log';
  private readonly logger = new Logger('Email');

  send(m: EmailMessage): Promise<void> {
    const toHash = createHash('sha256').update(m.to).digest('hex').slice(0, 16);
    this.logger.log(`email toHash=${toHash} subject="${m.subject}"`);
    return Promise.resolve();
  }
}

export function buildEmailProvider(config: EmailConfig): EmailProvider {
  switch (config.provider) {
    case 'mailjet':
      if (!config.mailjetApiKey || !config.mailjetSecretKey) {
        throw new Error(
          'MAILJET_API_KEY and MAILJET_SECRET_KEY are required when EMAIL_PROVIDER=mailjet',
        );
      }
      return new MailjetEmailProvider(config, config.mailjetApiKey, config.mailjetSecretKey);
    case 'mailpit':
      return new MailpitEmailProvider(config);
    case 'log':
      return new LogEmailProvider();
    default:
      throw new Error(`Unknown email provider "${String(config.provider)}"`);
  }
}
