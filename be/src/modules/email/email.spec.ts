import type { EmailConfig } from '../../config/email.config.js';
import { buildEmailProvider } from './email.providers.js';
import { EmailService } from './email.service.js';
import { DEMO_BANNER, renderEmail } from './email.templates.js';
import { EmailTemplate } from './email.types.js';
import { EmailStatus } from './entities/email-outbox.entity.js';

const config: EmailConfig = {
  provider: 'log',
  brevoApiKey: undefined,
  mailpitUrl: 'http://localhost:8025',
  from: 'no-reply@hireflow.local',
  fromName: 'HireFlow',
  appPublicUrl: 'https://hireflow.test',
};

// MVP 3 · BR-NOTI-02
describe('renderEmail', () => {
  it('puts the demo banner and the verification link in both HTML and text', () => {
    const mail = renderEmail(
      EmailTemplate.VerifyEmail,
      { fullName: 'An', companyName: 'Ví Mây', token: 'tok_123' },
      config.appPublicUrl,
    );
    for (const body of [mail.html, mail.text]) {
      expect(body).toContain(DEMO_BANNER);
      expect(body).toContain('https://hireflow.test/verify-email?t=tok_123');
    }
  });

  it('escapes what a company typed so it cannot inject HTML', () => {
    const mail = renderEmail(
      EmailTemplate.OrgRejected,
      { companyName: '<img src=x onerror=alert(1)>', reason: 'a "b" & c' },
      config.appPublicUrl,
    );
    expect(mail.html).not.toContain('<img');
    expect(mail.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(mail.html).toContain('a &quot;b&quot; &amp; c');
    expect(mail.text).toContain('Lý do: a "b" & c');
  });

  it.each(Object.values(EmailTemplate))('%s has a subject and a body', (template) => {
    const mail = renderEmail(
      template,
      { fullName: 'An', companyName: 'Ví Mây', token: 't', reason: 'Lý do' } as never,
      config.appPublicUrl,
    );
    expect(mail.subject.length).toBeGreaterThan(5);
    expect(mail.text.length).toBeGreaterThan(DEMO_BANNER.length);
  });
});

describe('buildEmailProvider', () => {
  it('needs an API key for Brevo and picks the configured provider', () => {
    expect(() => buildEmailProvider({ ...config, provider: 'brevo' })).toThrow(/BREVO_API_KEY/);
    expect(buildEmailProvider({ ...config, provider: 'brevo', brevoApiKey: 'k' }).name).toBe(
      'brevo',
    );
    expect(buildEmailProvider({ ...config, provider: 'mailpit' }).name).toBe('mailpit');
    expect(buildEmailProvider(config).name).toBe('log');
  });
});

describe('EmailService.deliver', () => {
  const row = () => ({
    id: 'o-1',
    to: 'a@x.dev',
    template: EmailTemplate.VerifyEmail,
    payload: { fullName: 'An', companyName: 'Ví Mây', token: 'secret' },
    status: EmailStatus.Pending,
    attempts: 1,
  });
  const setup = (send: () => Promise<void>) => {
    const repo = { findOneBy: vi.fn(async () => row()), update: vi.fn(async () => ({})) };
    const provider = { name: 'test', send: vi.fn(send) };
    const service = new EmailService(repo as never, {} as never, provider, config);
    return { repo, provider, service };
  };

  it('marks the row sent and forgets the token', async () => {
    const { repo, provider, service } = setup(async () => {});
    await service.deliver('o-1', false);
    expect(provider.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@x.dev' }));
    expect(repo.update).toHaveBeenCalledWith(
      'o-1',
      expect.objectContaining({
        status: EmailStatus.Sent,
        attempts: 2,
        payload: { fullName: 'An', companyName: 'Ví Mây' },
      }),
    );
  });

  it('keeps it pending for a retry, then fails it on the last attempt', async () => {
    const { repo, service } = setup(async () => {
      throw new Error('HTTP 502');
    });
    await expect(service.deliver('o-1', false)).rejects.toThrow('HTTP 502');
    expect(repo.update).toHaveBeenLastCalledWith('o-1', { attempts: 2, lastError: 'HTTP 502' });
    await expect(service.deliver('o-1', true)).rejects.toThrow('HTTP 502');
    expect(repo.update).toHaveBeenLastCalledWith(
      'o-1',
      expect.objectContaining({
        status: EmailStatus.Failed,
        payload: { fullName: 'An', companyName: 'Ví Mây' },
      }),
    );
  });

  it('does nothing when the row is no longer pending', async () => {
    const { repo, provider, service } = setup(async () => {});
    repo.findOneBy.mockResolvedValueOnce(null as never);
    await service.deliver('o-1', false);
    expect(provider.send).not.toHaveBeenCalled();
  });
});
