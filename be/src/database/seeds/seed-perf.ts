import { fakerVI as f } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum.js';
import { Department } from '../../modules/departments/entities/department.entity.js';
import { JobStatus } from '../../modules/jobs/entities/job.entity.js';
import { User } from '../../modules/users/entities/user.entity.js';
import dataSource from '../data-source.js';
import type { TRACKS } from './factories.js';
import { insertBatches, seedCandidates, seedJobs, type SeedContext } from './seed-data.js';

// Database Design 7
const DEPARTMENTS = 10;
const HR_USERS = 9;
const MANAGERS_PER_DEPARTMENT = 2;
const JOBS = 200;
const CANDIDATES = 50_000;
const APPS_PER_CANDIDATE = 4;
const INTERVIEWERS = 20;

const TRACK_OF: (keyof typeof TRACKS)[] = ['ENG', 'SALES', 'MKT'];
const NAMES = ['Kỹ thuật', 'Kinh doanh', 'Marketing'];

const TABLES = [
  'audit_logs',
  'notifications',
  'interview_feedbacks',
  'interview_assignees',
  'interviews',
  'job_matches',
  'application_notes',
  'application_status_history',
  'applications',
  'cv_files',
  'candidates',
  'job_requirements',
  'jobs',
  'refresh_tokens',
  'users',
  'departments',
];

async function seedPerf() {
  const database = String(dataSource.options.database);
  if (!database.endsWith('_perf') && !process.argv.includes('--force')) {
    throw new Error(`Refusing to wipe "${database}". Use a *_perf database or pass --force.`);
  }

  const started = Date.now();
  const elapsed = () => `${((Date.now() - started) / 1000).toFixed(1)}s`;
  await dataSource.initialize();
  f.seed(42);

  await dataSource.query(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} CASCADE`);

  const departments = Array.from({ length: DEPARTMENTS }, (_, i) => ({
    id: f.string.uuid(),
    name: `${NAMES[i % 3]} ${Math.floor(i / 3) + 1}`,
    code: `D${String(i + 1).padStart(2, '0')}`,
  }));
  await insertBatches(dataSource, Department, departments);

  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123', 10);
  const user = (email: string, role: Role, departmentId: string | null = null) => ({
    id: f.string.uuid(),
    email,
    fullName: f.person.fullName(),
    role,
    departmentId,
    passwordHash,
  });
  const admin = user('admin@perf.local', Role.Admin);
  const hrs = Array.from({ length: HR_USERS }, (_, i) =>
    user(`hr${String(i + 1).padStart(2, '0')}@perf.local`, Role.Hr),
  );
  const managers = departments.flatMap((d, i) =>
    Array.from({ length: MANAGERS_PER_DEPARTMENT }, (_, k) =>
      user(
        `hm${String(i * MANAGERS_PER_DEPARTMENT + k + 1).padStart(2, '0')}@perf.local`,
        Role.HiringManager,
        d.id,
      ),
    ),
  );
  const interviewers = Array.from({ length: INTERVIEWERS }, (_, i) =>
    user(`iv${String(i + 1).padStart(2, '0')}@perf.local`, Role.Interviewer),
  );
  await insertBatches(dataSource, User, [admin, ...hrs, ...managers, ...interviewers]);

  const ctx: SeedContext = {
    departments: departments.map((d, i) => ({ id: d.id, track: TRACK_OF[i % 3] })),
    hrIds: hrs.map((u) => u.id),
    managerIds: new Map(
      departments.map((d) => [
        d.id,
        managers.filter((m) => m.departmentId === d.id).map((m) => m.id),
      ]),
    ),
    adminId: admin.id,
  };

  const jobs = await seedJobs(dataSource, f, ctx, JOBS, (i) =>
    i % 20 === 19 ? JobStatus.Draft : i % 10 === 9 ? JobStatus.Closed : JobStatus.Open,
  );
  console.log(
    `${departments.length} departments, ${1 + hrs.length + managers.length + interviewers.length} users, ${jobs.length} jobs (${elapsed()})`,
  );

  const result = await seedCandidates(dataSource, f, ctx, jobs, {
    candidates: CANDIDATES,
    appsPerCandidate: () => APPS_PER_CANDIDATE,
    onChunk: (done) => console.log(`  candidates ${done}/${CANDIDATES} (${elapsed()})`),
  });
  console.log(`${result.applications} applications, ${result.history} history rows (${elapsed()})`);

  // MVP 2: phỏng vấn, thông báo, nhật ký kiểm toán theo dữ liệu hồ sơ đã có
  await dataSource.query(
    `INSERT INTO interviews (application_id, round, scheduled_at, duration_minutes, location, status, created_by)
     SELECT a.id, 1, a.created_at + interval '7 days', 60, 'Phòng họp tầng 3',
            (CASE WHEN a.status = 'INTERVIEW' THEN 'SCHEDULED' ELSE 'COMPLETED' END)::interview_status_enum, $1
     FROM applications a WHERE a.status IN ('INTERVIEW', 'OFFER', 'HIRED')`,
    [admin.id],
  );
  await dataSource.query(
    `INSERT INTO interview_assignees (interview_id, user_id)
     SELECT iv.id, ($1::uuid[])[1 + abs(hashtext(iv.id::text)) % cardinality($1::uuid[])] FROM interviews iv`,
    [interviewers.map((u) => u.id)],
  );
  await dataSource.query(
    `INSERT INTO notifications (user_id, type, application_id, created_at, read_at)
     SELECT j.created_by, 'CV_SCORED', a.id, a.created_at,
            CASE WHEN abs(hashtext(a.id::text)) % 10 <> 0 THEN a.created_at + interval '1 hour' END
     FROM applications a JOIN jobs j ON j.id = a.job_id`,
  );
  await dataSource.query(
    `INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata, created_at)
     SELECT h.changed_by, 'APPLICATION_STATUS_CHANGED', 'application', h.application_id,
            jsonb_build_object('from', h.from_status, 'to', h.to_status), h.changed_at
     FROM application_status_history h WHERE h.from_status IS NOT NULL`,
  );
  console.log(`interviews, notifications, audit logs (${elapsed()})`);

  await dataSource.query('VACUUM (ANALYZE)');
  console.log(`VACUUM ANALYZE done (${elapsed()}). Mật khẩu: SEED_ADMIN_PASSWORD`);
  await dataSource.destroy();
}

seedPerf().catch(async (error) => {
  console.error('Seed perf failed:', error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
