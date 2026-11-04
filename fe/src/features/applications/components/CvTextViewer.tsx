import { useEffect, useRef } from 'react'

interface CvTextViewerProps {
  text: string
  /** Đoạn cần tô sáng và cuộn tới */
  highlight: string | null
}

/** Text CV đã parse, tô sáng đoạn bằng chứng đang chọn (FE Architecture mục 9.2) */
export function CvTextViewer({ text, highlight }: CvTextViewerProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<HTMLElement>(null)

  // Đồng bộ với DOM: chỉ cuộn trong khung CV tới đoạn được tô sáng, không kéo cả trang
  useEffect(() => {
    const box = boxRef.current
    const mark = markRef.current
    if (!box || !mark) return
    box.scrollTo({ top: mark.offsetTop - box.clientHeight / 2, behavior: 'smooth' })
  }, [highlight])

  const index = highlight ? text.indexOf(highlight) : -1

  return (
    <div
      ref={boxRef}
      className="border-line-soft bg-canvas/70 text-ink-2 relative max-h-[480px] overflow-y-auto rounded-md border p-5 text-sm leading-7 whitespace-pre-wrap"
    >
      {index < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, index)}
          {/* key theo đoạn: chọn đoạn khác thì hiệu ứng chạy lại */}
          <mark
            key={highlight}
            ref={markRef}
            className="animate-float-in bg-marker/80 text-ink ring-marker/80 rounded px-0.5 ring-2"
          >
            {highlight}
          </mark>
          {text.slice(index + highlight!.length)}
        </>
      )}
    </div>
  )
}
