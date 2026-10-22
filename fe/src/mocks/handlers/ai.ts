import { delay, http, HttpResponse } from 'msw'
import type { ChatSource } from '@/features/ai-chat'
import { Permission } from '@/lib/permissions'
import { db, settleProcessing, SKILLS } from '../data'
import { api, authorize, candidateOf, inScope, jobOf } from '../http'

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

/**
 * RAG giả: tìm kỹ năng được nhắc trong câu hỏi, chỉ trong tập CV người hỏi được xem (scope),
 * rồi stream câu trả lời từng chữ kèm trích dẫn [candidateId#chunkId].
 */
export const aiHandlers = [
  http.post(api('/ai/chat'), async ({ request }) => {
    const user = authorize(request, Permission.AiChat)
    if (user instanceof Response) return user
    const { question } = (await request.json()) as { question: string }
    settleProcessing()

    const q = question.toLowerCase()
    const asked = Object.entries(SKILLS)
      .filter(([key, s]) => q.includes(key) || q.includes(s.label.toLowerCase()))
      .map(([key]) => key)

    // Lọc theo scope TRƯỚC khi tìm (kickoff mục 8.5)
    const seen = new Set<string>()
    const matches = db.applications
      .filter((a) => a.aiStatus === 'DONE' && inScope(user, jobOf(a).departmentId))
      .flatMap((a) => {
        const c = candidateOf(a)
        if (seen.has(c.id)) return []
        const skills = c.skills.filter((s) => asked.includes(s.key))
        if (!skills.length) return []
        seen.add(c.id)
        return [{ app: a, candidate: c, skills }]
      })
      .sort(
        (x, y) =>
          y.skills.length - x.skills.length ||
          y.skills.reduce((s, k) => s + k.years, 0) - x.skills.reduce((s, k) => s + k.years, 0),
      )
      .slice(0, 3)

    const sources: ChatSource[] = matches.flatMap(({ app, candidate, skills }) =>
      skills.map((s) => ({
        candidateId: candidate.id,
        chunkId: `k-${s.key}`,
        candidateName: candidate.fullName,
        applicationId: app.id,
        excerpt: s.evidence,
      })),
    )

    const answer = !asked.length
      ? 'Mình chưa nhận ra kỹ năng nào trong câu hỏi. Hãy hỏi cụ thể hơn, ví dụ: "Ai biết NestJS và PostgreSQL?"'
      : !matches.length
        ? 'Không đủ thông tin: chưa có CV nào trong phạm vi bạn được xem có kỹ năng này.'
        : [
            `Tìm thấy ${matches.length} ứng viên phù hợp trong phạm vi bạn được xem:\n`,
            ...matches.map(
              ({ candidate, skills, app }, i) =>
                `${i + 1}. ${candidate.fullName} (ứng tuyển ${jobOf(app).title}): ` +
                skills
                  .map((s) => `${SKILLS[s.key].label} ${s.years} năm [${candidate.id}#k-${s.key}]`)
                  .join(', ') +
                '.',
            ),
            '\nBấm vào số trích dẫn để mở hồ sơ và xem đoạn CV gốc.',
          ].join('\n')

    let cancelled = false
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (chunk: string) => !cancelled && controller.enqueue(encoder.encode(chunk))
        await delay(400)
        send(sse('sources', sources))
        // Gửi từng nhóm vài ký tự, giữ nguyên trích dẫn để FE không phải ghép
        for (const token of answer.match(/\[[^\]]+\]|.{1,4}/gs) ?? []) {
          if (cancelled) return
          send(sse('token', { text: token }))
          await delay(25)
        }
        send(sse('done', {}))
        if (!cancelled) controller.close()
      },
      cancel() {
        cancelled = true
      },
    })

    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  }),
]
