import bcrypt from 'bcryptjs';
import type { EntityManager } from 'typeorm';
import { AiStatus } from '../../../common/enums/ai-status.enum.js';
import { ApplicationSource } from '../../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../../common/enums/application-status.enum.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Application } from '../../../modules/applications/entities/application.entity.js';
import { ApplicationStatusHistory } from '../../../modules/applications/entities/application-status-history.entity.js';
import { Candidate } from '../../../modules/candidates/entities/candidate.entity.js';
import { CompanyProfile } from '../../../modules/company/entities/company-profile.entity.js';
import { Department } from '../../../modules/departments/entities/department.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../../../modules/jobs/entities/job-requirement.entity.js';
import { Job, JobLevel, JobStatus, WorkMode } from '../../../modules/jobs/entities/job.entity.js';
import {
  Organization,
  OrganizationStatus,
} from '../../../modules/organizations/entities/organization.entity.js';
import { User } from '../../../modules/users/entities/user.entity.js';

interface TenantJob {
  key: string;
  title: string;
  department: string;
  location: string;
  level: JobLevel;
  workMode: WorkMode;
  jd: string;
  requirements: { label: string; type: RequirementType; weight: number; keywords: string[] }[];
  applicants: { fullName: string; status: ApplicationStatus }[];
}

interface Tenant {
  key: string;
  name: string;
  slug: string;
  taxCode: string;
  website: string;
  domain: string;
  tagline: string;
  about: string;
  departments: { code: string; name: string }[];
  jobs: TenantJob[];
}

// MVP 3 · P1b-B5, BR-TEN-01
export const TENANTS: Tenant[] = [
  {
    key: 'vi-may',
    name: 'Công ty Cổ phần Ví Mây',
    slug: 'vi-may',
    taxCode: '0109000001',
    website: 'https://vi-may.example',
    domain: 'vi-may.example',
    tagline: 'Ví điện tử cho người Việt',
    about: 'Ví Mây (dữ liệu demo) xây dựng ví điện tử và cổng thanh toán cho cửa hàng nhỏ.',
    departments: [
      { code: 'ENG', name: 'Kỹ thuật' },
      { code: 'RISK', name: 'Quản trị rủi ro' },
    ],
    jobs: [
      {
        key: 'backend',
        title: 'Backend Engineer (Payments)',
        department: 'ENG',
        location: 'Hà Nội',
        level: JobLevel.Middle,
        workMode: WorkMode.Hybrid,
        jd: 'Phát triển dịch vụ thanh toán bằng Go và PostgreSQL, vận hành hàng đợi Kafka.',
        requirements: [
          { label: 'Go', type: RequirementType.Must, weight: 3, keywords: ['go', 'golang'] },
          { label: 'PostgreSQL', type: RequirementType.Must, weight: 2, keywords: ['postgresql'] },
          { label: 'Kafka', type: RequirementType.Nice, weight: 1, keywords: ['kafka'] },
        ],
        applicants: [
          { fullName: 'Đỗ Thanh Bình', status: ApplicationStatus.New },
          { fullName: 'Lương Thu Hà', status: ApplicationStatus.Screening },
        ],
      },
      {
        key: 'risk-analyst',
        title: 'Chuyên viên phân tích rủi ro gian lận',
        department: 'RISK',
        location: 'TP. Hồ Chí Minh',
        level: JobLevel.Junior,
        workMode: WorkMode.Onsite,
        jd: 'Theo dõi giao dịch bất thường, xây dựng quy tắc chống gian lận bằng SQL.',
        requirements: [
          { label: 'SQL', type: RequirementType.Must, weight: 3, keywords: ['sql'] },
          {
            label: 'Phân tích dữ liệu',
            type: RequirementType.Nice,
            weight: 2,
            keywords: ['phân tích'],
          },
        ],
        applicants: [{ fullName: 'Kim Ngọc Diệp', status: ApplicationStatus.New }],
      },
    ],
  },
  {
    key: 'cho-lanh',
    name: 'Công ty TNHH Chợ Lành',
    slug: 'cho-lanh',
    taxCode: '0318000002',
    website: 'https://cho-lanh.example',
    domain: 'cho-lanh.example',
    tagline: 'Chuỗi cửa hàng thực phẩm sạch',
    about: 'Chợ Lành (dữ liệu demo) vận hành chuỗi cửa hàng thực phẩm và kênh bán hàng trực tuyến.',
    departments: [
      { code: 'STORE', name: 'Vận hành cửa hàng' },
      { code: 'ECOM', name: 'Thương mại điện tử' },
    ],
    jobs: [
      {
        key: 'store-manager',
        title: 'Cửa hàng trưởng',
        department: 'STORE',
        location: 'Đà Nẵng',
        level: JobLevel.Senior,
        workMode: WorkMode.Onsite,
        jd: 'Quản lý vận hành cửa hàng, tồn kho và đội ngũ 10 nhân viên.',
        requirements: [
          { label: 'Quản lý bán lẻ', type: RequirementType.Must, weight: 3, keywords: ['bán lẻ'] },
          {
            label: 'Quản lý tồn kho',
            type: RequirementType.Must,
            weight: 2,
            keywords: ['tồn kho'],
          },
        ],
        applicants: [
          { fullName: 'Hà Minh Tâm', status: ApplicationStatus.New },
          { fullName: 'Phùng Bảo Ngọc', status: ApplicationStatus.Interview },
        ],
      },
      {
        key: 'ecom-specialist',
        title: 'Chuyên viên vận hành sàn thương mại điện tử',
        department: 'ECOM',
        location: 'TP. Hồ Chí Minh',
        level: JobLevel.Junior,
        workMode: WorkMode.Remote,
        jd: 'Vận hành gian hàng trên các sàn, theo dõi đơn hàng và chương trình khuyến mãi.',
        requirements: [
          { label: 'Vận hành sàn TMĐT', type: RequirementType.Must, weight: 3, keywords: ['tmđt'] },
          { label: 'Excel', type: RequirementType.Nice, weight: 1, keywords: ['excel'] },
        ],
        applicants: [{ fullName: 'Trịnh Gia Hân', status: ApplicationStatus.Screening }],
      },
    ],
  },
];

