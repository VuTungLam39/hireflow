import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { orgIdOf } from '../../common/utils/department-scope.js';
import { notExpiredSql } from '../../common/utils/vn-date.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity.js';
import { StorageService } from '../files/storage/storage.service.js';
import { PrerenderHookService } from '../jobs/prerender-hook.service.js';
import { UpdateCompanyDto, UpdateMediaDto, UploadMediaDto } from './dto/company.dto.js';
import {
  CompanyProfile,
  type CompanyBenefit,
  type CompanyMilestone,
  type CompanyOffice,
  type CompanySize,
  type CompanySocials,
} from './entities/company-profile.entity.js';
import { Organization, OrganizationStatus } from '../organizations/entities/organization.entity.js';
import { PaginatedResult } from '../../common/dto/paginated-result.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { escapeLike } from '../../common/utils/text.js';
import { QueryPublicJobsDto } from '../jobs/dto/query-public-jobs.dto.js';
import { JobsService, type PublicJobSummaryView } from '../jobs/jobs.service.js';
import { MediaFile, MediaKind } from './entities/media-file.entity.js';
import { checkImage, GALLERY_MAX, MEDIA_KEY, type UploadedImage } from './media.rules.js';

type Actor = Pick<AuthUser, 'id' | 'organizationId'>;

export interface MediaView {
  id: string;
  kind: MediaKind;
  /** Đường dẫn sau apiUrl, ví dụ /public/media/<sha256>.png */
  url: string;
  width: number;
  height: number;
  alt: string;
  position: number;
}

export interface CompanyContentView {
  name: string;
  tagline: string;
  about: string;
  sizeRange: CompanySize | null;
  industries: string[];
  foundedYear: number | null;
  website: string | null;
  socials: CompanySocials;
  benefits: CompanyBenefit[];
  offices: CompanyOffice[];
  milestones: CompanyMilestone[];
  logo: MediaView | null;
  cover: MediaView | null;
  gallery: MediaView[];
}

export interface CompanyView extends CompanyContentView {
  /** BR-ORG-01: đủ tên, logo, giới thiệu thì trang /careers mới hiện */
  complete: boolean;
  updatedAt: Date;
}

export interface PublicCompanyView extends CompanyContentView {
  slug: string;
  openJobs: number;
  // US-23: toàn bộ tin đang tuyển của công ty
  jobs: PublicJobSummaryView[];
}

/** KH MVP 3 mục 8.1 · US-23 */
export interface PublicCompanyCard {
  slug: string;
  name: string;
  logoUrl: string | null;
  tagline: string;
  industries: string[];
  openJobs: number;
}

export const COMPANY_JOBS_LIMIT = 100;

