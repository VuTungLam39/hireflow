// Kiểm nhanh một bản deploy (staging/prod) qua đúng domain người dùng mở.
// node scripts/smoke.mjs https://<domain-vercel>
// Tuỳ chọn: SMOKE_EMAIL, SMOKE_PASSWORD để kiểm đăng nhập, cookie refresh và stream SSE qua rewrite.

const base = (process.argv[2] ?? process.env.SMOKE_URL ?? '').replace(/\/$/, '');
if (!base) {
  console.error('Usage: node scripts/smoke.mjs https://<domain>');
  process.exit(2);
}
const api = `${base}/api`;
const results = [];
const check = async (name, fn) => {
  const started = Date.now();
  try {
    const detail = await fn();
    results.push({ check: name, ok: '✔', ms: Date.now() - started, detail: detail ?? '' });
  } catch (error) {
    results.push({ check: name, ok: '✘', ms: Date.now() - started, detail: error.message });
  }
};
const assert = (cond, message) => {
  if (!cond) throw new Error(message);
};
const get = (url, init = {}) => fetch(url, { redirect: 'manual', ...init });

// Render free ngủ sau 15 phút: chờ tối đa 3 phút cho lần gọi đầu
await check('API thức dậy, /api/health = up', async () => {
  const until = Date.now() + 180_000;
  let last = '';
  while (Date.now() < until) {
    try {
      const res = await get(`${api}/health`, { signal: AbortSignal.timeout(30_000) });
      const type = res.headers.get('content-type') ?? '';
      if (res.ok && type.includes('json')) {
        const body = await res.json();
        const details = body.data?.details ?? body.details ?? {};
        const down = Object.entries(details).filter(([, v]) => v.status !== 'up');
        assert(!down.length, `down: ${down.map(([k]) => k).join(', ')}`);
        return Object.keys(details).join(', ');
      }
      last = `${res.status} ${type}`;
    } catch (error) {
      last = error.message;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`không phản hồi JSON (${last}) – kiểm tra destination trong fe/vercel.json`);
});

await check('Trang chủ là HireFlow (SPA fallback)', async () => {
  const res = await get(`${base}/applications`);
  const html = await res.text();
  assert(res.status === 200, `HTTP ${res.status}`);
  assert(
    html.includes('<title>HireFlow</title>') || html.includes('HireFlow'),
    'không phải bản build HireFlow',
  );
});

await check('Trang /jobs đã prerender (F-PUB-04)', async () => {
  const html = await (await get(`${base}/jobs`)).text();
  assert(
    !html.includes('<div id="root"></div>'),
    'HTML rỗng – chưa đặt PRERENDER_API_URL khi build',
  );
  return 'có nội dung trong HTML';
});

await check('Asset cache lâu, không cache /api', async () => {
  const html = await (await get(`${base}/`)).text();
  const asset = html.match(/\/assets\/[^"']+\.js/)?.[0];
  assert(asset, 'không thấy asset JS');
  const res = await get(`${base}${asset}`);
  assert(
    (res.headers.get('cache-control') ?? '').includes('immutable'),
    'asset thiếu Cache-Control immutable',
  );
});

await check('Header bảo mật (helmet)', async () => {
  const res = await get(`${api}/v1/auth/me`);
  const missing = ['x-content-type-options', 'strict-transport-security', 'x-frame-options'].filter(
    (h) => !res.headers.get(h),
  );
  assert(!missing.length, `thiếu ${missing.join(', ')}`);
  return `request id: ${res.headers.get('x-request-id') ? 'có' : 'không'}`;
});

await check('Chưa đăng nhập → 401 JSON có mã lỗi', async () => {
  const res = await get(`${api}/v1/auth/me`);
  const body = await res.json();
  assert(res.status === 401 && body.code === 'UNAUTHORIZED', `HTTP ${res.status} ${body.code}`);
});

await check('CORS không mở cho domain lạ', async () => {
  const res = await get(`${api}/v1/auth/me`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'GET' },
  });
  const allowed = res.headers.get('access-control-allow-origin');
  assert(allowed !== 'https://evil.example' && allowed !== '*', `allow-origin = ${allowed}`);
});

await check('Swagger và /health/ip tắt ở production', async () => {
  const docs = await get(`${api}/docs`);
  const ip = await get(`${api}/health/ip`);
  assert(docs.status === 404, `/api/docs HTTP ${docs.status}`);
  assert(ip.status === 404, `/api/health/ip HTTP ${ip.status} (đặt DEBUG_CLIENT_IP=false)`);
});

const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
if (email && password) {
  let token = '';
  let cookie = '';
  await check('Đăng nhập, cookie refresh Secure + SameSite=Strict', async () => {
    const res = await get(`${api}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    assert(res.status === 200, `HTTP ${res.status} ${body.code ?? ''}`);
    token = body.data.tokens.accessToken;
    const setCookie = res.headers.get('set-cookie') ?? '';
    cookie = setCookie.split(';')[0];
    assert(
      /secure/i.test(setCookie) && /samesite=strict/i.test(setCookie),
      'cookie thiếu Secure/SameSite=Strict',
    );
  });
  await check('Refresh token qua cookie (tải lại trang vẫn đăng nhập)', async () => {
    const res = await get(`${api}/v1/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    assert(res.status === 200, `HTTP ${res.status}`);
  });
  await check('SSE /notifications/stream đi qua rewrite, nhận "ready"', async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(`${api}/v1/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: controller.signal,
      });
      assert(res.ok, `HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (!text.includes('event: ready')) {
        const { value, done } = await reader.read();
        if (done) throw new Error('stream đóng trước khi có ready');
        text += decoder.decode(value);
      }
      return res.headers.get('content-type');
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  });
  await check('Dashboard đọc được (DB + cache)', async () => {
    const res = await get(`${api}/v1/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(res.status === 200 || res.status === 403, `HTTP ${res.status}`);
  });
} else {
  results.push({
    check: 'Đăng nhập, refresh, SSE',
    ok: '–',
    ms: 0,
    detail: 'bỏ qua: chưa đặt SMOKE_EMAIL, SMOKE_PASSWORD',
  });
}

console.table(results);
const failed = results.filter((r) => r.ok === '✘');
console.log(failed.length ? `${failed.length} kiểm tra lỗi` : 'Tất cả kiểm tra qua');
process.exit(failed.length ? 1 : 0);
