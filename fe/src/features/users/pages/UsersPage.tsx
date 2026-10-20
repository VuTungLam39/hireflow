import { useState } from 'react'
import { Badge, Button, Card, Input, Pagination, Select, Spinner } from '@/components/ui'
import { useDebounce } from '@/hooks/use-debounce'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Role, type User } from '@/types/user'
import { CreateUserDialog } from '../components/CreateUserDialog'
import { useDeleteUser, useUpdateUser, useUsers } from '../hooks/use-users'

const PAGE_SIZE = 10

export default function UsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [creating, setCreating] = useState(false)
  const debouncedSearch = useDebounce(search)

  const { data, isPending, isError, error, isFetching } = useUsers({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: role || undefined,
  })
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const toggleActive = (user: User) =>
    updateUser.mutate({ id: user.id, input: { isActive: !user.isActive } })

  const remove = (user: User) => {
    if (window.confirm(`Xoá người dùng ${user.email}?`)) deleteUser.mutate(user.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Người dùng</h1>
        <Button onClick={() => setCreating(true)}>+ Thêm người dùng</Button>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Tìm theo email hoặc họ tên..."
            className="max-w-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <Select
            aria-label="Lọc theo vai trò"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role | '')
              setPage(1)
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value={Role.Admin}>Admin</option>
            <option value={Role.User}>User</option>
          </Select>
          {isFetching && !isPending && <Spinner className="text-primary size-4" />}
        </div>

        {isPending ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-primary size-6" />
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-red-600">{getErrorMessage(error)}</p>
        ) : data.items.length === 0 ? (
          <p className="py-10 text-center text-slate-500">Không có người dùng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Họ tên</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Vai trò</th>
                  <th className="py-2 pr-4 font-medium">Trạng thái</th>
                  <th className="py-2 pr-4 font-medium">Đăng nhập gần nhất</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((user) => {
                  const isSelf = user.id === currentUserId
                  return (
                    <tr key={user.id}>
                      <td className="py-3 pr-4 font-medium">{user.fullName}</td>
                      <td className="py-3 pr-4">{user.email}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={user.role === Role.Admin ? 'info' : 'neutral'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={user.isActive ? 'success' : 'danger'}>
                          {user.isActive ? 'Hoạt động' : 'Đã khoá'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-slate-500">
                        {formatDateTime(user.lastLoginAt)}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        {/* Không cho tự khoá / tự xoá chính mình */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSelf}
                          onClick={() => toggleActive(user)}
                        >
                          {user.isActive ? 'Khoá' : 'Mở khoá'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          disabled={isSelf}
                          onClick={() => remove(user)}
                        >
                          Xoá
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </Card>

      <CreateUserDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
