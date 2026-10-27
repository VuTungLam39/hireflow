import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { DataSource, type EntityManager } from 'typeorm';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { applyCandidateScope } from '../../common/utils/department-scope.js';
import type { CheckedCv } from './cv-file.rules.js';
import { CvFile, CvParseStatus } from './entities/cv-file.entity.js';
import { contentDisposition, StorageService } from './storage/storage.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity.js';

type ScopeUser = Pick<AuthUser, 'id' | 'role' | 'departmentId'>;

// BR-FILE-03
export const FILE_LINK_TTL_SECONDS = 300;

export interface FileLink {
  url: string;
  expiresAt: Date;
}

export interface FileContent {
  body: Buffer;
  contentType: string;
  disposition: string;
}

@Injectable()
export class FilesService {
  private readonly linkKey: Buffer;
  private readonly apiPrefix: string;

  constructor(
    private readonly storage: StorageService,
    @InjectDataSource() private readonly dataSource: DataSource,
    config: ConfigService,
    private readonly audit: AuditService,
  ) {
    this.linkKey = createHmac('sha256', config.getOrThrow<string>('jwt.accessSecret'))
      .update('cv-file-link')
      .digest();
    this.apiPrefix = config.get<string>('app.apiPrefix', 'api');
  }

  // BR-FILE-02
  async findReusable(
    manager: EntityManager,
    candidateId: string | undefined,
    sha256: string,
  ): Promise<CvFile | null> {
    if (!candidateId) return null;
    return manager.findOneBy(CvFile, { candidateId, sha256 });
  }

  // BR-FILE-03, Kickoff 13
  async store(cv: CheckedCv): Promise<string> {
    const now = new Date();
    const key = `cv/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${randomUUID()}.${cv.ext}`;
    await this.storage.put(key, cv.buffer, cv.mime);
    return key;
  }

  removeStored(key: string): Promise<void> {
    return this.storage.remove(key);
  }

  // BR-DATA-03
  async removeAllStored(keys: string[]): Promise<void> {
    await Promise.allSettled(keys.map((key) => this.storage.remove(key)));
  }

  async createRecord(
    manager: EntityManager,
    candidateId: string,
    cv: CheckedCv,
    storageKey: string,
  ): Promise<CvFile> {
    return manager.save(
      manager.create(CvFile, {
        candidateId,
        storageKey,
        originalName: cv.originalName,
        mime: cv.mime,
        sizeBytes: cv.size,
        sha256: cv.sha256,
        parseStatus: CvParseStatus.Pending,
      }),
    );
  }

  // US-04, BR-FILE-03, BR-ACC-07
  async createLink(fileId: string, user: ScopeUser): Promise<FileLink> {
    const qb = this.dataSource
      .getRepository(CvFile)
      .createQueryBuilder('cv')
      .select(['cv.id', 'cv.storageKey', 'cv.originalName', 'cv.mime'])
      .where('cv.id = :fileId', { fileId });
    const file = await applyCandidateScope(qb, user, '"cv"."candidate_id"').getOne();
    if (!file) throw new NotFoundException('File not found');

    const expires = Math.floor(Date.now() / 1000) + FILE_LINK_TTL_SECONDS;
    const signed = await this.storage.signedUrl(file.storageKey, {
      expiresIn: FILE_LINK_TTL_SECONDS,
      fileName: file.originalName,
      contentType: file.mime,
    });
    const url =
      signed ??
      `/${this.apiPrefix}/v1/files/${file.id}/content?expires=${expires}&signature=${this.sign(file.id, expires)}`;
    await this.audit.recordSafely({
      actorId: user.id,
      action: AuditAction.CvViewed,
      entity: AuditEntity.CvFile,
      entityId: file.id,
    });
    return { url, expiresAt: new Date(expires * 1000) };
  }

  // BR-FILE-03
  async readSigned(fileId: string, expires: number, signature: string): Promise<FileContent> {
    const expected = Buffer.from(this.sign(fileId, expires), 'hex');
    const given = Buffer.from(signature, 'hex');
    const valid =
      expires * 1000 > Date.now() &&
      given.length === expected.length &&
      timingSafeEqual(given, expected);
    if (!valid) throw new NotFoundException('File not found');

    const file = await this.dataSource.getRepository(CvFile).findOneBy({ id: fileId });
    if (!file) throw new NotFoundException('File not found');
    return {
      body: await this.storage.get(file.storageKey),
      contentType: file.mime,
      disposition: contentDisposition(file.originalName),
    };
  }

  private sign(fileId: string, expires: number): string {
    return createHmac('sha256', this.linkKey).update(`${fileId}.${expires}`).digest('hex');
  }
}
