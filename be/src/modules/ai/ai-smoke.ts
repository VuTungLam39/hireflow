import 'dotenv/config';
import { buildAiConfig } from '../../config/ai.config.js';
import { buildEmbeddingProvider, buildLlmProvider } from './ai.factory.js';

const cosine = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);

async function main() {
  const config = buildAiConfig();
  const llm = buildLlmProvider(config);
  const embedding = buildEmbeddingProvider(config);
  console.log(
    `LLM: ${llm.name} · Embedding: ${embedding.name}/${embedding.model} (${embedding.dimension})`,
  );

  let started = Date.now();
  const [backend, nest, accounting] = await embedding.embed(
    [
      'Lập trình viên backend, 3 năm kinh nghiệm NestJS và PostgreSQL',
      'Kỹ sư phần mềm làm API bằng Node.js NestJS, dùng cơ sở dữ liệu Postgres',
      'Kế toán tổng hợp, lập báo cáo thuế và quyết toán cuối năm',
    ],
    'document',
  );
  console.log(
    `embed: ${Date.now() - started}ms · gần nghĩa ${cosine(backend, nest).toFixed(3)} · khác nghĩa ${cosine(backend, accounting).toFixed(3)}`,
  );

  started = Date.now();
  const result = await llm.generateJson({
    task: 'extract-cv',
    system: 'Bạn trích xuất kỹ năng từ CV. Chỉ dùng thông tin có trong CV.',
    prompt:
      'CV: Trần Văn B. 3 năm phát triển REST API bằng NestJS tại Công ty X. Dùng Docker hằng ngày.',
    schema: {
      name: 'skills',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['skills'],
        properties: {
          skills: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'years', 'evidence'],
              properties: {
                name: { type: 'string' },
                years: { type: ['number', 'null'] },
                evidence: { type: 'string' },
              },
            },
          },
        },
      },
    },
  });
  console.log(`json: ${Date.now() - started}ms · ${result.provider}/${result.model}`);
  console.log(JSON.stringify(result.data, null, 2));

  started = Date.now();
  let answer = '';
  for await (const text of llm.streamText({
    task: 'chat',
    system: 'Trả lời ngắn gọn bằng tiếng Việt.',
    messages: [{ role: 'user', content: 'NestJS là gì? Trả lời một câu.' }],
  })) {
    answer += text;
  }
  console.log(`stream: ${Date.now() - started}ms · ${answer.trim()}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
