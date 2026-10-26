import { LlmError, type LlmProvider } from './ai.types.js';
import { maskPii } from './cv-text.js';
import { CvProfileDto, parseLlmOutput } from './dto/llm-output.dto.js';
import type { CvProfileData } from './entities/cv-profile.entity.js';
import { AI_ERROR, PipelineFailure } from './pipeline/errors.js';
import { LLM_STEP_TIMEOUT_MS } from './pipeline/queues.js';
import {
  EXTRACT_CV_SCHEMA,
  EXTRACT_CV_SYSTEM,
  extractCvPrompt,
} from './prompts/extract-cv.prompt.js';

// BR-AI-06
export const EXTRACT_ATTEMPTS = 3;

export interface ExtractedProfile {
  data: CvProfileData;
  model: string;
  inputTokens: number;
  outputTokens: number;
  attempts: number;
}

// Kickoff 8.3, BR-AI-06, BR-AI-09
export async function extractProfile(
  llm: LlmProvider,
  cvText: string,
  onInvalid?: (attempt: number, error: LlmError) => void,
): Promise<ExtractedProfile> {
  let lastError: LlmError | undefined;
  for (let attempt = 1; attempt <= EXTRACT_ATTEMPTS; attempt++) {
    try {
      const result = await llm.generateJson({
        task: 'extract-cv',
        system: EXTRACT_CV_SYSTEM,
        prompt: extractCvPrompt(maskPii(cvText)),
        schema: EXTRACT_CV_SCHEMA,
        maxOutputTokens: 4096,
        signal: AbortSignal.timeout(LLM_STEP_TIMEOUT_MS),
      });
      const profile = parseLlmOutput(CvProfileDto, result.data, result.provider);
      return {
        data: JSON.parse(JSON.stringify(profile)) as CvProfileData,
        model: `${result.provider}/${result.model}`.slice(0, 100),
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        attempts: attempt,
      };
    } catch (error) {
      if (!(error instanceof LlmError)) throw error;
      if (error.retryable) throw error;
      if (error.code !== 'INVALID_JSON') {
        throw new PipelineFailure(error.code === 'CONFIG' ? AI_ERROR.config : AI_ERROR.unavailable);
      }
      lastError = error;
      onInvalid?.(attempt, error);
    }
  }
  throw new PipelineFailure(`${AI_ERROR.invalidOutput} ${lastError?.message ?? ''}`.trim());
}
