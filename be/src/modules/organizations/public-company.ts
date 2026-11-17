import type { DataSource } from 'typeorm';

/** KH MVP 3 mục 8.1: khối công ty trên tin công khai */
export interface PublicCompanyRef {
  name: string;
  slug: string;
  /** Đường dẫn sau apiUrl, ví dụ /public/media/<sha256>.png */
  logoUrl: string | null;
  tagline: string;
}

// BR-TEN-01: tên hiển thị lấy từ hồ sơ công ty, chưa có thì dùng tên đăng ký trên sàn
export async function publicCompanyRefs(
  ds: DataSource,
  organizationIds: string[],
): Promise<Map<string, PublicCompanyRef>> {
  if (!organizationIds.length) return new Map();
  const rows = await ds.query<
    { id: string; slug: string; name: string; tagline: string | null; logoKey: string | null }[]
  >(
    `SELECT o.id, o.slug, COALESCE(NULLIF(cp.name, ''), o.name) AS name, cp.tagline,
       m.storage_key AS "logoKey"
     FROM organizations o
     LEFT JOIN company_profile cp ON cp.organization_id = o.id
     LEFT JOIN media_files m ON m.id = cp.logo_media_id AND m.deleted_at IS NULL
     WHERE o.id = ANY($1)`,
    [[...new Set(organizationIds)]],
  );
  return new Map(
    rows.map((r) => [
      r.id,
      {
        name: r.name,
        slug: r.slug,
        logoUrl: r.logoKey ? `/public/${r.logoKey}` : null,
        tagline: r.tagline ?? '',
      },
    ]),
  );
}
