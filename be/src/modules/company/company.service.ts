import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { notExpiredSql } from '../../common/utils/vn-date.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity.js';
import { StorageService } from '../files/storage/storage.service.js';
import { Job, JobStatus } from '../jobs/entities/job.entity.js';
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
import { MediaFile, MediaKind } from './entities/media-file.entity.js';
import { checkImage, GALLERY_MAX, MEDIA_KEY, type UploadedImage } from './media.rules.js';

const PROFILE_ID = 1;

type Actor = Pick<AuthUser, 'id'>;

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
  openJobs: number;
}

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
  ) {}

  // F-ORG-01
  async get(): Promise<CompanyView> {
    const profile = await this.profile();
    const content = await this.content(profile);
    return { ...content, complete: isComplete(content), updatedAt: profile.updatedAt };
  }

  async update(dto: UpdateCompanyDto, user: Actor): Promise<CompanyView> {
    const profile = await this.profile();
    const changed = Object.keys(dto).filter((k) => dto[k as keyof UpdateCompanyDto] !== undefined);
    Object.assign(profile, stripUndefined(dto), { updatedBy: user.id });
    await this.profiles.save(profile);
    await this.changed(user, AuditAction.CompanyProfileUpdated, AuditEntity.Company, null, {
      fields: changed.join(','),
    });
    return this.get();
  }

  // BR-MEDIA-01, BR-MEDIA-02
  async upload(
    file: UploadedImage | undefined,
    dto: UploadMediaDto,
    user: Actor,
  ): Promise<MediaView> {
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
      const count = await this.media.countBy({ kind: MediaKind.Gallery });
      if (count >= GALLERY_MAX) {
        throw new BusinessException(
          ErrorCode.GalleryFull,
          `Gallery holds at most ${GALLERY_MAX} images`,
          HttpStatus.CONFLICT,
        );
      }
    }
    await this.storage.put(image.key, image.buffer, image.mime);

    const saved = await this.dataSource.transaction(async (manager) => {
      const position =
        dto.kind === MediaKind.Gallery
          ? ((
              await manager
                .getRepository(MediaFile)
                .createQueryBuilder('m')
                .select('COALESCE(MAX(m.position), -1) + 1', 'next')
                .where('m.kind = :kind', { kind: MediaKind.Gallery })
                .getRawOne<{ next: number }>()
            )?.next ?? 0)
          : 0;
      const row = await manager.getRepository(MediaFile).save(
        manager.getRepository(MediaFile).create({
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
        const profile = await this.profile(manager.getRepository(CompanyProfile));
        const previous = profile[field];
        profile[field] = row.id;
        profile.updatedBy = user.id;
        await manager.getRepository(CompanyProfile).save(profile);
        if (previous) await manager.getRepository(MediaFile).softDelete(previous);
        return { row, previous };
      }
      return { row, previous: null };
    });
    if (saved.previous) await this.cleanupStorage(saved.previous);
    await this.changed(user, AuditAction.CompanyMediaAdded, AuditEntity.Media, saved.row.id, {
      kind: dto.kind,
    });
    return toMediaView(saved.row);
  }

  async updateMedia(id: string, dto: UpdateMediaDto): Promise<MediaView> {
    const row = await this.media.findOneBy({ id });
    if (!row) throw new NotFoundException('Media not found');
    if (dto.alt !== undefined) row.altText = dto.alt;
    if (dto.position !== undefined) row.position = dto.position;
    await this.media.save(row);
    this.prerender.schedule('company.updated');
    return toMediaView(row);
  }

  async removeMedia(id: string, user: Actor): Promise<void> {
    const row = await this.media.findOneBy({ id });
    if (!row) throw new NotFoundException('Media not found');
    await this.dataSource.transaction(async (manager) => {
      if (row.kind !== MediaKind.Gallery) {
        const field = row.kind === MediaKind.Logo ? 'logoMediaId' : 'coverMediaId';
        await manager
          .getRepository(CompanyProfile)
          .update({ id: PROFILE_ID, [field]: id }, { [field]: null, updatedBy: user.id });
      }
      await manager.getRepository(MediaFile).softDelete(id);
    });
    await this.cleanupStorage(id);
    await this.changed(user, AuditAction.CompanyMediaRemoved, AuditEntity.Media, id, {
      kind: row.kind,
    });
  }

  // F-PUB-06 · BR-ORG-01
  async publicView(): Promise<PublicCompanyView> {
    const content = await this.content(await this.profile());
    if (!isComplete(content)) {
      throw new BusinessException(
        ErrorCode.CompanyProfileIncomplete,
        'Company profile is not published yet',
        HttpStatus.NOT_FOUND,
      );
    }
    const openJobs = await this.dataSource
      .getRepository(Job)
      .createQueryBuilder('job')
      .where('job.status = :open', { open: JobStatus.Open })
      .andWhere(notExpiredSql('job'))
      .getCount();
    return { ...content, openJobs };
  }

  /** BR-MEDIA-02: chỉ phục vụ khoá media/<sha256>.<ext> đang được dùng; không bao giờ cv/* */
  async publicMedia(file: string): Promise<{ body: Buffer; mime: string }> {
    const key = `media/${file}`;
    if (!MEDIA_KEY.test(key)) throw new NotFoundException('Media not found');
    const row = await this.media.findOne({ select: ['mime'], where: { storageKey: key } });
    if (!row) throw new NotFoundException('Media not found');
    return { body: await this.storage.get(key), mime: row.mime };
  }

  private async profile(repo: Repository<CompanyProfile> = this.profiles): Promise<CompanyProfile> {
    await repo.createQueryBuilder().insert().values({ id: PROFILE_ID }).orIgnore().execute();
    return repo.findOneByOrFail({ id: PROFILE_ID });
  }

  private async content(profile: CompanyProfile): Promise<CompanyContentView> {
    const rows = await this.media.find({ order: { position: 'ASC', createdAt: 'ASC' } });
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
    await this.audit.recordSafely({ actorId: user.id, action, entity, entityId, metadata });
  }
}

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
