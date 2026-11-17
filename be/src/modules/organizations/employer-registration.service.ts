import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { DataSource, EntityManager, MoreThan, QueryFailedError, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { escapeLike } from '../../common/utils/text.js';
import { AuthToken, AuthTokenKind } from '../auth/entities/auth-token.entity.js';
import { EmailService } from '../email/email.service.js';
import { EmailTemplate } from '../email/email.types.js';
import { hashToken } from '../refresh-tokens/refresh-tokens.service.js';
import { User } from '../users/entities/user.entity.js';
import { RegisterEmployerDto } from './dto/register-employer.dto.js';
import { Organization, OrganizationStatus } from './entities/organization.entity.js';
import { nextFreeSlug, slugify } from './slug.js';

const SALT_ROUNDS = 10;
export const VERIFY_TOKEN_TTL_MS = 24 * 3_600_000;
export const RESEND_PER_HOUR = 3;

const uniqueViolation = (error: unknown, constraint: string) =>
  error instanceof QueryFailedError &&
  (error.driverError as { code?: string; constraint?: string }).code === '23505' &&
  (error.driverError as { constraint?: string }).constraint === constraint;

const organizationExists = () =>
  new BusinessException(
    ErrorCode.OrganizationExists,
    'Organization already registered',
    HttpStatus.CONFLICT,
    [{ field: 'taxCode', messages: ['Mã số thuế đã được đăng ký trên sàn'] }],
  );

// MVP 3 · US-19, BR-ACC-09, BR-ORG-05
@Injectable()
export class EmployerRegistrationService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuthToken) private readonly tokens: Repository<AuthToken>,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterEmployerDto): Promise<void> {
    if (await this.orgs.existsBy({ taxCode: dto.taxCode })) throw organizationExists();
    // BR-ACC-09: không lộ email nào đã có tài khoản
    if (await this.users.existsBy({ email: dto.email })) return this.sendAccountExists(dto.email);

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    let outboxId: string;
    try {
      outboxId = await this.dataSource.transaction(async (m) => {
        const org = await m.save(
          m.create(Organization, {
            name: dto.companyName,
            slug: await this.freeSlug(m, slugify(dto.companyName)),
            taxCode: dto.taxCode,
            website: dto.website ?? null,
            status: OrganizationStatus.Pending,
          }),
        );
        const user = await m.save(
          m.create(User, {
            organizationId: org.id,
            email: dto.email,
            fullName: dto.fullName,
            role: Role.Admin,
            departmentId: null,
            passwordHash,
            emailVerifiedAt: null,
          }),
        );
        return this.issueVerification(m, user, org.name);
      });
    } catch (error) {
      if (uniqueViolation(error, 'UQ_organizations_tax_code')) throw organizationExists();
      if (uniqueViolation(error, 'UQ_users_email')) return this.sendAccountExists(dto.email);
      throw error;
    }
    await this.email.dispatch([outboxId]);
  }

  async verify(token: string): Promise<void> {
    const verified = await this.dataSource.transaction(async (m) => {
      const res = await m
        .createQueryBuilder()
        .update(AuthToken)
        .set({ usedAt: () => 'now()' })
        .where('token_hash = :hash', { hash: hashToken(token) })
        .andWhere('kind = :kind', { kind: AuthTokenKind.VerifyEmail })
        .andWhere('used_at IS NULL AND expires_at > now()')
        .returning(['userId'])
        .execute();
      const userId = (res.raw as { user_id: string }[])[0]?.user_id;
      if (!userId) return false;
      await m
        .createQueryBuilder()
        .update(User)
        .set({ emailVerifiedAt: () => 'now()' })
        .where('id = :userId AND email_verified_at IS NULL', { userId })
        .execute();
      return true;
    });
    if (!verified) {
      throw new BusinessException(
        ErrorCode.TokenInvalid,
        'Token is invalid or expired',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // BR-ACC-09: luôn 202, không cho biết email có tồn tại hay không
  async resend(email: string): Promise<void> {
    const user = await this.users.findOne({ where: { email }, relations: { organization: true } });
    if (!user || user.emailVerifiedAt || !user.isActive || !user.organization) return;
    const recent = await this.tokens.countBy({
      userId: user.id,
      kind: AuthTokenKind.VerifyEmail,
      createdAt: MoreThan(new Date(Date.now() - 3_600_000)),
    });
    if (recent > RESEND_PER_HOUR) return;
    const organization = user.organization;
    const outboxId = await this.dataSource.transaction(async (m) => {
      await m
        .createQueryBuilder()
        .update(AuthToken)
        .set({ usedAt: () => 'now()' })
        .where('user_id = :userId AND kind = :kind AND used_at IS NULL', {
          userId: user.id,
          kind: AuthTokenKind.VerifyEmail,
        })
        .execute();
      return this.issueVerification(m, user, organization.name);
    });
    await this.email.dispatch([outboxId]);
  }

  private async issueVerification(m: EntityManager, user: User, companyName: string) {
    const token = randomBytes(32).toString('base64url');
    await m.insert(AuthToken, {
      kind: AuthTokenKind.VerifyEmail,
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    });
    return this.email.enqueue(
      {
        organizationId: user.organizationId,
        to: user.email,
        template: EmailTemplate.VerifyEmail,
        payload: { fullName: user.fullName, companyName, token },
      },
      m,
    );
  }

  private async sendAccountExists(to: string): Promise<void> {
    const id = await this.email.enqueue({
      organizationId: null,
      to,
      template: EmailTemplate.AccountExists,
      payload: {},
    });
    await this.email.dispatch([id]);
  }

  private async freeSlug(m: EntityManager, base: string): Promise<string> {
    const rows = await m
      .getRepository(Organization)
      .createQueryBuilder('o')
      .select('o.slug', 'slug')
      .where('o.slug = :base OR o.slug LIKE :prefix', { base, prefix: `${escapeLike(base)}-%` })
      .getRawMany<{ slug: string }>();
    return nextFreeSlug(
      base,
      rows.map((r) => r.slug),
    );
  }
}
