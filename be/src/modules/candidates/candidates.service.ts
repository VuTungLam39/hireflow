import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CursorResult } from '../../common/dto/cursor-result.dto.js';
import type { ApplicationSource } from '../../common/enums/application-source.enum.js';
import type { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { decodeCursor, encodeCursor } from '../../common/utils/cursor.js';
import { applyCandidateScope, applyDepartmentScope } from '../../common/utils/department-scope.js';
import { Application } from '../applications/entities/application.entity.js';
import { CvFile } from '../files/entities/cv-file.entity.js';
import { QueryCandidateDto } from './dto/query-candidate.dto.js';
import { UpdateCandidateDto } from './dto/update-candidate.dto.js';
import { Candidate } from './entities/candidate.entity.js';

type ScopeUser = Pick<AuthUser, 'id' | 'role' | 'departmentId'>;

export const ANONYMIZED_NAME = 'Ứng viên đã ẩn danh';

export interface CandidateListItemView {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  applicationCount: number;
  lastAppliedAt: Date | null;
  anonymizedAt: Date | null;
  createdAt: Date;
}

export interface CandidateDetailView extends CandidateListItemView {
  applications: {
    id: string;
    job: { id: string; title: string };
    status: ApplicationStatus;
    source: ApplicationSource;
    score: number | null;
    createdAt: Date;
  }[];
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate) private readonly candidatesRepository: Repository<Candidate>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // US-14, BR-CAND-03
  async findAll(
    query: QueryCandidateDto,
    user: ScopeUser,
  ): Promise<CursorResult<CandidateListItemView>> {
    const qb = this.candidatesRepository
      .createQueryBuilder('candidate')
      .orderBy('candidate.createdAt', 'DESC')
      .addOrderBy('candidate.id', 'DESC')
      .limit(query.limit + 1);

    applyCandidateScope(qb, user, '"candidate"."id"');
    if (query.search) {
      qb.andWhere(
        `(f_unaccent(lower(candidate.fullName)) LIKE '%' || f_unaccent(lower(:search)) || '%' OR candidate.email LIKE '%' || lower(:search) || '%')`,
        { search: escapeLike(query.search) },
      );
    }
    if (query.cursor) {
      const { createdAt, id } = decodeCursor(query.cursor);
      qb.andWhere('(candidate.createdAt, candidate.id) < (:cursorCreatedAt, :cursorId)', {
        cursorCreatedAt: createdAt,
        cursorId: id,
      });
    }

    const rows = await qb.getMany();
    const page = rows.slice(0, query.limit);
    const stats = await this.applicationStats(
      page.map((c) => c.id),
      user,
    );
    const last = page.at(-1);
    return new CursorResult(
      page.map((c) => this.toListItem(c, stats.get(c.id))),
      query.limit,
      rows.length > query.limit && last ? encodeCursor(last) : null,
    );
  }

  async findOne(id: string, user: ScopeUser): Promise<CandidateDetailView> {
    const candidate = await this.findScoped(id, user);
    const qb = this.dataSource
      .getRepository(Application)
      .createQueryBuilder('app')
      .innerJoin('app.job', 'job')
      .select([
        'app.id',
        'app.status',
        'app.source',
        'app.score',
        'app.createdAt',
        'job.id',
        'job.title',
      ])
      .where('app.candidateId = :id', { id })
      .orderBy('app.createdAt', 'DESC');
    const applications = await applyDepartmentScope(qb, user, 'job.departmentId').getMany();

    return {
      ...this.toListItem(candidate, {
        count: applications.length,
        lastAppliedAt: applications[0]?.createdAt ?? null,
      }),
      applications: applications.map((a) => ({
        id: a.id,
        job: { id: a.job!.id, title: a.job!.title },
        status: a.status,
        source: a.source,
        score: a.score,
        createdAt: a.createdAt,
      })),
    };
  }

  // BR-CAND-01
  async update(id: string, dto: UpdateCandidateDto, user: ScopeUser): Promise<CandidateDetailView> {
    const candidate = await this.getOrFail(id);
    this.assertNotAnonymized(candidate);
    await this.candidatesRepository.update(id, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    });
    return this.findOne(id, user);
  }

  // BR-DATA-03, Database Design 6
  async anonymize(id: string, user: ScopeUser): Promise<CandidateDetailView> {
    await this.dataSource.transaction(async (manager) => {
      const candidate = await manager.findOne(Candidate, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!candidate) throw new NotFoundException('Candidate not found');
      this.assertNotAnonymized(candidate);

      await manager.update(Application, { candidateId: id }, { scoreBreakdown: null });
      await manager.delete(CvFile, { candidateId: id });
      await manager.update(Candidate, id, {
        fullName: ANONYMIZED_NAME,
        email: `anon+${id}@invalid.local`,
        phone: null,
        anonymizedAt: new Date(),
        anonymizedBy: user.id,
      });
    });
    // TODO tuần 3: xoá object trên S3 sau khi commit
    return this.findOne(id, user);
  }

  findByEmail(email: string): Promise<Candidate | null> {
    return this.candidatesRepository.findOneBy({ email: email.toLowerCase() });
  }

  // BR-CAND-01, BR-CAND-02, BR-APP-04
  async upsertForApplication(
    manager: EntityManager,
    input: { fullName: string; email: string; phone?: string | null },
    consentVersion: string,
  ): Promise<Candidate> {
    const email = input.email.toLowerCase();
    const existing = await manager.findOne(Candidate, {
      where: { email },
      lock: { mode: 'pessimistic_write' },
    });
    if (!existing) {
      return manager.save(
        manager.create(Candidate, {
          fullName: input.fullName,
          email,
          phone: input.phone ?? null,
          consentAt: new Date(),
          consentVersion,
        }),
      );
    }
    if (!existing.phone && input.phone) {
      await manager.update(Candidate, existing.id, { phone: input.phone });
      existing.phone = input.phone;
    }
    return existing;
  }

  private async applicationStats(
    candidateIds: string[],
    user: ScopeUser,
  ): Promise<Map<string, { count: number; lastAppliedAt: Date | null }>> {
    if (!candidateIds.length) return new Map();
    const qb = this.dataSource
      .getRepository(Application)
      .createQueryBuilder('app')
      .innerJoin('app.job', 'job')
      .select('app.candidateId', 'candidateId')
      .addSelect('COUNT(*)::int', 'count')
      .addSelect('MAX(app.createdAt)', 'lastAppliedAt')
      .where('app.candidateId IN (:...candidateIds)', { candidateIds })
      .groupBy('app.candidateId');
    const rows = await applyDepartmentScope(qb, user, 'job.departmentId').getRawMany<{
      candidateId: string;
      count: number;
      lastAppliedAt: Date | null;
    }>();
    return new Map(rows.map(({ candidateId, ...stat }) => [candidateId, stat]));
  }

  private toListItem(
    c: Candidate,
    stat: { count: number; lastAppliedAt: Date | null } = { count: 0, lastAppliedAt: null },
  ): CandidateListItemView {
    return {
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      applicationCount: stat.count,
      lastAppliedAt: stat.lastAppliedAt,
      anonymizedAt: c.anonymizedAt,
      createdAt: c.createdAt,
    };
  }

  // BR-ACC-07
  private async findScoped(id: string, user: ScopeUser): Promise<Candidate> {
    const qb = this.candidatesRepository
      .createQueryBuilder('candidate')
      .where('candidate.id = :id', { id });
    const candidate = await applyCandidateScope(qb, user, '"candidate"."id"').getOne();
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  private async getOrFail(id: string): Promise<Candidate> {
    const candidate = await this.candidatesRepository.findOneBy({ id });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  private assertNotAnonymized(candidate: Candidate): void {
    if (!candidate.anonymizedAt) return;
    throw new BusinessException(
      ErrorCode.CandidateAnonymized,
      'Candidate has been anonymized',
      HttpStatus.CONFLICT,
    );
  }
}
