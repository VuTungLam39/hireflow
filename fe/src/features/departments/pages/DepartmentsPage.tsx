import { Building2, Plus } from 'lucide-react'
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
import { Button, Card } from '@/components/ui'
import { pageFields, useListParams } from '@/hooks/use-list-params'
import { formatDate } from '@/lib/utils'
import { DepartmentFormDialog } from '../components/DepartmentFormDialog'
import { useDeleteDepartment, useDepartments } from '../hooks/use-departments'
import type { Department } from '../types'

const listSchema = z.object({
  ...pageFields,
  search: z.string().optional().catch(undefined),
})

export default function DepartmentsPage() {
  const [params, setParams] = useListParams(listSchema)
  const query = useDepartments(params)
  const remove = useDeleteDepartment()
  // undefined = đóng, null = tạo mới, có giá trị = sửa
  const [editing, setEditing] = useState<Department | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Department | null>(null)

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Tên',
      cell: (d) => (
        <span className="flex items-center gap-3">
          <span className="bg-primary-soft text-primary hidden size-8 items-center justify-center rounded-lg md:flex">
            <Building2 className="size-4" />
          </span>
          <span className="font-medium">{d.name}</span>
        </span>
      ),
    },
    { key: 'code', header: 'Mã', cell: (d) => <code className="text-xs">{d.code}</code> },
    { key: 'users', header: 'Người dùng', cell: (d) => d.userCount },
    { key: 'jobs', header: 'Tin tuyển dụng', cell: (d) => d.jobCount },
    { key: 'createdAt', header: 'Ngày tạo', cell: (d) => formatDate(d.createdAt) },
    {
      key: 'actions',
      header: '',
      isAction: true,
      className: 'text-right whitespace-nowrap',
      cell: (d) => (
        <>
          <Button variant="ghost" size="sm" onClick={() => setEditing(d)}>
            Sửa
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleting(d)}>
            Xoá
          </Button>
        </>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phòng ban"
        description="Hiring Manager chỉ thấy tin tuyển dụng và hồ sơ thuộc phòng ban của mình."
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus />
            Thêm phòng ban
          </Button>
        }
      />

      <Card className="space-y-4">
        <FilterBar>
          <SearchInput
            value={params.search}
            onChange={(search) => setParams({ search })}
            placeholder="Tìm theo tên hoặc mã..."
          />
        </FilterBar>
        <DataTable
          columns={columns}
          data={query.data?.items}
          rowKey={(d) => d.id}
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
          isFetching={query.isFetching && !query.isPending}
          emptyTitle="Chưa có phòng ban"
          meta={query.data?.meta}
          onPageChange={(page) => setParams({ page })}
        />
      </Card>

      <DepartmentFormDialog
        open={editing !== undefined}
        department={editing}
        onClose={() => setEditing(undefined)}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Xoá phòng ban?"
        description={`Phòng ban "${deleting?.name}" sẽ bị xoá. Không xoá được nếu còn người dùng hoặc tin tuyển dụng.`}
        confirmLabel="Xoá"
        tone="danger"
        loading={remove.isPending}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })
        }
      />
    </div>
  )
}
