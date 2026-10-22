import { useEffect, useRef, type RefObject } from 'react'

/**
 * Gọi `onVisible` khi phần tử `ref` lọt vào màn hình – dùng cho cuộn vô hạn.
 * Có cleanup (FE Architecture mục 6.2). Môi trường không có IntersectionObserver
 * (test, trình duyệt cũ) thì không làm gì: trang vẫn có nút "Tải thêm".
 */
export function useOnVisible(
  ref: RefObject<Element | null>,
  onVisible: () => void,
  enabled: boolean,
) {
  // Giữ callback mới nhất mà không phải tạo lại observer mỗi lần render
  const callback = useRef(onVisible)
  useEffect(() => {
    callback.current = onVisible
  })

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && callback.current(),
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, enabled])
}
