import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString, Length, ValidateNested } from 'class-validator';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { foldText } from '../../common/utils/text.js';
import { LLM_PROVIDER, LlmError, type LlmProvider } from './ai.types.js';
import { maskPii } from './cv-text.js';
import { parseLlmOutput } from './dto/llm-output.dto.js';
import {
  INTERVIEW_QUESTIONS_SCHEMA,
  INTERVIEW_QUESTIONS_SYSTEM,
  interviewQuestionsPrompt,
  type QuestionCriterion,
} from './prompts/interview-questions.prompt.js';

// Mở rộng MVP 2 – E5 · BR-INT-04

export const QUESTIONS_TIMEOUT_MS = 20_000;
export const QUESTIONS_PER_CRITERION = 3;
const CV_LINES_PER_CRITERION = 2;
const CV_LINE_CHARS = 200;

class QuestionItemDto {
  @IsString()
  @Length(1, 10)
  criterion: string;

  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @Length(5, 400, { each: true })
  questions: string[];
}

class InterviewQuestionsDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => QuestionItemDto)
  items: QuestionItemDto[];
}

export interface QuestionRequirement {
  id: string;
  label: string;
  required: boolean;
  keywords: string[];
}

export interface QuestionSuggestion {
  requirementId: string;
  label: string;
  questions: string[];
}

/** Dòng CV nhắc tới tiêu chí (theo nhãn hoặc từ khoá, không dấu), đã che email và số điện thoại */
export function relevantCvLines(cvText: string | null, req: QuestionRequirement): string[] {
  if (!cvText) return [];
  const needles = [
    ...new Set([req.label, ...req.keywords].map(foldText).filter((n) => n.length >= 2)),
  ];
  return maskPii(cvText)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && needles.some((n) => foldText(line).includes(n)))
    .slice(0, CV_LINES_PER_CRITERION)
    .map((line) => (line.length > CV_LINE_CHARS ? `${line.slice(0, CV_LINE_CHARS - 1)}…` : line));
}

@Injectable()
export class InterviewQuestionSuggester {
  private readonly logger = new Logger(InterviewQuestionSuggester.name);

  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async suggest(
    jobTitle: string,
    requirements: QuestionRequirement[],
    cvText: string | null,
  ): Promise<QuestionSuggestion[]> {
    const criteria: QuestionCriterion[] = requirements.map((r, i) => ({
      code: `T${i + 1}`,
      label: r.label,
      required: r.required,
      keywords: r.keywords,
      cvLines: relevantCvLines(cvText, r),
    }));
    try {
      const result = await this.llm.generateJson({
        task: 'interview-questions',
        system: INTERVIEW_QUESTIONS_SYSTEM,
        prompt: interviewQuestionsPrompt(jobTitle, criteria),
        schema: INTERVIEW_QUESTIONS_SCHEMA,
        maxOutputTokens: 2048,
        signal: AbortSignal.timeout(QUESTIONS_TIMEOUT_MS),
      });
      const { items } = parseLlmOutput(InterviewQuestionsDto, result.data, result.provider);
      const byCode = new Map(items.map((it) => [it.criterion.trim().toUpperCase(), it.questions]));
      const suggestions = requirements.map((r, i) => ({
        requirementId: r.id,
        label: r.label,
        questions: (byCode.get(`T${i + 1}`) ?? [])
          .map((q) => q.trim())
          .filter(Boolean)
          .slice(0, QUESTIONS_PER_CRITERION),
      }));
      if (!suggestions.some((s) => s.questions.length)) {
        throw new LlmError(
          'No question matched a criterion',
          result.provider,
          'INVALID_JSON',
          false,
        );
      }
      return suggestions;
    } catch (error) {
      const reason = error instanceof LlmError ? `${error.code}: ${error.message}` : String(error);
      this.logger.warn(`interview-questions failed: ${reason}`);
      throw new BusinessException(
        ErrorCode.AiUnavailable,
        'AI could not suggest interview questions, please try again',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
