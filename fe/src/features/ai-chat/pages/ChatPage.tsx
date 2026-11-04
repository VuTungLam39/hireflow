import { ArrowRight, SendHorizontal, Square } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { PageHeader, SidePanel } from '@/components/shared'
import { Button, Textarea, buttonVariants } from '@/components/ui'
import { useMediaQuery } from '@/hooks/use-media-query'
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

const NEAR_BOTTOM_PX = 80

// US-08 · BR-AI-10 · Design Spec 6.9
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const touch = useMediaQuery('(pointer: coarse)')
  const { start, stop, isStreaming } = useStream()
  const listRef = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)
  const pending = useRef('')
  const frame = useRef(0)
  const [cited, setCited] = useState<{ source: ChatSource; index: number } | null>(null)
  const onCite = useCallback(
    (source: ChatSource, index: number) => setCited({ source, index }),
    [setCited],
  )

  const updateMessage = (id: string, patch: (m: ChatMessage) => Partial<ChatMessage>) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...patch(m) } : m)))

  const flush = (id: string) => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
    const chunk = pending.current
    pending.current = ''
    if (chunk) updateMessage(id, (m) => ({ content: m.content + chunk }))
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  useLayoutEffect(() => {
    const list = listRef.current
    if (list && pinned.current) list.scrollTop = list.scrollHeight
  }, [messages])

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q || isStreaming) return
    const answerId = newId()
    setQuestion('')
    pinned.current = true
    pending.current = ''
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
            pending.current += chunk
            if (!frame.current) frame.current = requestAnimationFrame(() => flush(answerId))
          } else if (event === 'error') {
            const { code, message } = JSON.parse(data) as { code?: string; message: string }
            throw new Error((code && ERROR_MESSAGES[code]) || message)
          } else if (event === 'sources') {
            updateMessage(answerId, () => ({ sources: JSON.parse(data) as ChatSource[] }))
          }
        },
      })
      flush(answerId)
      updateMessage(answerId, () => ({ status: 'done' }))
    } catch (error) {
      flush(answerId)
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
        description="Chỉ tìm trong CV bạn có quyền xem · mỗi ý trả lời kèm số trích dẫn tới đúng đoạn CV"
      />

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
        }}
        className="min-h-0 flex-1 overflow-y-auto py-6"
      >
        <p role="status" className="sr-only">
          {isStreaming ? 'Đang trả lời…' : messages.length > 0 ? 'Đã trả lời xong' : ''}
        </p>
        {messages.length === 0 ? (
          <section aria-labelledby="chat-suggestions">
            <h2 id="chat-suggestions" className="type-heading">
              Bạn đang tìm ai?
            </h2>
            <p className="type-body mt-1">Hỏi bằng câu thường ngày, hoặc bắt đầu từ một câu mẫu.</p>
            <ul className="border-line divide-line-soft mt-4 divide-y rounded-md border">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => void ask(s)}
                    className="group hover:bg-canvas text-ink flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors first:rounded-t-md last:rounded-b-md"
                  >
                    {s}
                    <ArrowRight className="text-ink-muted group-hover:text-brand size-4 shrink-0 transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="space-y-8">
            {messages.map((m) => (
              <ChatMessageView key={m.id} message={m} onCite={onCite} />
            ))}
          </div>
        )}
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
          enterKeyHint={touch ? 'enter' : 'send'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !touch && !e.nativeEvent.isComposing) {
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
      {!touch && <p className="type-caption mt-1.5">Enter để gửi · Shift + Enter xuống dòng</p>}

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
