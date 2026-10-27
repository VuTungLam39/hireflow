import { useEffect, useState } from 'react'

/** Thời điểm hiện tại, cập nhật định kỳ để nút "Gửi phiếu" tự mở khi tới giờ phỏng vấn */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
