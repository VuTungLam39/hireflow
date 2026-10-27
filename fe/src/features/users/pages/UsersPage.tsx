import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import {
  ConfirmDialog,
  DataTable,
  FilterBar,
  PageHeader,
  SearchInput,
  type Column,
} from '@/components/shared'
import { Avatar, Badge, Button, Card, Select } from '@/components/ui'
import { pageFields, useListParams } from '@/hooks/use-list-params'
import { formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Role, ROLE_LABELS, type User } from '@/types/user'
import { CreateUserDialog } from '../components/CreateUserDialog'
import { EditUserDialog } from '../components/EditUserDialog'
import { useDeleteUser, useSetUserStatus, useUsers } from '../hooks/use-users'

const listSchema = z.object({
  ...pageFields,
  search: z.string().optional().catch(undefined),
  role: z
    .enum([Role.Admin, Role.Hr, Role.HiringManager, Role.Interviewer])
    .optional()
    .catch(undefined),
})

const ROLE_TONE = {
  admin: 'info',
  hr: 'success',
  hiring_manager: 'warning',
  interviewer: 'neutral',
} as const

export default function UsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [params, setParams] = useListParams(listSchema)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)

  const query = useUsers(params)
  const setStatus = useSetUserStatus()
  const deleteUser = useDeleteUser()

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Họ tên',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.fullName} size="sm" className="hidden md:inline-flex" />
          <div className="min-w-0">
            <p className="font-medium">{u.fullName}</p>
            <p className="text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      cell: (u) => <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>,
    },
    { key: 'dept', header: 'Phòng ban', cell: (u) => u.department?.name ?? '—' },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (u) => (
        <Badge tone={u.isActive ? 'success' : 'danger'}>
          {u.isActive ? 'Hoạt động' : 'Đã khoá'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Đăng nhập gần nhất',
      cell: (u) => <span className="text-slate-500">{formatDateTime(u.lastLoginAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      isAction: true,
      className: 'text-right whitespace-nowrap',
      // BR-ACC-05: không cho tự khoá / tự xoá chính mình
      cell: (u) => (
        <>
          <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
            Sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={u.id === currentUserId}
            onClick={() => setStatus.mutate({ id: u.id, isActive: !u.isActive })}
          >
            {u.isActive ? 'Khoá' : 'Mở khoá'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            disabled={u.id === currentUserId}
            onClick={() => setDeleting(u)}
          >
            Xoá
          </Button>
        </>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Người dùng"
        description="Tài khoản nội bộ do Admin tạo, không có trang tự đăng ký."
        actions={
          <Button onClick={() => setCreating(true)}>
            <UserPlus />
            Thêm người dùng
          </Button>
        }
      />

      <Card className="space-y-4">
        <FilterBar
          onReset={
            params.search || params.role ? () => setParams({ search: null, role: null }) : undefined
          }
        >
          <SearchInput
            value={params.search}
            onChange={(search) => setParams({ search })}
            placeholder="Tìm theo email hoặc họ tên..."
          />
          <Select
            aria-label="Lọc theo vai trò"
            value={params.role ?? ''}
            onChange={(e) => setParams({ role: (e.target.value || null) as Role | null })}
          >
            <option value="">Tất cả vai trò</option>
            {Object.values(Role).map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
        </FilterBar>

        <DataTable
          columns={columns}
          data={query.data?.items}
          rowKey={(u) => u.id}
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
          isFetching={query.isFetching && !query.isPending}
          emptyTitle="Không có người dùng nào"
          meta={query.data?.meta}
          onPageChange={(page) => setParams({ page })}
        />
      </Card>

      <CreateUserDialog open={creating} onClose={() => setCreating(false)} />
      {editing && (
        <EditUserDialog
          key={editing.id}
          user={editing}
          isSelf={editing.id === currentUserId}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Xoá người dùng?"
        description={`Tài khoản ${deleting?.email} sẽ bị xoá và không đăng nhập được nữa.`}
        confirmLabel="Xoá"
        tone="danger"
        loading={deleteUser.isPending}
        onConfirm={() =>
          deleting && deleteUser.mutate(deleting.id, { onSettled: () => setDeleting(null) })
        }
      />
    </div>
  )
}
