import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { normalizeKeywords } from '../../common/utils/text.js';
import {
  SaveRequirementsDto,
  type RequirementInputDto,
} from '../jobs/dto/save-requirements.dto.js';
import { LLM_PROVIDER, LlmError, type LlmProvider } from './ai.types.js';
import { parseLlmOutput } from './dto/llm-output.dto.js';
import {
  SUGGEST_REQUIREMENTS_SCHEMA,
  SUGGEST_REQUIREMENTS_SYSTEM,
  suggestRequirementsPrompt,
} from './prompts/suggest-requirements.prompt.js';

// API Contract: POST /jobs/:id/requirements/suggest
export const SUGGEST_TIMEOUT_MS = 20_000;

@Injectable()
export class RequirementsSuggester {
  private readonly logger = new Logger(RequirementsSuggester.name);

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  // Kickoff 8.2
  async suggest(title: string, jdText: string): Promise<RequirementInputDto[]> {
    try {
      const result = await this.llm.generateJson({
        task: 'suggest-requirements',
        system: SUGGEST_REQUIREMENTS_SYSTEM,
        prompt: suggestRequirementsPrompt(title, jdText),
        schema: SUGGEST_REQUIREMENTS_SCHEMA,
        maxOutputTokens: 2048,
        signal: AbortSignal.timeout(SUGGEST_TIMEOUT_MS),
      });
      const { requirements } = parseLlmOutput(SaveRequirementsDto, result.data, result.provider);
      return requirements.map((r) => ({
        label: r.label,
        type: r.type,
        weight: r.weight,
        minYears: r.minYears ?? null,
        keywords: normalizeKeywords(r.keywords),
      }));
    } catch (error) {
      const reason = error instanceof LlmError ? `${error.code}: ${error.message}` : String(error);
      this.logger.warn(`suggest-requirements failed: ${reason}`);
      throw new BusinessException(
        ErrorCode.AiUnavailable,
        'AI could not suggest requirements, please try again',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
