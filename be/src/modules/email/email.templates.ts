import { EmailTemplate, type EmailPayloads } from './email.types.js';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface Block {
  subject: string;
  lines: string[];
  action?: { label: string; url: string };
  note?: string;
}

// BR-NOTI-02
export const DEMO_BANNER = 'Đây là bản demo HireFlow, không dùng cho tuyển dụng thật.';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

function compose({ subject, lines, action, note }: Block): RenderedEmail {
  const text = [
    DEMO_BANNER,
    '',
    ...lines,
    ...(action ? ['', `${action.label}: ${action.url}`] : []),
    ...(note ? ['', note] : []),
    '',
    'HireFlow',
  ].join('\n');
  const html = `<!doctype html><html lang="vi"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<div style="max-width:560px;margin:0 auto;padding:24px">
<p style="margin:0 0 16px;padding:8px 12px;background:#fef3c7;border-radius:6px;font-size:13px">${escapeHtml(DEMO_BANNER)}</p>
<div style="background:#ffffff;border-radius:8px;padding:24px">
${lines.map((l) => `<p style="margin:0 0 12px;line-height:1.5">${escapeHtml(l)}</p>`).join('\n')}
${action ? `<p style="margin:20px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px">${escapeHtml(action.label)}</a></p><p style="margin:0;font-size:12px;color:#71717a;word-break:break-all">${escapeHtml(action.url)}</p>` : ''}
${note ? `<p style="margin:16px 0 0;font-size:13px;color:#52525b">${escapeHtml(note)}</p>` : ''}
</div>
<p style="margin:16px 0 0;font-size:12px;color:#71717a">HireFlow</p>
</div></body></html>`;
  return { subject, html, text };
}

export function renderEmail<T extends EmailTemplate>(
  template: T,
  payload: EmailPayloads[T],
  appUrl: string,
): RenderedEmail {
  const login = { label: 'Đăng nhập HireFlow', url: `${appUrl}/login` };
  const p = payload as Partial<Record<string, string>>;
  switch (template) {
    case EmailTemplate.VerifyEmail:
      return compose({
        subject: 'Xác minh email để kích hoạt tài khoản HireFlow',
        lines: [
          `Chào ${p.fullName},`,
          `Bạn vừa đăng ký công ty "${p.companyName}" trên HireFlow. Bấm nút dưới đây để xác minh email và kích hoạt tài khoản Admin công ty.`,
        ],
        action: {
          label: 'Xác minh email',
          url: `${appUrl}/verify-email?t=${encodeURIComponent(p.token ?? '')}`,
        },
        note: 'Link dùng được một lần và hết hạn sau 24 giờ. Nếu bạn không đăng ký, hãy bỏ qua email này.',
      });
    // SG-06 · R6
    case EmailTemplate.ResetPassword:
      return compose({
        subject: 'Đặt lại mật khẩu HireFlow',
        lines: [
          `Chào ${p.fullName},`,
          'Có yêu cầu đặt lại mật khẩu cho tài khoản HireFlow của bạn. Bấm nút dưới đây để đặt mật khẩu mới.',
        ],
        action: {
          label: 'Đặt lại mật khẩu',
          url: `${appUrl}/reset-password#t=${encodeURIComponent(p.token ?? '')}`,
        },
        note: 'Link dùng được một lần và hết hạn sau 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu hiện tại vẫn giữ nguyên.',
      });
    case EmailTemplate.AccountExists:
      return compose({
        subject: 'Email này đã có tài khoản HireFlow',
        lines: [
          'Có người vừa dùng email này để đăng ký công ty trên HireFlow, nhưng email đã có tài khoản.',
          'Nếu là bạn, hãy đăng nhập bằng tài khoản hiện có. Nếu không, bạn có thể bỏ qua email này.',
        ],
        action: login,
      });
    case EmailTemplate.OrgApproved:
      return compose({
        subject: `Công ty "${p.companyName}" đã được duyệt`,
        lines: [
          `Công ty "${p.companyName}" đã được Quản trị sàn duyệt.`,
          'Tin tuyển dụng đang mở của công ty sẽ hiện trên trang công khai, và ứng viên có thể nộp CV.',
        ],
        action: login,
      });
    case EmailTemplate.OrgRejected:
      return compose({
        subject: `Đăng ký công ty "${p.companyName}" chưa được duyệt`,
        lines: [
          `Đăng ký công ty "${p.companyName}" trên HireFlow chưa được duyệt.`,
          `Lý do: ${p.reason}`,
        ],
        note: 'Tài khoản của công ty không thể đăng nhập nữa.',
      });
    case EmailTemplate.OrgSuspended:
      return compose({
        subject: `Công ty "${p.companyName}" đã bị tạm khoá`,
        lines: [
          `Công ty "${p.companyName}" đã bị Quản trị sàn tạm khoá.`,
          `Lý do: ${p.reason}`,
          'Trong thời gian khoá, tài khoản của công ty không đăng nhập được và tin tuyển dụng không hiện công khai.',
        ],
      });
    case EmailTemplate.OrgReactivated:
      return compose({
        subject: `Công ty "${p.companyName}" đã được mở khoá`,
        lines: [
          `Công ty "${p.companyName}" đã được mở khoá. Tài khoản của công ty đăng nhập lại được.`,
        ],
        action: login,
      });
    // BR-APP-14
    case EmailTemplate.ApplicationReceived:
      return compose({
        subject: `Đã nhận hồ sơ ứng tuyển "${p.jobTitle}"`,
        lines: [
          `Chào ${p.fullName},`,
          `Công ty "${p.companyName}" đã nhận hồ sơ của bạn cho vị trí "${p.jobTitle}".`,
          'Bạn có thể xem trạng thái hồ sơ hoặc tự rút hồ sơ qua link dưới đây.',
        ],
        action: {
          label: 'Theo dõi hồ sơ',
          url: `${appUrl}/applications/track?t=${encodeURIComponent(p.token ?? '')}`,
        },
        note: 'Link hết hạn sau 90 ngày kể từ ngày nộp. Đừng chuyển tiếp email này: ai có link đều xem được trạng thái và rút được hồ sơ.',
      });
    default: {
      const unhandled: never = template as never;
      throw new Error(`Unknown email template ${String(unhandled)}`);
    }
  }
}
