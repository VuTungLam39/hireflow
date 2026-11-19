import { BusinessException } from '../../common/exceptions/index.js';
import type { JobInterviewStage } from './entities/job-interview-stage.entity.js';
import { validateStages } from './interview-stages.js';

const C1 = '11111111-1111-4111-8111-111111111111';
const C2 = '22222222-2222-4222-8222-222222222222';
const S1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const S2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const stage = (id: string, name: string, criteria = [{ id: C1, label: 'API' }]) =>
  ({ id, jobId: 'j', position: 1, name, criteria, createdAt: new Date() }) as JobInterviewStage;
const existing = new Map([
  [
    S1,
    stage(S1, 'Kỹ thuật', [
      { id: C1, label: 'API' },
      { id: C2, label: 'SQL' },
    ]),
  ],
  [S2, stage(S2, 'Văn hoá')],
]);
const codeOf = (fn: () => void) => {
  try {
    fn();
  } catch (e) {
    return ((e as BusinessException).getResponse() as { code: string }).code;
  }
  return 'OK';
};

// MVP 3.1 · BR-INT-05
describe('validateStages', () => {
  it('accepts reordering, renaming and adding a new stage', () => {
    const dto = {
      stages: [
        { id: S2, name: 'Văn hoá nhóm', criteria: [{ id: C1, label: 'Hợp tác' }] },
        { name: 'Vòng cuối', criteria: [{ label: 'Định hướng' }] },
        {
          id: S1,
          name: 'Kỹ thuật',
          criteria: [
            { id: C1, label: 'API' },
            { id: C2, label: 'SQL' },
          ],
        },
      ],
    };
    expect(codeOf(() => validateStages(dto, existing, new Set([S1])))).toBe('OK');
  });

  it.each([
    ['unknown stage id', [{ id: C2, name: 'X', criteria: [{ label: 'A' }] }]],
    [
      'duplicated names (case-insensitive)',
      [
        { name: 'Kỹ thuật', criteria: [{ label: 'A' }] },
        { name: 'kỹ thuật ', criteria: [{ label: 'B' }] },
      ],
    ],
    [
      'duplicated criteria in a stage',
      [{ name: 'X', criteria: [{ label: 'API' }, { label: 'api' }] }],
    ],
    ['criterion id from another stage', [{ name: 'X', criteria: [{ id: C1, label: 'A' }] }]],
  ])('rejects %s with VALIDATION_FAILED', (_case, stages) => {
    expect(codeOf(() => validateStages({ stages }, existing, new Set()))).toBe('VALIDATION_FAILED');
  });

  it('a stage with feedback keeps its criteria: dropping, adding or deleting the stage is STAGE_IN_USE', () => {
    const used = new Set([S1]);
    const keepS2 = { id: S2, name: 'Văn hoá', criteria: [{ id: C1, label: 'API' }] };
    const dropCriterion = { id: S1, name: 'Kỹ thuật', criteria: [{ id: C1, label: 'API' }] };
    const addCriterion = {
      id: S1,
      name: 'Kỹ thuật',
      criteria: [{ id: C1, label: 'API' }, { id: C2, label: 'SQL' }, { label: 'Mới' }],
    };
    const renamed = {
      id: S1,
      name: 'Kỹ thuật (vòng 1)',
      criteria: [
        { id: C1, label: 'Thiết kế API' },
        { id: C2, label: 'SQL' },
      ],
    };
    expect(codeOf(() => validateStages({ stages: [dropCriterion] }, existing, used))).toBe(
      'STAGE_IN_USE',
    );
    expect(codeOf(() => validateStages({ stages: [addCriterion] }, existing, used))).toBe(
      'STAGE_IN_USE',
    );
    expect(codeOf(() => validateStages({ stages: [keepS2] }, existing, used))).toBe('STAGE_IN_USE');
    expect(codeOf(() => validateStages({ stages: [renamed] }, existing, used))).toBe('OK');
  });
});
