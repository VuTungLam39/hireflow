import { Badge, Card } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Xin chào, {user.fullName} 👋</h1>

      <Card>
        <h2 className="mb-4 font-semibold">Thông tin tài khoản</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-[160px_1fr]">
          <dt className="text-slate-500">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-slate-500">Vai trò</dt>
          <dd>
            <Badge tone="info">{user.role}</Badge>
          </dd>
          <dt className="text-slate-500">Đăng nhập gần nhất</dt>
          <dd>{formatDateTime(user.lastLoginAt)}</dd>
          <dt className="text-slate-500">Ngày tạo</dt>
          <dd>{formatDateTime(user.createdAt)}</dd>
        </dl>
      </Card>
    </div>
  )
}
