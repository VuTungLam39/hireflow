import { memo } from 'react'
import { cn } from '@/lib/utils'
import { parseCitations } from '../lib/citations'
import type { ChatMessage, ChatSource } from '../types'

const sourceKey = (candidateId: string, chunkId: string) => `${candidateId}#${chunkId}`

interface ChatMessageViewProps {
  message: ChatMessage
  onCite: (source: ChatSource, index: number) => void
}

// US-08 · Design Spec 6.9
export const ChatMessageView = memo(function ChatMessageView({
  message,
  onCite,
}: ChatMessageViewProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="bg-sunken text-ink max-w-[85%] rounded-md px-4 py-2.5 whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    )
  }

  const numbering = new Map(
    message.sources.map((s, i) => [sourceKey(s.candidateId, s.chunkId), { index: i + 1, s }]),
  )

  return (
    <article className="space-y-3" aria-busy={message.status === 'streaming'}>
      <div
        className={cn(
          'type-read max-w-none whitespace-pre-wrap',
          message.status === 'error' && 'text-bad',
        )}
      >
        {message.status === 'streaming' && !message.content ? (
          <span className="text-ink-muted">
            {message.sources.length > 0
              ? `Đã tìm thấy ${message.sources.length} đoạn CV liên quan, đang soạn câu trả lời…`
              : 'Đang tìm trong kho CV…'}
          </span>
        ) : (
          parseCitations(message.content).map((seg, i) => {
            if (seg.type === 'text') return <span key={i}>{seg.text}</span>
            const source = numbering.get(sourceKey(seg.candidateId, seg.chunkId))
            if (!source) return null
            return (
              <button
                key={i}
                type="button"
                onClick={() => onCite(source.s, source.index)}
                aria-label={`Nguồn ${source.index}: ${source.s.candidateName}`}
                className="text-brand mx-px align-super text-xs font-semibold hover:underline"
              >
                [{source.index}]
              </button>
            )
          })
        )}
        {message.status === 'streaming' && message.content && (
          <span
            aria-hidden
            className="animate-caret bg-ink ml-0.5 inline-block h-4 w-[2px] translate-y-0.5"
          />
        )}
      </div>

      {message.sources.length > 0 && message.status === 'done' && (
        <div>
          <p className="type-overline mb-1.5">Nguồn</p>
          <ol className="divide-line-soft border-line-soft divide-y border-y">
            {message.sources.map((s, i) => (
              <li key={sourceKey(s.candidateId, s.chunkId)}>
                <button
                  type="button"
                  onClick={() => onCite(s, i + 1)}
                  className="hover:bg-canvas flex w-full items-baseline gap-3 px-1 py-2 text-left transition-colors"
                >
                  <span className="text-brand num text-xs font-semibold">[{i + 1}]</span>
                  <span className="min-w-0">
                    <span className="type-body-strong">{s.candidateName}</span>
                    <span className="type-caption line-clamp-1 block">“{s.excerpt}”</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  )
})