const ROLES: { key: string; role: Role; label: string; department?: boolean }[] = [
  { key: 'admin', role: Role.Admin, label: 'Admin' },
  { key: 'hr', role: Role.Hr, label: 'HR' },
  { key: 'hm', role: Role.HiringManager, label: 'Hiring Manager', department: true },
  { key: 'interviewer', role: Role.Interviewer, label: 'Interviewer' },
];

export const tenantEmail = (tenant: Pick<Tenant, 'domain'>, roleKey: string) =>
  `${roleKey}@${tenant.domain}`;

export async function seedTenants(
  manager: EntityManager,
  password: string,
  id: (name: string) => string,
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);
  for (const t of TENANTS) {
    const organizationId = id(`org:${t.key}`);
    await manager
      .createQueryBuilder()
      .insert()
      .into(Organization)
      .values({
        id: organizationId,
        name: t.name,
        slug: t.slug,
        taxCode: t.taxCode,
        website: t.website,
        status: OrganizationStatus.Active,
        approvedAt: new Date(),
        // KH MVP 3 · Q5
        aiDailyScoreLimit: 1000,
        aiDailyChatLimit: 300,
      })
      .orIgnore()
      .execute();
    const departmentIds = new Map(
      t.departments.map((d) => [d.code, id(`dept:${t.key}:${d.code}`)]),
    );
    await manager
      .createQueryBuilder()
      .insert()
      .into(Department)
      .values(t.departments.map((d) => ({ id: departmentIds.get(d.code)!, organizationId, ...d })))
      .orIgnore()
      .execute();
    const userIds = new Map(ROLES.map((r) => [r.key, id(`user:${t.key}:${r.key}`)]));
    await manager
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(
        ROLES.map((r) => ({
          id: userIds.get(r.key)!,
          organizationId,
          email: tenantEmail(t, r.key),
          fullName: `${r.label} ${t.name.split(' ').slice(-2).join(' ')}`,
          role: r.role,
          departmentId: r.department ? departmentIds.get(t.departments[0].code)! : null,
          passwordHash,
          emailVerifiedAt: new Date(),
        })),
      )
      .orIgnore()
      .execute();
    await manager
      .createQueryBuilder()
      .insert()
      .into(CompanyProfile)
      .values({ organizationId, name: t.name, tagline: t.tagline, about: t.about })
      .orIgnore()
      .execute();

    for (const j of t.jobs) {
      const jobId = id(`job:${t.key}:${j.key}`);
      const publishedAt = new Date();
      await manager.insert(Job, {
        id: jobId,
        organizationId,
        title: j.title,
        departmentId: departmentIds.get(j.department)!,
        status: JobStatus.Open,
        location: j.location,
        jdText: j.jd,
        level: j.level,
        workMode: j.workMode,
        createdBy: userIds.get('hr')!,
        publishedAt,
      });
      await manager.insert(
        JobRequirement,
        j.requirements.map((r, position) => ({ jobId, jdVersion: 1, position, ...r })),
      );
      for (const [n, a] of j.applicants.entries()) {
        const candidateId = id(`candidate:${t.key}:${j.key}:${n}`);
        await manager.insert(Candidate, {
          id: candidateId,
          organizationId,
          fullName: a.fullName,
          email: `ung-vien-${j.key}-${n + 1}@${t.domain}`,
          consentAt: publishedAt,
          consentVersion: 'v2',
        });
        const applicationId = id(`application:${t.key}:${j.key}:${n}`);
        await manager.insert(Application, {
          id: applicationId,
          organizationId,
          jobId,
          candidateId,
          cvFileId: null,
          source: ApplicationSource.PublicForm,
          status: a.status,
          aiStatus: AiStatus.Pending,
        });
        await manager.insert(ApplicationStatusHistory, {
          applicationId,
          fromStatus: null,
          toStatus: a.status,
          reason: null,
          changedBy: a.status === ApplicationStatus.New ? null : userIds.get('hr')!,
        });
      }
    }
  }
}
