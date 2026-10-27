/**
 * Dữ liệu giả trong bộ nhớ cho MSW. Sinh bằng bộ số ngẫu nhiên có seed cố định,
 * nên lần nào tải trang cũng ra cùng dữ liệu. Tải lại trang thì mọi thay đổi mất đi.
 */
import type {
  AiStatus,
  ApplicationSource,
  ApplicationStatus,
  BreakdownItem,
  MatchLevel,
  ScoreFlag,
} from '@/features/applications'
import type { JobStatus, Requirement, RequirementType } from '@/features/jobs'
import { computeScore } from '@/features/ranking'
import { Role } from '@/types/user'

// ---------- ngẫu nhiên có seed ----------
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261020)
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]
const chance = (p: number) => rand() < p
const shuffle = <T>(list: readonly T[]) =>
  list
    .map((v) => [rand(), v] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v)

let seq = 0
export const uid = (prefix: string) => `${prefix}-${(++seq).toString(36).padStart(3, '0')}`

const DAY = 86_400_000
const daysAgo = (days: number) => new Date(Date.now() - days * DAY - between(0, DAY)).toISOString()

export const MOCK_PASSWORD = 'Hireflow@123'

// ---------- danh mục kỹ năng (từ khoá dùng để khớp tiêu chí) ----------
interface SkillDef {
  label: string
  /** Câu xuất hiện nguyên văn trong CV – chính là bằng chứng */
  sentence: (years: number, company: string) => string
}

export const SKILLS: Record<string, SkillDef> = {
  nestjs: {
    label: 'NestJS',
    sentence: (y, c) => `${y} năm phát triển REST API bằng NestJS tại ${c}`,
  },
  nodejs: { label: 'Node.js', sentence: (y, c) => `${y} năm lập trình backend Node.js tại ${c}` },
  postgresql: {
    label: 'PostgreSQL',
    sentence: (y) => `${y} năm thiết kế và tối ưu truy vấn PostgreSQL`,
  },
  docker: {
    label: 'Docker',
    sentence: (y) => `Đóng gói và triển khai dịch vụ bằng Docker trong ${y} năm`,
  },
  redis: { label: 'Redis', sentence: (y) => `Dùng Redis làm cache và hàng đợi trong ${y} năm` },
  kafka: {
    label: 'Kafka',
    sentence: (y, c) =>
      `${y} năm xây dựng luồng sự kiện với Kafka cho hệ thống thanh toán tại ${c}`,
  },
  react: { label: 'React', sentence: (y, c) => `${y} năm phát triển giao diện React tại ${c}` },
  typescript: {
    label: 'TypeScript',
    sentence: (y) => `Viết TypeScript strict hằng ngày trong ${y} năm`,
  },
  tailwind: {
    label: 'Tailwind CSS',
    sentence: (y) => `${y} năm dựng giao diện responsive bằng Tailwind CSS`,
  },
  testing: { label: 'Unit test', sentence: (y) => `${y} năm viết unit test với Jest và Vitest` },
  manualtest: {
    label: 'Kiểm thử thủ công',
    sentence: (y, c) => `${y} năm viết test case và kiểm thử thủ công tại ${c}`,
  },
  playwright: {
    label: 'Playwright',
    sentence: (y) => `${y} năm viết kiểm thử tự động bằng Playwright`,
  },
  sql: { label: 'SQL', sentence: (y) => `${y} năm truy vấn SQL để kiểm tra dữ liệu` },
  kubernetes: {
    label: 'Kubernetes',
    sentence: (y, c) => `${y} năm vận hành cụm Kubernetes tại ${c}`,
  },
  cicd: { label: 'CI/CD', sentence: (y) => `${y} năm xây dựng pipeline CI/CD với GitHub Actions` },
  aws: { label: 'AWS', sentence: (y) => `${y} năm triển khai hạ tầng trên AWS (EC2, S3, RDS)` },
  b2b: {
    label: 'Bán hàng B2B',
    sentence: (y, c) => `${y} năm bán giải pháp phần mềm B2B tại ${c}`,
  },
  crm: { label: 'CRM', sentence: (y) => `Quản lý pipeline khách hàng trên CRM trong ${y} năm` },
  english: { label: 'Tiếng Anh', sentence: () => `Tiếng Anh giao tiếp tốt, IELTS 7.0` },
  seo: {
    label: 'SEO',
    sentence: (y, c) => `${y} năm làm SEO cho website thương mại điện tử tại ${c}`,
  },
  googleads: {
    label: 'Google Ads',
    sentence: (y) => `${y} năm chạy chiến dịch Google Ads với ngân sách lớn`,
  },
  content: { label: 'Content', sentence: (y) => `${y} năm viết content marketing cho mạng xã hội` },
  recruitment: {
    label: 'Tuyển dụng',
    sentence: (y, c) => `${y} năm tuyển dụng nhân sự IT tại ${c}`,
  },
}

