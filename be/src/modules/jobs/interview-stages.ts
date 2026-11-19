import { HttpStatus } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { SaveInterviewStagesDto } from './dto/save-interview-stages.dto.js';
import type { JobInterviewStage, StageCriterion } from './entities/job-interview-stage.entity.js';

export interface InterviewStageView {
  id: string;
  position: number;
  name: string;
  criteria: StageCriterion[];
  /** Đã có phiếu đánh giá: không xoá vòng, không thêm/bớt tiêu chí, chỉ đổi tên */
  locked: boolean;
}

const invalid = (message: string) =>
  new BusinessException(ErrorCode.ValidationFailed, 'Validation failed', HttpStatus.BAD_REQUEST, [
    { field: 'stages', messages: [message] },
  ]);

const inUse = (name: string) =>
  new BusinessException(
    ErrorCode.StageInUse,
    `Stage "${name}" already has feedback`,
    HttpStatus.CONFLICT,
    [{ field: 'stages', messages: [`Vòng "${name}" đã có phiếu đánh giá: chỉ đổi được tên`] }],
  );

const hasDuplicate = (values: string[]) => new Set(values).size !== values.length;
const fold = (s: string) => s.trim().toLocaleLowerCase('vi');

// BR-INT-05
export function validateStages(
  dto: SaveInterviewStagesDto,
  existing: Map<string, JobInterviewStage>,
  used: Set<string>,
): void {
  const ids = dto.stages.flatMap((s) => (s.id ? [s.id] : []));
  if (hasDuplicate(ids) || ids.some((id) => !existing.has(id))) {
    throw invalid('Vòng không thuộc tin này hoặc bị lặp');
  }
  if (hasDuplicate(dto.stages.map((s) => fold(s.name)))) {
    throw invalid('Tên vòng phải khác nhau');
  }
  for (const s of dto.stages) {
    const known = new Set((s.id ? existing.get(s.id)!.criteria : []).map((c) => c.id));
    const criterionIds = s.criteria.flatMap((c) => (c.id ? [c.id] : []));
    if (hasDuplicate(criterionIds) || criterionIds.some((id) => !known.has(id))) {
      throw invalid(`Tiêu chí của vòng "${s.name}" không hợp lệ`);
    }
    if (hasDuplicate(s.criteria.map((c) => fold(c.label)))) {
      throw invalid(`Tiêu chí trong vòng "${s.name}" phải khác nhau`);
    }
    if (s.id && used.has(s.id)) {
      const same =
        criterionIds.length === s.criteria.length &&
        criterionIds.length === known.size &&
        criterionIds.every((id) => known.has(id));
      if (!same) throw inUse(existing.get(s.id)!.name);
    }
  }
  const kept = new Set(ids);
  for (const id of used) {
    if (existing.has(id) && !kept.has(id)) throw inUse(existing.get(id)!.name);
  }
}
