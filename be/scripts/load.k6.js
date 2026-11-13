// Load test các API đọc chính của HR trên DB perf 200k hồ sơ (k6)
// BASE_URL=http://localhost:3001 K6_EMAIL=... K6_PASSWORD=... k6 run scripts/load.k6.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE = `${__ENV.BASE_URL ?? 'http://localhost:3001'}/api/v1`;

export const options = {
  scenarios: {
    hr_workload: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
    ...Object.fromEntries(
      ['applications', 'applications_filtered', 'jobs', 'ranking', 'candidates', 'dashboard', 'funnel'].map((api) => [
        `http_req_duration{api:${api}}`,
        ['p(95)<300'],
      ]),
    ),
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: __ENV.K6_EMAIL, password: __ENV.K6_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (res.status !== 200 && res.status !== 201) throw new Error(`Đăng nhập lỗi ${res.status}`);
  const token = res.json('data.tokens.accessToken');
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const jobs = http.get(`${BASE}/jobs?limit=20&status=OPEN`, auth).json('data') ?? [];
  if (!jobs.length) throw new Error('Không có tin OPEN để đo');
  return { token, jobIds: jobs.map((j) => j.id) };
}

export default function ({ token, jobIds }) {
  const params = (api) => ({ headers: { Authorization: `Bearer ${token}` }, tags: { api } });
  const jobId = jobIds[Math.floor(Math.random() * jobIds.length)];
  const page = 1 + Math.floor(Math.random() * 5);

  group('HR làm việc', () => {
    const calls = [
      ['applications', `${BASE}/applications?limit=20&page=${page}`],
      ['applications_filtered', `${BASE}/applications?jobId=${jobId}&status=SCREENING&scoreMin=60&sortBy=score&limit=20`],
      ['jobs', `${BASE}/jobs?limit=20`],
      ['ranking', `${BASE}/jobs/${jobId}/ranking`],
      ['candidates', `${BASE}/candidates?limit=20`],
      ['dashboard', `${BASE}/dashboard/summary`],
      ['funnel', `${BASE}/dashboard/funnel`],
    ];
    const skip = (__ENV.SKIP ?? '').split(',');
    for (const [api, url] of calls.filter(([api]) => !skip.includes(api))) {
      const res = http.get(url, params(api));
      check(res, { [`${api} 200`]: (r) => r.status === 200 });
    }
  });
  sleep(1);
}