const TRACKS: Record<string, string[]> = {
  backend: ['nestjs', 'nodejs', 'postgresql', 'docker', 'redis', 'kafka', 'typescript'],
  frontend: ['react', 'typescript', 'tailwind', 'testing', 'nodejs'],
  qa: ['manualtest', 'playwright', 'sql', 'testing'],
  devops: ['kubernetes', 'cicd', 'aws', 'docker'],
  sales: ['b2b', 'crm', 'english'],
  marketing: ['seo', 'googleads', 'content', 'english'],
  hr: ['recruitment', 'english'],
}

const COMPANIES = ['FPT Software', 'VNG', 'Tiki', 'MoMo', 'Viettel', 'NashTech', 'KMS', 'Shopee']
const UNIVERSITIES = [
  'ĐH Bách khoa Hà Nội',
  'ĐH Công nghệ – ĐHQGHN',
  'ĐH FPT',
  'Học viện Bưu chính Viễn thông',
  'ĐH Kinh tế Quốc dân',
]
const FAMILY = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô']
const MIDDLE = ['Văn', 'Thị', 'Minh', 'Thu', 'Đức', 'Ngọc', 'Hải', 'Thanh', 'Quang', 'Khánh']
const GIVEN = [
  'An',
  'Bình',
  'Châu',
  'Dũng',
  'Giang',
  'Hà',
  'Hiếu',
  'Huy',
  'Lan',
  'Linh',
  'Long',
  'Mai',
  'Nam',
  'Phương',
  'Quân',
  'Sơn',
  'Tâm',
  'Trang',
  'Tú',
  'Vy',
]

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')

// ---------- bảng dữ liệu ----------
export interface DepartmentRow {
  id: string
  name: string
  code: string
  createdAt: string
}

