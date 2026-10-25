import type { DefaultJobOptions } from 'bullmq';

// Backend Architecture 13
export const QUEUE = {
  parse: 'parse-cv',
  extract: 'extract-cv',
  score: 'score',
  embed: 'embed-cv',
} as const;

export interface CvJobData {
  cvFileId: string;
  requestId?: string;
}

export interface ScoreJobData {
  applicationId: string;
  requestId?: string;
}

export interface RescoreJobData {
  jobId: string;
  jdVersion: number;
  requestId?: string;
}

// Kickoff 12: jobId = <id>_<stage>_v<version>
export const jobId = {
  parse: (cvFileId: string) => `${cvFileId}_parse_v1`,
  extract: (cvFileId: string, promptVersion: string) =>
    `${cvFileId}_extract_${promptVersion.startsWith('v') ? promptVersion : `v${promptVersion}`}`,
  score: (applicationId: string, jdVersion: number) => `${applicationId}_score_v${jdVersion}`,
  rescoreJob: (jobId: string, jdVersion: number) => `${jobId}_rescore_v${jdVersion}`,
  embed: (cvFileId: string) => `${cvFileId}_embed_v1`,
};

export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: true,
  removeOnFail: { count: 1000 },
};

// Kickoff 12
export const LLM_STEP_TIMEOUT_MS = 60_000;
