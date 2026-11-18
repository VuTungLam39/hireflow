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

// https://developers.brevo.com/reference/sendtransacemail
export class BrevoEmailProvider implements EmailProvider {
  readonly name = 'brevo';
  constructor(private readonly config: EmailConfig & { brevoApiKey: string }) {}

  send(m: EmailMessage): Promise<void> {
    return post(
      'https://api.brevo.com/v3/smtp/email',
      { 'api-key': this.config.brevoApiKey },
      {
        sender: { email: this.config.from, name: this.config.fromName },
        to: [{ email: m.to }],
        subject: m.subject,
        htmlContent: m.html,
        textContent: m.text,
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
    case 'brevo':
      if (!config.brevoApiKey)
        throw new Error('BREVO_API_KEY is required when EMAIL_PROVIDER=brevo');
      return new BrevoEmailProvider({ ...config, brevoApiKey: config.brevoApiKey });
    case 'mailpit':
      return new MailpitEmailProvider(config);
    case 'log':
      return new LogEmailProvider();
    default:
      throw new Error(`Unknown email provider "${String(config.provider)}"`);
  }
}
