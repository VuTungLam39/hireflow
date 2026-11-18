// MVP 3 · BR-NOTI-02
export const EMAIL_QUEUE = 'email';
export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
export const EMAIL_MAX_ATTEMPTS = 5;

export enum EmailTemplate {
  VerifyEmail = 'VERIFY_EMAIL',
  AccountExists = 'ACCOUNT_EXISTS',
  OrgApproved = 'ORG_APPROVED',
  OrgRejected = 'ORG_REJECTED',
  OrgSuspended = 'ORG_SUSPENDED',
  OrgReactivated = 'ORG_REACTIVATED',
}

export interface EmailPayloads {
  [EmailTemplate.VerifyEmail]: { fullName: string; companyName: string; token: string };
  [EmailTemplate.AccountExists]: Record<string, never>;
  [EmailTemplate.OrgApproved]: { companyName: string };
  [EmailTemplate.OrgRejected]: { companyName: string; reason: string };
  [EmailTemplate.OrgSuspended]: { companyName: string; reason: string };
  [EmailTemplate.OrgReactivated]: { companyName: string };
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

export interface EmailJobData {
  outboxId: string;
}
