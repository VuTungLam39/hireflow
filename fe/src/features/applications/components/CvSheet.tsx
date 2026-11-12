import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { tokenizeCv, type EvidenceMarkInput } from '../lib/evidence'

interface CvSheetProps {
  text: string
  marks?: EvidenceMarkInput[]
  activeId?: string | null
  onMarkClick?: (id: string) => void
  header?: ReactNode
  footer?: ReactNode
  className?: string
}

export function CvSheet({
  text,
  marks = [],
  activeId,
  onMarkClick,
  header,
  footer,
  className,
}: CvSheetProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const paragraphs = useMemo(() => tokenizeCv(text, marks), [text, marks])

  useEffect(() => {
    if (!activeId) return
    const box = boxRef.current
    const mark = box?.querySelector<HTMLElement>(`[data-mark="${activeId}"]`)
    if (!box || !mark) return
    const top = mark.offsetTop - box.clientHeight / 3
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    box.scrollTo?.({ top, behavior: reduce ? 'auto' : 'smooth' })
  }, [activeId])

  return (
    <article
      aria-label="Nội dung CV"
      className={cn('border-line bg-surface relative rounded-md border', className)}
    >
      <div
        ref={boxRef}
        tabIndex={0}
        className="relative h-full overflow-y-auto px-6 py-8 sm:px-10 sm:py-10"
      >
        {header}
        <div className="type-read mx-auto">
          {paragraphs.map((para, i) => {
            const nums = [...new Set(para.filter((t) => t.mark).map((t) => t.mark!.n))]
            if (para.length === 0) return <div key={i} className="h-3" aria-hidden />
            return (
              <p key={i} className="relative">
                {nums.length > 0 && (
                  <span
                    aria-hidden
                    className="absolute top-0.5 -left-7 flex flex-col gap-1 sm:-left-8"
                  >
                    {nums.map((n) => (
                      <span
                        key={n}
                        className="border-ink-2 text-ink flex size-[18px] items-center justify-center rounded-full border font-sans text-xs leading-none font-semibold"
                      >
                        {n}
                      </span>
                    ))}
                  </span>
                )}
                {para.map((t, j) =>
                  t.mark ? (
                    <mark
                      key={`${j}-${t.mark.id === activeId ? 'on' : 'off'}`}
                      data-mark={t.mark.id}
                      tabIndex={onMarkClick ? 0 : undefined}
                      role={onMarkClick ? 'button' : undefined}
                      aria-label={onMarkClick ? `Bằng chứng cho tiêu chí ${t.mark.n}` : undefined}
                      aria-pressed={onMarkClick ? t.mark.id === activeId : undefined}
                      onClick={() => onMarkClick?.(t.mark!.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onMarkClick?.(t.mark!.id)
                        }
                      }}
                      className={cn(
                        'mark-evidence',
                        onMarkClick && 'cursor-pointer',
                        t.mark.id === activeId && 'mark-evidence-active animate-marker-focus',
                      )}
                    >
                      {t.text}
                    </mark>
                  ) : (
                    <span key={j}>{t.text}</span>
                  ),
                )}
              </p>
            )
          })}
        </div>
        {footer}
      </div>
    </article>
  )
}
