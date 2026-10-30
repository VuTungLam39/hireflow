import { MessageSquareText, SendHorizontal, Square } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/shared'
import { Button, Card, Textarea } from '@/components/ui'
import { useStream } from '@/hooks/use-stream'
import { ERROR_MESSAGES } from '@/lib/error-codes'
import { getErrorMessage } from '@/lib/errors'
import { staggerStyle } from '@/lib/utils'
import { ChatMessageView } from '../components/ChatMessageView'
import type { ChatMessage, ChatSource } from '../types'

const SUGGESTIONS = [
  'Ai có kinh nghiệm NestJS trên 2 năm?',
  'Ứng viên nào từng làm với Docker và PostgreSQL?',
  'Tìm ứng viên biết React và TypeScript',
]

let nextId = 0
const newId = () => `m${++nextId}`

/**
 * Chat tìm ứng viên trong kho CV (US-08). Câu trả lời stream từng phần, mỗi ý có trích dẫn.
 * BE chỉ tìm trong tập CV người hỏi được phép xem (scope phòng ban).
 */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const { start, stop, isStreaming } = useStream()
  const bottomRef = useRef<HTMLDivElement>(null)

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
    <div className="flex h-[calc(100vh-7.5rem)] flex-col gap-4 md:h-[calc(100vh-4rem)]">
      <PageHeader
        title="Trợ lý AI tìm ứng viên"
        description="Hỏi bằng ngôn ngữ tự nhiên. Mỗi ý trong câu trả lời kèm trích dẫn từ CV, chỉ trong phạm vi bạn được xem."
      />

      <Card className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-gradient-to-b from-white to-slate-50/80 p-0">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5" aria-live="polite">
          {messages.length === 0 ? (
            <div className="animate-fade-in flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="bg-primary-soft text-primary flex size-14 items-center justify-center rounded-2xl">
                <MessageSquareText className="size-6" />
              </span>
              <div>
                <p className="font-medium text-slate-800">Bạn muốn tìm ứng viên như thế nào?</p>
                <p className="mt-1 text-sm text-slate-500">Thử một trong các câu hỏi sau:</p>
              </div>
              <div className="flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void ask(s)}
                    style={staggerStyle(i + 2)}
                    className="animate-slide-up stagger hover:border-primary/40 hover:text-primary rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-600 shadow-sm transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <ChatMessageView key={m.id} message={m} />)
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={onSubmit}
          className="focus-within:border-primary/50 focus-within:ring-primary/10 mx-4 mb-4 flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-all focus-within:ring-4"
        >
          <Textarea
            aria-label="Câu hỏi"
            rows={2}
            className="min-h-0 resize-none border-0 shadow-none focus:ring-0"
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
            <Button variant="secondary" onClick={stop} aria-label="Dừng">
              <Square className="fill-current" />
              Dừng
            </Button>
          ) : (
            <Button type="submit" disabled={!question.trim()} aria-label="Gửi">
              <SendHorizontal />
            </Button>
          )}
        </form>
      </Card>
    </div>
  )
}
