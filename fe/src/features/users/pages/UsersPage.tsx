import { Lock, LockOpen, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import {
  ConfirmDialog,
  DataTable,
  FilterBar,
  FilterMenu,
  PageHeader,
  RowMenu,
  Summary,
  SearchInput,
  type Column,
} from '@/components/shared'
import { Avatar, Button } from '@/components/ui'
import { pageFields, useListParams } from '@/hooks/use-list-params'
import { cn, formatDateTime, formatDaysAgo } from '@/lib/utils'
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

// F-USER-01 → 05 · Design Spec 6.13
export default function UsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [params, setParams] = useListParams(listSchema)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [locking, setLocking] = useState<User | null>(null)

  const query = useUsers(params)
  const setStatus = useSetUserStatus()
  const deleteUser = useDeleteUser()
  const self = (u: User) => u.id === currentUserId

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Người dùng',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.fullName} size="sm" />
          <div className="min-w-0">
            <p className="text-ink truncate font-medium">
              {u.fullName}
              {self(u) && <span className="type-caption"> · bạn</span>}
            </p>
            <p className="type-caption truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      cell: (u) => <span className="text-ink-2">{ROLE_LABELS[u.role]}</span>,
    },
    {
      key: 'dept',
      header: 'Phòng ban',
      hideOnMobile: true,
      cell: (u) => <span className="text-ink-2">{u.department?.name ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (u) => <UserStatus user={u} />,
    },
    {
      key: 'lastLogin',
      header: 'Đăng nhập gần nhất',
      align: 'right',
      cell: (u) => (
        <span className="type-caption whitespace-nowrap">{formatDateTime(u.lastLoginAt)}</span>
      ),
    },
  ]

  const total = query.data?.meta.totalItems

  return (
    <div className="space-y-6">
      <PageHeader
        title="Người dùng"
        description={
          total !== undefined && (
            <Summary
              items={[
                `${total.toLocaleString('vi-VN')} tài khoản nội bộ`,
                'không có trang tự đăng ký',
              ]}
            />
          )
        }
        actions={
          <Button onClick={() => setCreating(true)}>
            <UserPlus />
            Thêm người dùng
          </Button>
        }
      />

      <FilterBar
        active={
          params.role
            ? [
                {
                  key: 'role',
                  label: `Vai trò: ${ROLE_LABELS[params.role]}`,
                  onRemove: () => setParams({ role: null }),
                },
              ]
            : []
        }
        onReset={params.role ? () => setParams({ role: null }) : undefined}
      >
        <SearchInput
          value={params.search}
          onChange={(search) => setParams({ search })}
          placeholder="Email hoặc họ tên"
          label="Tìm người dùng"
        />
        <FilterMenu
          label="Vai trò"
          value={params.role}
          options={Object.values(Role).map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          onChange={(role) => setParams({ role: role ?? null })}
        />
      </FilterBar>

      <DataTable
        caption="Danh sách người dùng"
        columns={columns}
        data={query.data?.items}
        rowKey={(u) => u.id}
        rowLabel={(u) => u.fullName}
        onRowClick={(u) => setEditing(u)}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isFetching={query.isFetching && !query.isPending}
        emptyTitle="Không có người dùng khớp tìm kiếm"
        emptyDescription="Thử tìm bằng email đầy đủ hoặc bỏ lọc vai trò."
        meta={query.data?.meta}
        onPageChange={(page) => setParams({ page })}
        mobileRow={(u) => <UserMobileRow user={u} isSelf={self(u)} />}
        rowActions={(u) => (
          <RowMenu
            label={`Thao tác với ${u.fullName}`}
            items={[
              { label: 'Sửa thông tin', icon: <Pencil />, onSelect: () => setEditing(u) },
              {
                label: u.isActive ? 'Khoá tài khoản' : 'Mở khoá tài khoản',
                icon: u.isActive ? <Lock /> : <LockOpen />,
                disabled: self(u),
                onSelect: () =>
                  u.isActive ? setLocking(u) : setStatus.mutate({ id: u.id, isActive: true }),
              },
              {
                label: 'Xoá người dùng',
                icon: <Trash2 />,
                danger: true,
                separated: true,
                disabled: self(u),
                onSelect: () => setDeleting(u),
              },
            ]}
            note={self(u) && 'Bạn không thể tự khoá hoặc xoá tài khoản của mình.'}
          />
        )}
      />

      <CreateUserDialog open={creating} onClose={() => setCreating(false)} />
      {editing && (
        <EditUserDialog
          key={editing.id}
          user={editing}
          isSelf={self(editing)}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={!!locking}
        onClose={() => setLocking(null)}
        title={`Khoá tài khoản ${locking?.fullName ?? ''}?`}
        description="Mọi phiên đăng nhập của người này bị thu hồi ngay. Bạn có thể mở khoá lại sau."
        confirmLabel="Khoá tài khoản"
        tone="danger"
        loading={setStatus.isPending}
        onConfirm={() =>
          locking &&
          setStatus.mutate(
            { id: locking.id, isActive: false },
            { onSettled: () => setLocking(null) },
          )
        }
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Xoá người dùng?"
        description={`Tài khoản ${deleting?.email} sẽ bị xoá và không đăng nhập được nữa.`}
        confirmLabel="Xoá người dùng"
        tone="danger"
        loading={deleteUser.isPending}
        onConfirm={() =>
          deleting && deleteUser.mutate(deleting.id, { onSettled: () => setDeleting(null) })
        }
      />
    </div>
  )
}

// App Screens 7.6
function UserStatus({ user }: { user: User }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap',
        user.isActive ? 'text-ink-2' : 'text-bad font-medium',
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', user.isActive ? 'bg-ink-faint' : 'bg-bad')}
      />
      {user.isActive ? 'Hoạt động' : 'Đã khoá'}
    </span>
  )
}

// App Screens 7.1
function UserMobileRow({ user: u, isSelf }: { user: User; isSelf: boolean }) {
  return (
    <div className="flex gap-3">
      <Avatar name={u.fullName} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-ink font-medium">
          {u.fullName}
          {isSelf && <span className="type-caption"> · bạn</span>}
        </p>
        <p className="type-caption break-all">{u.email}</p>
        <p className="text-ink-2 mt-1 text-[13px]">
          {ROLE_LABELS[u.role]}
          {u.department && <span className="text-ink-muted"> · {u.department.name}</span>}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5">
          <UserStatus user={u} />
          <span className="type-caption whitespace-nowrap">
            · {u.lastLoginAt ? `đăng nhập ${formatDaysAgo(u.lastLoginAt)}` : 'chưa đăng nhập'}
          </span>
        </p>
      </div>
    </div>
  )
}
