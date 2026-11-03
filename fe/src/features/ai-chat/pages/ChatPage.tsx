import { ArrowRight, SendHorizontal, Square } from 'lucide-react'
import { useCallback, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { PageHeader, SidePanel } from '@/components/shared'
import { Button, Textarea, buttonVariants } from '@/components/ui'
import { useStream } from '@/hooks/use-stream'
import { ERROR_MESSAGES } from '@/lib/error-codes'
import { getErrorMessage } from '@/lib/errors'
import { links } from '@/routes/paths'
import { ChatMessageView } from '../components/ChatMessageView'
import type { ChatMessage, ChatSource } from '../types'

const SUGGESTIONS = [
  'Ai từng làm với Kafka hoặc microservices?',
  'Ai có kinh nghiệm NestJS trên 2 năm?',
  'Ứng viên nào biết cả React và TypeScript?',
]

let nextId = 0
const newId = () => `m${++nextId}`

// US-08 · BR-AI-10 · Design Spec 6.9
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const { start, stop, isStreaming } = useStream()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [cited, setCited] = useState<{ source: ChatSource; index: number } | null>(null)
  const onCite = useCallback(
    (source: ChatSource, index: number) => setCited({ source, index }),
    [setCited],
  )

  const updateMessage = (id: string, patch: (m: ChatMessage) => Partial<ChatMessage>) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...patch(m) } : m)))

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q || isStreaming) return
    const answerId = newId()
    setQuestion('')
    setMessages((list) => [
      ...list,
      { id: newId(), role: 'user', content: q, sources: [], status: 'done' },
      { id: answerId, role: 'assistant', content: '', sources: [], status: 'streaming' },
    ])

    try {
      await start({
        path: '/ai/chat',
        body: { question: q },
        onEvent: ({ event, data }) => {
          if (event === 'token') {
            const { text: chunk } = JSON.parse(data) as { text: string }
            updateMessage(answerId, (m) => ({ content: m.content + chunk }))
            bottomRef.current?.scrollIntoView({ block: 'end' })
          } else if (event === 'error') {
            const { code, message } = JSON.parse(data) as { code?: string; message: string }
            throw new Error((code && ERROR_MESSAGES[code]) || message)
          } else if (event === 'sources') {
            updateMessage(answerId, () => ({ sources: JSON.parse(data) as ChatSource[] }))
          }
        },
      })
      updateMessage(answerId, () => ({ status: 'done' }))
    } catch (error) {
      updateMessage(answerId, () => ({ status: 'error', content: getErrorMessage(error) }))
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void ask(question)
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7.5rem)] max-w-[760px] flex-col md:h-[calc(100dvh-8rem)]">
      <PageHeader
        title="Hỏi kho CV"
        description="Hỏi bằng câu thường ngày. Mỗi ý trong câu trả lời có số trích dẫn tới đúng đoạn CV."
      />

      <div className="min-h-0 flex-1 overflow-y-auto py-6" aria-live="polite">
        {messages.length === 0 ? (
          <div className="max-w-xl">
            <p className="type-heading">Bạn đang tìm ai?</p>
            <p className="type-body mt-1">
              Chỉ tìm trong CV bạn có quyền xem. Thử một câu hỏi mẫu:
            </p>
            <div className="mt-4 flex flex-col items-start gap-1">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="quiet"
                  className="h-auto py-2 text-left whitespace-normal"
                  onClick={() => void ask(s)}
                >
                  {s}
                  <ArrowRight className="text-ink-muted" />
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {messages.map((m) => (
              <ChatMessageView key={m.id} message={m} onCite={onCite} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="border-line bg-surface focus-within:border-brand focus-within:ring-brand-soft flex items-end gap-2 rounded-md border p-2 transition-[border-color,box-shadow] focus-within:ring-3"
      >
        <Textarea
          aria-label="Câu hỏi"
          rows={2}
          maxLength={500}
          className="min-h-0 resize-none border-0 focus:ring-0"
          placeholder="Ví dụ: Ai từng làm fintech và biết Kafka?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void ask(question)
            }
          }}
        />
        {isStreaming ? (
          <Button variant="secondary" onClick={stop}>
            <Square className="fill-current" />
            Dừng
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!question.trim()} aria-label="Gửi câu hỏi">
            <SendHorizontal />
          </Button>
        )}
      </form>
      <p className="type-caption mt-1.5">Enter để gửi · Shift + Enter xuống dòng</p>

      <SidePanel
        open={!!cited}
        onClose={() => setCited(null)}
        title={cited?.source.candidateName ?? ''}
        subtitle={cited && `Nguồn [${cited.index}]`}
        footer={
          cited && (
            <Link
              to={links.applicationDetail(cited.source.applicationId)}
              className={buttonVariants()}
            >
              Mở hồ sơ
              <ArrowRight />
            </Link>
          )
        }
      >
        {cited && (
          <div className="border-line bg-surface rounded-md border px-5 py-6">
            <p className="type-overline mb-2">Đoạn trong CV</p>
            <p className="type-read">
              <span className="mark-evidence">{cited.source.excerpt}</span>
            </p>
          </div>
        )}
      </SidePanel>
    </div>
  )
}
