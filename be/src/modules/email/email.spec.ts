import type { EmailConfig } from '../../config/email.config.js';
import { buildEmailProvider } from './email.providers.js';
import { EmailService } from './email.service.js';
import { DEMO_BANNER, renderEmail } from './email.templates.js';
import { EmailTemplate } from './email.types.js';
import { EmailStatus } from './entities/email-outbox.entity.js';

const config: EmailConfig = {
  provider: 'log',
  mailjetApiKey: undefined,
  mailjetSecretKey: undefined,
  mailpitUrl: 'http://localhost:8025',
  from: 'no-reply@hireflow.local',
  fromName: 'HireFlow',
  appPublicUrl: 'https://hireflow.test',
};

const mailjet: EmailConfig = {
  ...config,
  provider: 'mailjet',
  mailjetApiKey: 'key',
  mailjetSecretKey: 'secret',
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

  // SG-06 · R6
  it('puts the reset token in the URL fragment, never in the query string', () => {
    const mail = renderEmail(
      EmailTemplate.ResetPassword,
      { fullName: 'An', token: 'tok_456' },
      config.appPublicUrl,
    );
    for (const body of [mail.html, mail.text]) {
      expect(body).toContain('https://hireflow.test/reset-password#t=tok_456');
      expect(body).not.toContain('?t=tok_456');
    }
    expect(mail.text).toContain('30 phút');
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
  it('needs both Mailjet keys and picks the configured provider', () => {
    expect(() =>
      buildEmailProvider({ ...config, provider: 'mailjet', mailjetApiKey: 'k' }),
    ).toThrow(/MAILJET_SECRET_KEY/);
    expect(buildEmailProvider({ ...mailjet }).name).toBe('mailjet');
    expect(buildEmailProvider({ ...config, provider: 'mailpit' }).name).toBe('mailpit');
    expect(buildEmailProvider(config).name).toBe('log');
  });
});

describe('MailjetEmailProvider', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends one message through the v3.1 API with basic auth from the verified sender', async () => {
    const fetchMock = vi.fn(async () => new Response('{"Messages":[{"Status":"success"}]}'));
    vi.stubGlobal('fetch', fetchMock);
    await buildEmailProvider(mailjet).send({
      to: 'a@x.dev',
      subject: 'S',
      html: '<p>H</p>',
      text: 'T',
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.mailjet.com/v3.1/send');
    expect((init.headers as Record<string, string>).authorization).toBe(
      `Basic ${Buffer.from('key:secret').toString('base64')}`,
    );
    expect(JSON.parse(init.body as string)).toEqual({
      Messages: [
        {
          From: { Email: 'no-reply@hireflow.local', Name: 'HireFlow' },
          To: [{ Email: 'a@x.dev' }],
          Subject: 'S',
          TextPart: 'T',
          HTMLPart: '<p>H</p>',
        },
      ],
    });
  });

  it('fails so the queue retries when Mailjet refuses the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('sender not validated', { status: 401 })),
    );
    await expect(
      buildEmailProvider(mailjet).send({ to: 'a@x.dev', subject: 'S', html: 'H', text: 'T' }),
    ).rejects.toThrow(/HTTP 401/);
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
