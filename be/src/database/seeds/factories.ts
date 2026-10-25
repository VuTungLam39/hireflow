import type { Faker } from '@faker-js/faker';
import { createHash } from 'node:crypto';
import { AiStatus } from '../../common/enums/ai-status.enum.js';
import { ApplicationSource } from '../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { ScoreFlag } from '../../common/enums/score-flag.enum.js';
import type { BreakdownItem } from '../../modules/applications/entities/application.entity.js';
import { RequirementType } from '../../modules/jobs/entities/job-requirement.entity.js';

type Req = [
  label: string,
  type: RequirementType,
  weight: 1 | 2 | 3,
  minYears: number | null,
  keywords: string[],
];

export interface JobTemplate {
  title: string;
  location: string;
  requirements: Req[];
}

const M = RequirementType.Must;
const N = RequirementType.Nice;

export const TRACKS: Record<'ENG' | 'SALES' | 'MKT', JobTemplate[]> = {
  ENG: [
    {
      title: 'Backend Developer (NestJS)',
      location: 'Hà Nội',
      requirements: [
        ['NestJS', M, 3, 2, ['nestjs', 'nest.js']],
        ['PostgreSQL', M, 2, null, ['postgresql', 'postgres']],
        ['Docker', N, 1, null, ['docker']],
        ['Redis', N, 1, null, ['redis']],
      ],
    },
    {
      title: 'Frontend Developer (React)',
      location: 'Hồ Chí Minh',
      requirements: [
        ['React', M, 3, 2, ['react', 'reactjs']],
        ['TypeScript', M, 2, 1, ['typescript']],
        ['Tailwind CSS', N, 1, null, ['tailwind']],
      ],
    },
    {
      title: 'DevOps Engineer',
      location: 'Remote',
      requirements: [
        ['Kubernetes', M, 3, 1, ['kubernetes', 'k8s']],
        ['CI/CD', M, 2, null, ['ci/cd', 'github actions', 'gitlab ci']],
        ['AWS', N, 2, null, ['aws']],
      ],
    },
    {
      title: 'Data Engineer',
      location: 'Hà Nội',
      requirements: [
        ['Python', M, 3, 2, ['python']],
        ['Kafka', N, 2, null, ['kafka']],
        ['SQL', M, 2, null, ['sql']],
      ],
    },
  ],
  SALES: [
    {
      title: 'Chuyên viên kinh doanh B2B',
      location: 'Hà Nội',
      requirements: [
        ['Bán hàng B2B', M, 3, 2, ['b2b', 'ban hang']],
        ['CRM', N, 1, null, ['crm', 'salesforce', 'hubspot']],
        ['Tiếng Anh', N, 1, null, ['ielts', 'toeic', 'tieng anh']],
      ],
    },
    {
      title: 'Account Manager',
      location: 'Hồ Chí Minh',
      requirements: [
        ['Quản lý khách hàng', M, 3, 3, ['account management', 'quan ly khach hang']],
        ['Đàm phán', M, 2, null, ['dam phan', 'negotiation']],
      ],
    },
  ],
  MKT: [
    {
      title: 'Content Marketing Executive',
      location: 'Hà Nội',
      requirements: [
        ['Viết nội dung', M, 3, 1, ['content', 'copywriting', 'viet bai']],
        ['SEO', N, 2, null, ['seo']],
      ],
    },
    {
      title: 'Performance Marketing Specialist',
      location: 'Remote',
      requirements: [
        ['Facebook Ads', M, 3, 1, ['facebook ads', 'meta ads']],
        ['Google Ads', M, 2, null, ['google ads']],
        ['Google Analytics', N, 1, null, ['google analytics', 'ga4']],
      ],
    },
  ],
};

export const jdTextOf = (t: JobTemplate) =>
  [
    `Vị trí ${t.title} tại ${t.location}.`,
    'Yêu cầu:',
    ...t.requirements.map(
      ([label, type, , years]) =>
        `- ${label}${years ? ` (từ ${years} năm)` : ''}${type === N ? ' – ưu tiên' : ''}`,
    ),
    'Quyền lợi: lương cạnh tranh, review 2 lần/năm, bảo hiểm đầy đủ.',
  ].join('\n');

// Database Design 7
const STATUS_WEIGHTS: [ApplicationStatus, number][] = [
  [ApplicationStatus.New, 30],
  [ApplicationStatus.Screening, 25],
  [ApplicationStatus.Interview, 15],
  [ApplicationStatus.Offer, 6],
  [ApplicationStatus.Hired, 5],
  [ApplicationStatus.Rejected, 15],
  [ApplicationStatus.Withdrawn, 4],
];

const PIPELINE = [
  ApplicationStatus.New,
  ApplicationStatus.Screening,
  ApplicationStatus.Interview,
  ApplicationStatus.Offer,
  ApplicationStatus.Hired,
];