export interface UserRow {
  id: string
  email: string
  password: string
  fullName: string
  role: Role
  departmentId: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface JobRow {
  id: string
  title: string
  status: JobStatus
  location: string
  departmentId: string
  jdText: string
  jdVersion: number
  requirements: Requirement[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CandidateSkill {
  key: string
  years: number
  evidence: string
}

export interface CandidateRow {
  id: string
  /** Chuyên môn: backend, frontend, sales... */
  track: string
  fullName: string
  email: string
  /** null khi HR tải hộ không có số, hoặc đã ẩn danh */
  phone: string | null
  skills: CandidateSkill[]
  /** Kỹ năng AI "bịa" ra cho ứng viên này (để demo bằng chứng bị loại) */
  hallucinated: string | null
  cvText: string
  createdAt: string
  /** Khác null = đã ẩn danh (BR-DATA-03) */
  anonymizedAt: string | null
  anonymizedById: string | null
}

export interface ApplicationRow {
  id: string
  jobId: string
  candidateId: string
  source: ApplicationSource
  status: ApplicationStatus
  aiStatus: AiStatus
  aiError: string | null
  /** Thời điểm giả lập chấm xong (ms) khi đang PROCESSING */
  processingUntil: number | null
  score: number | null
  flags: ScoreFlag[]
  breakdown: BreakdownItem[]
  scoredJdVersion: number | null
  cvFileName: string
  /** F-FILE-02: text HR nhập tay cho CV không đọc được chữ */
  enteredCvText?: string
  cvTextEnteredAt?: string
  createdAt: string
}

export interface HistoryRow {
  id: string
  applicationId: string
  fromStatus: ApplicationStatus | null
  toStatus: ApplicationStatus
  reason: string | null
  changedById: string | null
  changedAt: string
}

export interface NoteRow {
  id: string
  applicationId: string
  authorId: string
  content: string
  createdAt: string
}

// ---------- phòng ban, user ----------
const departments: DepartmentRow[] = [
  { id: 'dep-eng', name: 'Kỹ thuật', code: 'ENG', createdAt: daysAgo(400) },
  { id: 'dep-sales', name: 'Kinh doanh', code: 'SALES', createdAt: daysAgo(400) },
  { id: 'dep-mkt', name: 'Marketing', code: 'MKT', createdAt: daysAgo(380) },
  { id: 'dep-hr', name: 'Nhân sự', code: 'HR', createdAt: daysAgo(380) },
]

const user = (
  id: string,
  email: string,
  fullName: string,
  role: Role,
  departmentId: string | null,
  isActive = true,
): UserRow => ({
  id,
  email,
  password: MOCK_PASSWORD,
  fullName,
  role,
  departmentId,
  isActive,
  lastLoginAt: isActive ? daysAgo(between(0, 5)) : null,
  createdAt: daysAgo(between(100, 300)),
  updatedAt: daysAgo(between(0, 50)),
})

// BR-ACC-03: chỉ Hiring Manager gắn phòng ban
const users: UserRow[] = [
  user('u-admin', 'admin@hireflow.dev', 'Quản trị viên', Role.Admin, null),
  user('u-hr', 'hr@hireflow.dev', 'Nguyễn Thu Hà', Role.Hr, null),
  user('u-hr2', 'hr2@hireflow.dev', 'Lê Minh Quân', Role.Hr, null, false),
  user('u-hm-eng', 'hm.eng@hireflow.dev', 'Trần Đức Long', Role.HiringManager, 'dep-eng'),
  user('u-hm-sales', 'hm.sales@hireflow.dev', 'Phạm Ngọc Lan', Role.HiringManager, 'dep-sales'),
  user('u-hm-mkt', 'hm.mkt@hireflow.dev', 'Vũ Hải Nam', Role.HiringManager, 'dep-mkt'),
]

// ---------- job ----------
const req = (
  label: string,
  type: RequirementType,
  weight: number,
  minYears: number | null,
  keywords: string[],
): Requirement => ({ id: uid('req'), label, type, weight, minYears, keywords })

interface JobSeed {
  title: string
  status: JobStatus
  departmentId: string
  location: string
  track: string
  jd: string
  requirements: Requirement[]
}

const jobSeeds: JobSeed[] = [
  {
    title: 'Backend Developer (NestJS)',
    status: 'OPEN',
    departmentId: 'dep-eng',
    location: 'Hà Nội',
    track: 'backend',
    jd: 'Chúng tôi tìm Backend Developer xây dựng API cho hệ thống tuyển dụng.\n\nYêu cầu:\n- Tối thiểu 2 năm kinh nghiệm NestJS.\n- Thành thạo PostgreSQL, biết tối ưu truy vấn.\n- Có kinh nghiệm Docker, Redis là lợi thế.\n\nQuyền lợi: lương cạnh tranh, review 2 lần/năm, làm việc hybrid.',
    requirements: [
      req('NestJS', 'MUST', 3, 2, ['nestjs', 'nest.js']),
      req('PostgreSQL', 'MUST', 2, 1, ['postgresql', 'postgres']),
      req('Docker', 'NICE', 1, null, ['docker']),
      req('Redis', 'NICE', 1, null, ['redis']),
    ],
  },
  {
    title: 'Frontend Developer (React)',
    status: 'OPEN',
    departmentId: 'dep-eng',
    location: 'Hà Nội / Remote',
    track: 'frontend',
    jd: 'Phát triển giao diện web cho sản phẩm SaaS phục vụ hàng nghìn doanh nghiệp.\n\nYêu cầu:\n- 2 năm kinh nghiệm React.\n- Thành thạo TypeScript.\n- Biết Tailwind CSS, có thói quen viết test là lợi thế.',
    requirements: [
      req('React', 'MUST', 3, 2, ['react', 'reactjs']),
      req('TypeScript', 'MUST', 2, null, ['typescript']),
      req('Tailwind CSS', 'NICE', 1, null, ['tailwind']),
      req('Unit test', 'NICE', 1, null, ['testing', 'jest', 'vitest']),
    ],
  },
  {
    title: 'QA Engineer',
    status: 'OPEN',
    departmentId: 'dep-eng',
    location: 'Đà Nẵng',
    track: 'qa',
    jd: 'Đảm bảo chất lượng sản phẩm trước mỗi lần phát hành.\n\nYêu cầu:\n- 1 năm kinh nghiệm kiểm thử thủ công, viết test case.\n- Biết kiểm thử tự động bằng Playwright là lợi thế.\n- Biết SQL cơ bản.',
    requirements: [
      req('Kiểm thử thủ công', 'MUST', 2, 1, ['manualtest']),
      req('Playwright', 'NICE', 2, null, ['playwright', 'selenium']),
      req('SQL', 'NICE', 1, null, ['sql']),
    ],
  },
  {
    title: 'DevOps Engineer',
    status: 'DRAFT',
    departmentId: 'dep-eng',
    location: 'Hồ Chí Minh',
    track: 'devops',
    jd: 'Vận hành hạ tầng cloud và tự động hoá quy trình triển khai.\n\nYêu cầu: Kubernetes, CI/CD, AWS. Ưu tiên ứng viên từng vận hành hệ thống có tải lớn.',
    requirements: [
      req('Kubernetes', 'MUST', 3, 2, ['kubernetes', 'k8s']),
      req('CI/CD', 'MUST', 2, null, ['cicd', 'github actions']),
      req('AWS', 'NICE', 2, null, ['aws']),
    ],
  },
  {
    title: 'Sales Executive',
    status: 'OPEN',
    departmentId: 'dep-sales',
    location: 'Hồ Chí Minh',
    track: 'sales',
    jd: 'Tìm kiếm và chăm sóc khách hàng doanh nghiệp cho giải pháp phần mềm nhân sự.\n\nYêu cầu: 1 năm kinh nghiệm bán hàng B2B, biết dùng CRM, tiếng Anh giao tiếp.',
    requirements: [
      req('Bán hàng B2B', 'MUST', 3, 1, ['b2b']),
      req('CRM', 'NICE', 1, null, ['crm']),
      req('Tiếng Anh', 'NICE', 2, null, ['english', 'ielts']),
    ],
  },
  {
    title: 'Account Manager',
    status: 'CLOSED',
    departmentId: 'dep-sales',
    location: 'Hà Nội',
    track: 'sales',
    jd: 'Quản lý danh mục khách hàng hiện có, đảm bảo tỉ lệ gia hạn hợp đồng.\n\nYêu cầu: 3 năm bán hàng B2B, tiếng Anh tốt.',
    requirements: [
      req('Bán hàng B2B', 'MUST', 3, 3, ['b2b']),
      req('Tiếng Anh', 'MUST', 2, null, ['english']),
    ],
  },
  {
    title: 'Digital Marketing Specialist',
    status: 'OPEN',
    departmentId: 'dep-mkt',
    location: 'Hà Nội',
    track: 'marketing',
    jd: 'Lên kế hoạch và triển khai các kênh marketing số để tăng lượng ứng viên và khách hàng.\n\nYêu cầu: SEO, Google Ads, viết content tốt.',
    requirements: [
      req('SEO', 'MUST', 2, 1, ['seo']),
      req('Google Ads', 'MUST', 2, null, ['googleads', 'google ads']),
      req('Content', 'NICE', 1, null, ['content']),
    ],
  },
  {
    title: 'HR Business Partner',
    status: 'DRAFT',
    departmentId: 'dep-hr',
    location: 'Hà Nội',
    track: 'hr',
    jd: 'Đồng hành cùng các phòng ban trong tuyển dụng và phát triển đội ngũ.\n\nYêu cầu: 3 năm tuyển dụng IT, tiếng Anh tốt.',
    requirements: [
      req('Tuyển dụng', 'MUST', 3, 3, ['recruitment']),
      req('Tiếng Anh', 'NICE', 1, null, ['english']),
    ],
  },
]

const jobs: JobRow[] = jobSeeds.map((seed, i) => {
  const createdAt = daysAgo(60 - i * 5)
  return {
    id: uid('job'),
    title: seed.title,
    status: seed.status,
    location: seed.location,
    departmentId: seed.departmentId,
    jdText: seed.jd,
    jdVersion: 1,
    requirements: seed.requirements,
    publishedAt: seed.status === 'DRAFT' ? null : daysAgo(50 - i * 5),
    createdAt,
    updatedAt: createdAt,
  }
})
const jobTrack = new Map(jobs.map((job, i) => [job.id, jobSeeds[i].track]))

// ---------- ứng viên ----------
type CvSource = Pick<CandidateRow, 'fullName' | 'email' | 'phone' | 'skills'>

function buildCvText(c: CvSource, track: string): string {
  const uni = pick(UNIVERSITIES)
  const lines = [
    c.fullName.toUpperCase(),
    c.phone ? `Email: ${c.email} · Điện thoại: ${c.phone}` : `Email: ${c.email}`,
    '',
    'MỤC TIÊU',
    `Phát triển sự nghiệp ở vị trí ${track} trong môi trường sản phẩm.`,
    '',
    'KINH NGHIỆM',
    ...c.skills.map((s) => `- ${s.evidence}.`),
    '',
    'KỸ NĂNG',
    c.skills.map((s) => SKILLS[s.key].label).join(', '),
    '',
    'HỌC VẤN',
    `Cử nhân, ${uni} (${between(2012, 2022)})`,
  ]
  return lines.join('\n')
}

export function createCandidate(
  track: string,
  fullName?: string,
  email?: string,
  phone?: string | null,
): CandidateRow {
  const name = fullName ?? `${pick(FAMILY)} ${pick(MIDDLE)} ${pick(GIVEN)}`
  const keys = shuffle(TRACKS[track] ?? TRACKS.backend).slice(0, between(2, 5))
  const skills: CandidateSkill[] = keys.map((key) => {
    const years = between(1, 12) / 2
    return { key, years, evidence: SKILLS[key].sentence(years, pick(COMPANIES)) }
  })
  const base = {
    id: uid('cand'),
    track,
    fullName: name,
    email: email ?? `${slug(name)}.${between(10, 99)}@example.com`,
    phone: phone === undefined ? `09${between(10000000, 99999999)}` : phone,
    skills,
    hallucinated: chance(0.15) ? pick(TRACKS[track] ?? []) : null,
  }
  return {
    ...base,
    cvText: buildCvText(base, track),
    createdAt: new Date().toISOString(),
    anonymizedAt: null,
    anonymizedById: null,
  }
}

const trackNames = Object.keys(TRACKS)
const candidates: CandidateRow[] = Array.from({ length: 90 }, () =>
  createCandidate(pick(trackNames)),
)

// ---------- chấm điểm (giống công thức BE) ----------
export function scoreFor(job: JobRow, candidate: CandidateRow) {
  const flags = new Set<ScoreFlag>()
  const breakdown: BreakdownItem[] = job.requirements.map((r) => {
    const skill = candidate.skills.find((s) => r.keywords.includes(s.key))
    if (!skill) {
      // LLM "bịa" kỹ năng → code kiểm không thấy trong CV → loại bằng chứng
      if (candidate.hallucinated && r.keywords.includes(candidate.hallucinated)) {
        flags.add('UNVERIFIED_EVIDENCE')
        return {
          requirementId: r.id,
          match: 0,
          evidence: null,
          rejectedEvidence: `${between(3, 6)} năm kinh nghiệm chuyên sâu ${r.label} tại tập đoàn đa quốc gia`,
        }
      }
      return { requirementId: r.id, match: 0, evidence: null, rejectedEvidence: null }
    }
    const match: MatchLevel = r.minYears == null || skill.years >= r.minYears ? 1 : 0.5
    return { requirementId: r.id, match, evidence: skill.evidence, rejectedEvidence: null }
  })
  if (job.requirements.some((r, i) => r.type === 'MUST' && breakdown[i].match === 0)) {
    flags.add('MISSING_MUST')
  }
  const score = computeScore(
    job.requirements.map((r, i) => ({ weight: r.weight, match: breakdown[i].match })),
  )
  return { score, breakdown, flags: [...flags] }
}

export function applyScore(app: ApplicationRow) {
  const job = jobs.find((j) => j.id === app.jobId)!
  const candidate = candidates.find((c) => c.id === app.candidateId)!
  Object.assign(app, scoreFor(job, candidate), {
    aiStatus: 'DONE',
    aiError: null,
    processingUntil: null,
    scoredJdVersion: job.jdVersion,
  })
}

/** Hồ sơ đang PROCESSING tự "chấm xong" khi tới hạn – gọi trước mỗi lần đọc */
export function settleProcessing() {
  const now = Date.now()
  for (const app of applications) {
    if (app.aiStatus === 'PROCESSING' && app.processingUntil && now >= app.processingUntil) {
      applyScore(app)
    }
  }
}

// ---------- hồ sơ ứng tuyển + lịch sử ----------
const applications: ApplicationRow[] = []
const history: HistoryRow[] = []
const notes: NoteRow[] = []

const FORWARD: ApplicationStatus[] = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED']
const STATUS_WEIGHTS: [ApplicationStatus, number][] = [
  ['NEW', 30],
  ['SCREENING', 24],
  ['INTERVIEW', 14],
  ['OFFER', 6],
  ['HIRED', 5],
  ['REJECTED', 16],
  ['WITHDRAWN', 5],
]
const REJECT_REASONS = [
  'Chưa đủ số năm kinh nghiệm yêu cầu',
  'Kỹ năng chưa phù hợp với vị trí',
  'Mức lương kỳ vọng vượt ngân sách',
  'Không đạt vòng phỏng vấn kỹ thuật',
]
const NOTE_SAMPLES = [
  'Ứng viên trả lời tốt phần thiết kế hệ thống.',
  'Cần hỏi thêm về kinh nghiệm làm việc nhóm.',
  'Đã gọi điện xác nhận lịch phỏng vấn.',
  'Hiring Manager muốn gặp trực tiếp ứng viên này.',
]

function weightedStatus(): ApplicationStatus {
  let r = rand() * 100
  for (const [status, w] of STATUS_WEIGHTS) {
    if ((r -= w) < 0) return status
  }
  return 'NEW'
}

function buildHistory(app: ApplicationRow) {
  let at = new Date(app.createdAt).getTime()
  const push = (from: ApplicationStatus | null, to: ApplicationStatus, reason: string | null) => {
    history.push({
      id: uid('his'),
      applicationId: app.id,
      fromStatus: from,
      toStatus: to,
      reason,
      changedById: from === null ? null : pick(['u-hr', 'u-hr', 'u-hm-eng']),
      changedAt: new Date(at).toISOString(),
    })
    at += between(1, 4) * DAY
  }
  push(null, 'NEW', null)

  const terminal = app.status === 'REJECTED' || app.status === 'WITHDRAWN'
  const stopAt = terminal ? between(0, 3) : FORWARD.indexOf(app.status)
  for (let i = 1; i <= stopAt; i++) push(FORWARD[i - 1], FORWARD[i], null)
  if (terminal) {
    push(
      FORWARD[stopAt],
      app.status,
      app.status === 'REJECTED' ? pick(REJECT_REASONS) : 'Ứng viên đã nhận việc nơi khác',
    )
  }
}

export function addApplication(
  job: JobRow,
  candidate: CandidateRow,
  fields: Partial<ApplicationRow> = {},
): ApplicationRow {
  const app: ApplicationRow = {
    id: uid('app'),
    jobId: job.id,
    candidateId: candidate.id,
    source: 'PUBLIC_FORM',
    status: 'NEW',
    aiStatus: 'DONE',
    aiError: null,
    processingUntil: null,
    score: null,
    flags: [],
    breakdown: [],
    scoredJdVersion: null,
    cvFileName: `CV_${slug(candidate.fullName).replace(/\./g, '_')}.pdf`,
    createdAt: new Date().toISOString(),
    ...fields,
  }
  if (app.aiStatus === 'DONE') applyScore(app)
  applications.push(app)
  return app
}

const openJobs = jobs.filter((j) => j.status !== 'DRAFT')
for (const candidate of candidates) {
  // Ứng viên nộp vào 1–2 job, ưu tiên job cùng chuyên môn
  const sameTrack = openJobs.filter((j) => jobTrack.get(j.id) === candidate.track)
  const targets = new Set([pick(sameTrack.length ? sameTrack : openJobs)])
  if (chance(0.25)) targets.add(pick(openJobs))

  for (const job of targets) {
    const app = addApplication(job, candidate, {
      status: weightedStatus(),
      createdAt: daysAgo(between(1, 45)),
    })
    buildHistory(app)
    if (chance(0.2)) {
      notes.push({
        id: uid('note'),
        applicationId: app.id,
        authorId: pick(['u-hr', 'u-hm-eng', 'u-hm-sales']),
        content: pick(NOTE_SAMPLES),
        createdAt: daysAgo(between(0, 10)),
      })
    }
  }
}

// Ứng viên "vào hệ thống" từ lần nộp đầu tiên – để cursor theo createdAt có nghĩa
for (const candidate of candidates) {
  const first = applications
    .filter((a) => a.candidateId === candidate.id)
    .reduce((min, a) => (a.createdAt < min ? a.createdAt : min), candidate.createdAt)
  candidate.createdAt = first
}
// Vài hồ sơ HR tải hộ để cột "Nguồn" có dữ liệu
applications.filter((_, i) => i % 9 === 0).forEach((a) => (a.source = 'HR_UPLOAD'))

// Vài hồ sơ để demo trạng thái AI: lỗi và đang chấm (tự xong sau ít giây)
const newest = applications
  .filter((a) => a.status === 'NEW')
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
for (const app of newest.slice(0, 2)) {
  Object.assign(app, {
    aiStatus: 'FAILED',
    score: null,
    flags: [],
    breakdown: [],
    aiError: 'Không đọc được nội dung PDF (có thể là file scan)',
  })
}
newest.slice(2, 4).forEach((app, i) => {
  Object.assign(app, {
    aiStatus: 'PROCESSING',
    score: null,
    flags: [],
    breakdown: [],
    processingUntil: Date.now() + (15 + i * 10) * 1000,
  })
})

// F-NOTI-01: thông báo CV chấm xong cho người tạo tin và Hiring Manager của phòng
export interface NotificationRow {
  id: string
  userId: string
  type: 'CV_SCORED' | 'CV_FAILED'
  applicationId: string
  readAt: string | null
  createdAt: string
}

const notifications: NotificationRow[] = applications
  .filter((a) => a.aiStatus === 'DONE' || a.aiStatus === 'FAILED')
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .slice(0, 30)
  .flatMap((app, i) => {
    const job = jobs.find((j) => j.id === app.jobId)!
    const recipients = users.filter(
      (u) =>
        u.isActive &&
        (u.role === Role.Hr ||
          (u.role === Role.HiringManager && u.departmentId === job.departmentId)),
    )
    return recipients.map((u, k) => ({
      id: uid('noti'),
      userId: u.id,
      type: app.aiStatus === 'FAILED' ? ('CV_FAILED' as const) : ('CV_SCORED' as const),
      applicationId: app.id,
      readAt: i < 3 ? null : app.createdAt,
      createdAt: new Date(new Date(app.createdAt).getTime() + 60_000 + k).toISOString(),
    }))
  })

// F-AUDIT-01: dựng từ lịch sử trạng thái (bỏ dòng tạo hồ sơ)
export interface AuditRow {
  id: string
  actorId: string | null
  action: string
  entity: string
  entityId: string | null
  metadata: Record<string, string | number | boolean | null>
  ip: string | null
  requestId: string | null
  createdAt: string
}

const auditLogs: AuditRow[] = history
  .filter((h) => h.fromStatus !== null)
  .map((h) => ({
    id: uid('audit'),
    actorId: h.changedById,
    action: 'APPLICATION_STATUS_CHANGED',
    entity: 'application',
    entityId: h.applicationId,
    metadata: { from: h.fromStatus, to: h.toStatus, reason: h.reason },
    ip: '203.0.113.10',
    requestId: null,
    createdAt: h.changedAt,
  }))

export const db = {
  departments,
  users,
  jobs,
  candidates,
  applications,
  history,
  notes,
  notifications,
  auditLogs,
}
