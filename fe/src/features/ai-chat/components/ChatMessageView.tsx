import { MessageSquareText } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { links } from '@/routes/paths'
import { parseCitations } from '../lib/citations'
import type { ChatMessage } from '../types'

/** Ba chấm nhấp nháy khi AI đang trả lời mà chưa có chữ nào */
function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Đang trả lời">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 0.2}s` }}
          className="animate-blink bg-ink-faint size-1.5 rounded-full"
        />
      ))}
    </span>
  )
}

/** Một tin nhắn. Trích dẫn [candidateId#chunkId] hiện thành số, bấm để mở hồ sơ. */
export const ChatMessageView = memo(function ChatMessageView({
  message,
}: {
  message: ChatMessage
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="bg-brand max-w-[85%] rounded-md rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap text-white">
          {message.content}
        </p>
      </div>
    )
  }

  const sourceKey = (candidateId: string, chunkId: string) => `${candidateId}#${chunkId}`
  const numbering = new Map(
    message.sources.map((s, i) => [sourceKey(s.candidateId, s.chunkId), { index: i + 1, s }]),
  )

  return (
    <div className="flex max-w-[90%] gap-3">
      <span className="bg-brand mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-white">
        <MessageSquareText className="size-4" />
      </span>
      <div className="min-w-0 space-y-3">
        <div
          className={cn(
            'bg-surface text-ink-2 ring-line/80 rounded-md rounded-tl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ring-1',
            message.status === 'error' && 'bg-bad-soft text-bad ring-bad',
          )}
        >
          {message.status === 'streaming' && !message.content ? (
            <TypingDots />
          ) : (
            parseCitations(message.content).map((seg, i) => {
              if (seg.type === 'text') return <span key={i}>{seg.text}</span>
              const source = numbering.get(sourceKey(seg.candidateId, seg.chunkId))
              if (!source) return null
              return (
                <Link
                  key={i}
                  to={links.applicationDetail(source.s.applicationId)}
                  title={source.s.excerpt}
                  className="bg-brand-soft text-brand hover:bg-brand mx-0.5 inline-flex size-[18px] items-center justify-center rounded-full align-super text-xs font-semibold transition-colors hover:text-white"
                >
                  {source.index}
                </Link>
              )
            })
          )}
          {message.status === 'streaming' && message.content && (
            <span className="animate-blink bg-brand ml-0.5 inline-block h-4 w-0.5 translate-y-0.5" />
          )}
        </div>

        {message.sources.length > 0 && message.status === 'done' && (
          <div className="space-y-2">
            <p className="text-ink-faint text-xs font-medium tracking-wide uppercase">Nguồn</p>
            <ol className="grid gap-2 sm:grid-cols-2">
              {message.sources.map((s, i) => (
                <li key={sourceKey(s.candidateId, s.chunkId)}>
                  <Link
                    to={links.applicationDetail(s.applicationId)}
                    className="hover:border-brand/40 border-line bg-surface block h-full rounded-md border p-3 text-xs transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-brand-soft text-brand flex size-5 items-center justify-center rounded-full text-xs font-semibold">
                        {i + 1}
                      </span>
                      <span className="text-ink font-medium">{s.candidateName}</span>
                    </span>
                    <span className="text-ink-muted mt-1.5 line-clamp-2 block">“{s.excerpt}”</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
})
