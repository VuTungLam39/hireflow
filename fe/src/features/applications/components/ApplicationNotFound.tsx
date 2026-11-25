import type { ReactNode } from 'react'

// ADR-0002: không tồn tại, ngoài phạm vi và không được giao dùng chung một thiết kế
export function ApplicationNotFound({ level = 1, action }: { level?: 1 | 2; action?: ReactNode }) {
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <div className="border-line bg-surface rounded-md border p-8">
      <Heading className="type-title">Không tìm thấy hồ sơ này</Heading>
      <p className="type-body mt-1">
        Hồ sơ không tồn tại, hoặc không thuộc phạm vi hay không được giao cho bạn.
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