export const mediaUrl = (storageKey: string) => `/public/${storageKey}`;

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(CompanyProfile) private readonly profiles: Repository<CompanyProfile>,
    @InjectRepository(MediaFile) private readonly media: Repository<MediaFile>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly prerender: PrerenderHookService,
    private readonly jobs: JobsService,
  ) {}

  // F-ORG-01
  async get(user: Pick<AuthUser, 'organizationId'>): Promise<CompanyView> {
    const profile = await this.readProfile(orgIdOf(user));
    const content = await this.content(profile);
    return { ...content, complete: isComplete(content), updatedAt: profile.updatedAt };
  }

  async update(dto: UpdateCompanyDto, user: Actor): Promise<CompanyView> {
    const changed = Object.keys(dto).filter((k) => dto[k as keyof UpdateCompanyDto] !== undefined);
    await this.dataSource.transaction(async (manager) => {
      const profile = await this.lockProfile(manager, orgIdOf(user));
      Object.assign(profile, stripUndefined(dto), { updatedBy: user.id });
      await manager.getRepository(CompanyProfile).save(profile);
    });
    await this.changed(user, AuditAction.CompanyProfileUpdated, AuditEntity.Company, null, {
      fields: changed.join(','),
    });
    return this.get(user);
  }

  // BR-MEDIA-01, BR-MEDIA-02
  async upload(
    file: UploadedImage | undefined,
    dto: UploadMediaDto,
    user: Actor,
  ): Promise<MediaView> {
    const organizationId = orgIdOf(user);
    const image = checkImage(file, dto.kind);
    const alt = dto.alt?.trim() ?? '';
    if (dto.kind === MediaKind.Gallery) {
      if (alt.length < 2) {
        throw new BusinessException(
          ErrorCode.ValidationFailed,
          'Validation failed',
          HttpStatus.BAD_REQUEST,
          [
            {
              field: 'alt',
              messages: ['Mô tả ngắn nội dung ảnh để người dùng trình đọc màn hình hiểu'],
            },
          ],
        );
      }
      if ((await this.media.countBy({ organizationId, kind: MediaKind.Gallery })) >= GALLERY_MAX)
        throw galleryFull();
    }
    await this.storage.put(image.key, image.buffer, image.mime);

    const saved = await this.dataSource
      .transaction(async (manager) => {
        // Khoá dòng hồ sơ công ty: các lần tải đồng thời xếp hàng, đếm ảnh thư viện không bị vượt
        const profile = await this.lockProfile(manager, organizationId);
        if (
          dto.kind === MediaKind.Gallery &&
          (await manager
            .getRepository(MediaFile)
            .countBy({ organizationId, kind: MediaKind.Gallery })) >= GALLERY_MAX
        ) {
          throw galleryFull();
        }
        const position =
          dto.kind === MediaKind.Gallery
            ? ((
                await manager
                  .getRepository(MediaFile)
                  .createQueryBuilder('m')
                  .select('COALESCE(MAX(m.position), -1) + 1', 'next')
                  .where('m.organizationId = :organizationId', { organizationId })
                  .andWhere('m.kind = :kind', { kind: MediaKind.Gallery })
                  .getRawOne<{ next: number }>()
              )?.next ?? 0)
            : 0;
        const row = await manager.getRepository(MediaFile).save(
          manager.getRepository(MediaFile).create({
            organizationId,
            kind: dto.kind,
            storageKey: image.key,
            mime: image.mime,
            sizeBytes: image.size,
            width: image.width,
            height: image.height,
            sha256: image.sha256,
            altText: alt,
            position,
            createdBy: user.id,
          }),
        );
        if (dto.kind !== MediaKind.Gallery) {
          const field = dto.kind === MediaKind.Logo ? 'logoMediaId' : 'coverMediaId';
          const previous = profile[field];
          profile[field] = row.id;
          profile.updatedBy = user.id;
          await manager.getRepository(CompanyProfile).save(profile);
          if (previous) await manager.getRepository(MediaFile).softDelete(previous);
          return { row, previous };
        }
        return { row, previous: null };
      })
      .catch(async (error: unknown) => {
        // Bị từ chối trong transaction (vd. thư viện vừa đầy): gỡ file vừa tải nếu không ai dùng
        if (!(await this.media.existsBy({ storageKey: image.key }))) {
          await this.storage.remove(image.key).catch(() => undefined);
        }
        throw error;
      });
    if (saved.previous) await this.cleanupStorage(saved.previous);
    await this.changed(user, AuditAction.CompanyMediaAdded, AuditEntity.Media, saved.row.id, {
      kind: dto.kind,
    });
    return toMediaView(saved.row);
  }

  async updateMedia(id: string, dto: UpdateMediaDto, user: Actor): Promise<MediaView> {
    const row = await this.media.findOneBy({ id, organizationId: orgIdOf(user) });
    if (!row) throw new NotFoundException('Media not found');
    if (dto.alt !== undefined) row.altText = dto.alt;
    if (dto.position !== undefined) row.position = dto.position;
    await this.media.save(row);
    this.prerender.schedule('company.updated');
    return toMediaView(row);
  }

  async removeMedia(id: string, user: Actor): Promise<void> {
    const organizationId = orgIdOf(user);
    const row = await this.media.findOneBy({ id, organizationId });
    if (!row) throw new NotFoundException('Media not found');
    await this.dataSource.transaction(async (manager) => {
      if (row.kind !== MediaKind.Gallery) {
        const field = row.kind === MediaKind.Logo ? 'logoMediaId' : 'coverMediaId';
        await manager
          .getRepository(CompanyProfile)
          .update({ organizationId, [field]: id }, { [field]: null, updatedBy: user.id });
      }
      await manager.getRepository(MediaFile).softDelete(id);
    });
    await this.cleanupStorage(id);
    await this.changed(user, AuditAction.CompanyMediaRemoved, AuditEntity.Media, id, {
      kind: row.kind,
    });
  }

  // F-PUB-10 · US-23 · BR-ORG-01, BR-ORG-04: chỉ công ty ACTIVE có đủ tên, logo, giới thiệu
  async publicList(query: PaginationQueryDto): Promise<PaginatedResult<PublicCompanyCard>> {
    const params: unknown[] = [OrganizationStatus.Active];
    let filter = '';
    if (query.search?.trim()) {
      params.push(escapeLike(query.search.trim()));
      filter = `AND f_unaccent(lower(COALESCE(NULLIF(cp.name, ''), o.name))) LIKE '%' || f_unaccent(lower($${params.length})) || '%'`;
    }
    const from = `FROM organizations o
      JOIN company_profile cp ON cp.organization_id = o.id
      JOIN media_files logo ON logo.id = cp.logo_media_id AND logo.deleted_at IS NULL
      WHERE o.status = $1 AND cp.name <> '' AND cp.about <> '' ${filter}`;
    const [rows, [{ total }]] = await Promise.all([
      this.dataSource.query<(Omit<PublicCompanyCard, 'logoUrl'> & { logoKey: string })[]>(
        `SELECT o.slug, cp.name, cp.tagline, cp.industries, logo.storage_key AS "logoKey",
           (SELECT count(*)::int FROM jobs j WHERE j.organization_id = o.id AND j.status = 'OPEN'
             AND j.deleted_at IS NULL AND ${notExpiredSql('j')}) AS "openJobs"
         ${from}
         ORDER BY "openJobs" DESC, cp.name ASC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, query.limit, query.skip],
      ),
      this.dataSource.query<{ total: number }[]>(`SELECT count(*)::int AS total ${from}`, params),
    ]);
    return new PaginatedResult(
      rows.map(({ logoKey, ...r }) => ({ ...r, logoUrl: mediaUrl(logoKey) })),
      total,
      query.page,
      query.limit,
    );
  }

  // F-PUB-06, F-PUB-10 · US-23: slug lạ, công ty chưa ACTIVE hoặc hồ sơ chưa đủ → 404
  async publicBySlug(slug: string): Promise<PublicCompanyView> {
    const org = await this.dataSource.getRepository(Organization).findOne({
      select: { id: true, slug: true },
      where: { slug, status: OrganizationStatus.Active },
    });
    if (!org) throw new NotFoundException('Company not found');
    const content = await this.content(await this.readProfile(org.id));
    if (!isComplete(content)) {
      throw new BusinessException(
        ErrorCode.CompanyProfileIncomplete,
        'Company profile is not published yet',
        HttpStatus.NOT_FOUND,
      );
    }
    const jobs = await this.jobs.findPublic(
      Object.assign(new QueryPublicJobsDto(), { company: slug, limit: COMPANY_JOBS_LIMIT }),
    );
    return { ...content, slug: org.slug, openJobs: jobs.meta.totalItems, jobs: jobs.items };
  }

  /** BR-MEDIA-02: chỉ phục vụ khoá media/<sha256>.<ext> đang được dùng; không bao giờ cv/* */
  async publicMedia(file: string): Promise<{ body: Buffer; mime: string }> {
    const key = `media/${file}`;
    if (!MEDIA_KEY.test(key)) throw new NotFoundException('Media not found');
    const row = await this.media.findOne({ select: ['mime'], where: { storageKey: key } });
    if (!row) throw new NotFoundException('Media not found');
    return { body: await this.storage.get(key), mime: row.mime };
  }

  /** Chỉ đọc: chưa có dòng thì trả hồ sơ trống, không ghi DB (route công khai gọi hàm này) */
  private async readProfile(organizationId: string): Promise<CompanyProfile> {
    return (
      (await this.profiles.findOneBy({ organizationId })) ??
      this.profiles.create({
        organizationId,
        name: '',
        tagline: '',
        about: '',
        sizeRange: null,
        industries: [],
        foundedYear: null,
        website: null,
        socials: {},
        logoMediaId: null,
        coverMediaId: null,
        benefits: [],
        offices: [],
        milestones: [],
        updatedBy: null,
        updatedAt: new Date(0),
      })
    );
  }

  /** Ghi: tạo dòng nếu chưa có, rồi khoá FOR UPDATE tới hết transaction */
  private async lockProfile(
    manager: EntityManager,
    organizationId: string,
  ): Promise<CompanyProfile> {
    const repo = manager.getRepository(CompanyProfile);
    await repo.createQueryBuilder().insert().values({ organizationId }).orIgnore().execute();
    return repo.findOneOrFail({ where: { organizationId }, lock: { mode: 'pessimistic_write' } });
  }

  private async content(profile: CompanyProfile): Promise<CompanyContentView> {
    const rows = await this.media.find({
      where: { organizationId: profile.organizationId },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const pick = (id: string | null) => {
      const row = id ? byId.get(id) : undefined;
      return row ? toMediaView(row) : null;
    };
    return {
      name: profile.name,
      tagline: profile.tagline,
      about: profile.about,
      sizeRange: profile.sizeRange,
      industries: profile.industries,
      foundedYear: profile.foundedYear,
      website: profile.website,
      socials: profile.socials,
      benefits: profile.benefits,
      offices: profile.offices,
      milestones: [...profile.milestones].sort((a, b) => a.year - b.year),
      logo: pick(profile.logoMediaId),
      cover: pick(profile.coverMediaId),
      gallery: rows.filter((r) => r.kind === MediaKind.Gallery).map(toMediaView),
    };
  }

  /** Khoá theo nội dung: chỉ xoá file khi không còn dòng nào đang dùng */
  private async cleanupStorage(mediaId: string) {
    const row = await this.media.findOne({ where: { id: mediaId }, withDeleted: true });
    if (!row) return;
    const inUse = await this.media.existsBy({ storageKey: row.storageKey });
    if (!inUse) await this.storage.remove(row.storageKey).catch(() => undefined);
  }

  // BR-ORG-03
  private async changed(
    user: Actor,
    action: AuditAction,
    entity: AuditEntity,
    entityId: string | null,
    metadata: Record<string, string>,
  ) {
    this.prerender.schedule('company.updated');
    await this.audit.recordSafely({
      organizationId: orgIdOf(user),
      actorId: user.id,
      action,
      entity,
      entityId,
      metadata,
    });
  }
}

const galleryFull = () =>
  new BusinessException(
    ErrorCode.GalleryFull,
    `Gallery holds at most ${GALLERY_MAX} images`,
    HttpStatus.CONFLICT,
  );

const isComplete = (c: CompanyContentView) => !!c.name && !!c.logo && !!c.about;

const toMediaView = (row: MediaFile): MediaView => ({
  id: row.id,
  kind: row.kind,
  url: mediaUrl(row.storageKey),
  width: row.width,
  height: row.height,
  alt: row.altText,
  position: row.position,
});

const stripUndefined = <T extends object>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
