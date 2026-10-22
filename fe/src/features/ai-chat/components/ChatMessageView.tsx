import { Sparkles } from 'lucide-react'
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
          className="animate-blink size-1.5 rounded-full bg-slate-400"
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
      <div className="animate-slide-up flex justify-end">
        <p className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm">
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
    <div className="animate-slide-up flex max-w-[90%] gap-3">
      <span className="from-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br to-violet-500 text-white shadow-sm">
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0 space-y-3">
        <div
          className={cn(
            'rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-700 shadow-sm ring-1 ring-slate-200/80',
            message.status === 'error' && 'bg-red-50 text-red-700 ring-red-200',
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
                  className="bg-primary-soft text-primary hover:bg-primary mx-0.5 inline-flex size-[18px] items-center justify-center rounded-full align-super text-[10px] font-semibold transition-colors hover:text-white"
                >
                  {source.index}
                </Link>
              )
            })
          )}
          {message.status === 'streaming' && message.content && (
            <span className="animate-blink bg-primary ml-0.5 inline-block h-4 w-0.5 translate-y-0.5" />
          )}
        </div>

        {message.sources.length > 0 && message.status === 'done' && (
          <div className="animate-fade-in space-y-2">
            <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">Nguồn</p>
            <ol className="grid gap-2 sm:grid-cols-2">
              {message.sources.map((s, i) => (
                <li key={sourceKey(s.candidateId, s.chunkId)}>
                  <Link
                    to={links.applicationDetail(s.applicationId)}
                    className="hover:border-primary/40 block h-full rounded-xl border border-slate-200 bg-white p-3 text-xs transition-all hover:shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary-soft text-primary flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
                        {i + 1}
                      </span>
                      <span className="font-medium text-slate-800">{s.candidateName}</span>
                    </span>
                    <span className="mt-1.5 line-clamp-2 block text-slate-500">“{s.excerpt}”</span>
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
