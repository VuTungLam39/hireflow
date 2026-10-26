// BR-DATA-01
const SENSITIVE_PARAMS = new Set(['search', 'q', 'email', 'phone']);

export function safeUrl(url: string): string {
  const index = url.indexOf('?');
  if (index < 0) return url;
  const params = new URLSearchParams(url.slice(index + 1));
  for (const key of [...params.keys()]) {
    if (SENSITIVE_PARAMS.has(key.toLowerCase())) params.set(key, '***');
  }
  const query = params.toString().replace(/%2A%2A%2A/g, '***');
  return query ? `${url.slice(0, index)}?${query}` : url.slice(0, index);
}
