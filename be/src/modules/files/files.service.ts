import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { EntityManager } from 'typeorm';
import type { CheckedCv } from './cv-file.rules.js';
import { CvFile, CvParseStatus } from './entities/cv-file.entity.js';
import { StorageService } from './storage/storage.service.js';

export interface StoredCv {
  storageKey: string;
  stored: boolean;
}

@Injectable()
export class FilesService {
  constructor(private readonly storage: StorageService) {}

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
}