const REJECT_REASONS = [
  'Chưa đủ số năm kinh nghiệm yêu cầu',
  'Kỹ năng chưa phù hợp với vị trí',
  'Kết quả phỏng vấn chưa đạt',
  'Mức lương mong muốn vượt ngân sách',
];

export const unaccent = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

export const emailOf = (fullName: string, index: number) =>
  `${unaccent(fullName)
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '')}.${index}@example.com`;

export const phoneOf = (f: Faker) =>
  `0${f.helpers.arrayElement(['3', '5', '7', '8', '9'])}${f.string.numeric(8)}`;

export function pickStatus(f: Faker): ApplicationStatus {
  return f.helpers.weightedArrayElement(
    STATUS_WEIGHTS.map(([value, weight]) => ({ value, weight })),
  );
}

export function pickAiStatus(f: Faker, status: ApplicationStatus): AiStatus {
  if (status !== ApplicationStatus.New) return AiStatus.Done;
  return f.helpers.weightedArrayElement([
    { value: AiStatus.Done, weight: 90 },
    { value: AiStatus.Pending, weight: 5 },
    { value: AiStatus.Processing, weight: 3 },
    { value: AiStatus.Failed, weight: 2 },
  ]);
}

export const pickSource = (f: Faker) =>
  f.datatype.boolean({ probability: 0.15 })
    ? ApplicationSource.HrUpload
    : ApplicationSource.PublicForm;

export interface SeedRequirement {
  id: string;
  label: string;
  type: RequirementType;
  weight: number;
  minYears: number | null;
}

// Kickoff 8.4
export function scoreOf(f: Faker, requirements: SeedRequirement[]) {
  const breakdown: BreakdownItem[] = [];
  const lines: string[] = [];
  let earned = 0;
  let total = 0;
  let missingMust = false;
  let unverified = false;

  for (const r of requirements) {
    const match = f.helpers.weightedArrayElement([
      { value: 1 as const, weight: 5 },
      { value: 0.5 as const, weight: 3 },
      { value: 0 as const, weight: 2 },
    ]);
    let evidence: string | null = null;
    let rejectedEvidence: string | null = null;
    if (match > 0) {
      const years =
        match === 1
          ? (r.minYears ?? 1) + f.number.int({ max: 3 })
          : Math.max(0, (r.minYears ?? 1) - 1);
      evidence = `${years} năm làm việc với ${r.label} tại ${f.company.name()}`;
      lines.push(evidence);
    } else if (f.datatype.boolean({ probability: 0.05 })) {
      rejectedEvidence = `Thành thạo ${r.label} trong nhiều dự án lớn`;
      unverified = true;
    }
    if (match === 0 && r.type === RequirementType.Must) missingMust = true;
    breakdown.push({ requirementId: r.id, match, evidence, rejectedEvidence });
    earned += r.weight * match;
    total += r.weight;
  }

  const flags: ScoreFlag[] = [];
  if (missingMust) flags.push(ScoreFlag.MissingMust);
  if (unverified) flags.push(ScoreFlag.UnverifiedEvidence);
  return { score: Math.round((100 * earned) / total), breakdown, flags, lines };
}

export const cvTextOf = (fullName: string, lines: string[]) =>
  [fullName, 'KINH NGHIỆM', ...lines, 'HỌC VẤN', 'Cử nhân, Đại học Bách khoa Hà Nội'].join('\n');

export const fakeSha256 = (seed: string) => createHash('sha256').update(seed).digest('hex');

export interface HistoryStep {
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  reason: string | null;
  changedAt: Date;
  byManager: boolean;
}

export function historyOf(f: Faker, status: ApplicationStatus, createdAt: Date): HistoryStep[] {
  const terminal = status === ApplicationStatus.Rejected || status === ApplicationStatus.Withdrawn;
  const reached = terminal ? f.number.int({ min: 0, max: 3 }) : PIPELINE.indexOf(status);
  const path: ApplicationStatus[] = [
    ...PIPELINE.slice(0, reached + 1),
    ...(terminal ? [status] : []),
  ];

  let at = createdAt.getTime();
  return path.map((to, i) => {
    if (i > 0) at += f.number.int({ min: 1, max: 7 }) * 86_400_000;
    const from = i === 0 ? null : path[i - 1];
    return {
      fromStatus: from,
      toStatus: to,
      reason: to === ApplicationStatus.Rejected ? f.helpers.arrayElement(REJECT_REASONS) : null,
      changedAt: new Date(Math.min(at, Date.now())),
      byManager:
        to === ApplicationStatus.Hired ||
        (to === ApplicationStatus.Rejected && from === ApplicationStatus.Offer),
    };
  });
}
