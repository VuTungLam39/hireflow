// MVP 3 · US-22: load test API công khai của sàn (k6), không cần đăng nhập
// BASE_URL=http://localhost:3001 k6 run scripts/public.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = `${__ENV.BASE_URL ?? 'http://localhost:3001'}/api/v1`;
const APIS = ['list', 'search_jd', 'company_location', 'detail', 'companies'];

export const options = {
  scenarios: {
    visitors: {
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
    ...Object.fromEntries(APIS.map((api) => [`http_req_duration{api:${api}}`, ['p(95)<300']])),
  },
};

export function setup() {
  const res = http.get(`${BASE}/public/jobs?limit=50`);
  const jobs = res.json('data') ?? [];
  if (!jobs.length) throw new Error('Không có tin công khai để đo');
  return { jobIds: jobs.map((j) => j.id), company: jobs[0].company.slug };
}

export default function ({ jobIds, company }) {
  const tag = (api) => ({ tags: { api } });
  const jobId = jobIds[Math.floor(Math.random() * jobIds.length)];
  const page = 1 + Math.floor(Math.random() * 5);
  const calls = [
    ['list', `${BASE}/public/jobs?limit=12&page=${page}`],
    // Tìm cả trong JD: f_unaccent(lower(jd_text)) LIKE, không có index
    ['search_jd', `${BASE}/public/jobs?limit=12&search=${encodeURIComponent('postgresql')}`],
    ['company_location', `${BASE}/public/jobs?limit=12&company=${company}&location=ha%20noi`],
    ['detail', `${BASE}/public/jobs/${jobId}`],
    ['companies', `${BASE}/public/companies?limit=24`],
  ];
  for (const [api, url] of calls) {
    const res = http.get(url, tag(api));
    check(res, { [`${api} 200`]: (r) => r.status === 200 });
  }
  sleep(1);
}
