import { Plus } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { ConfirmDialog, DataTable, PageHeader, SearchInput, type Column } from '@/components/shared'
import { Button, Tooltip } from '@/components/ui'
import { pageFields, useListParams } from '@/hooks/use-list-params'
import { DepartmentFormDialog } from '../components/DepartmentFormDialog'
import { useDeleteDepartment, useDepartments } from '../hooks/use-departments'
import type { Department } from '../types'

const listSchema = z.object({
  ...pageFields,
  search: z.string().optional().catch(undefined),
})

// F-DEPT-01 → 03 · BR-ACC-08 · Design Spec 6.13
export default function DepartmentsPage() {
  const [params, setParams] = useListParams(listSchema)
  const query = useDepartments(params)
  const remove = useDeleteDepartment()
  const [editing, setEditing] = useState<Department | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Department | null>(null)

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Phòng ban',
      cell: (d) => <span className="text-ink font-medium">{d.name}</span>,
    },
    {
      key: 'code',
      header: 'Mã',
      cell: (d) => <span className="type-code text-ink-2">{d.code}</span>,
    },
    {
      key: 'users',
      header: 'Số người',
      align: 'right',
      cell: (d) => <span className="type-num">{d.userCount}</span>,
    },
    {
      key: 'jobs',
      header: 'Số tin',
      align: 'right',
      cell: (d) => <span className="type-num">{d.jobCount}</span>,
    },
  ]

  const total = query.data?.meta.totalItems

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phòng ban"
        description={
          total !== undefined &&
          `${total} phòng ban · Hiring Manager chỉ thấy tin và hồ sơ của phòng mình`
        }
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus />
            Thêm phòng ban
          </Button>
        }
      />

      <SearchInput
        value={params.search}
        onChange={(search) => setParams({ search })}
        placeholder="Tên hoặc mã phòng ban"
        label="Tìm phòng ban"
      />

      <DataTable
        caption="Danh sách phòng ban"
        columns={columns}
        data={query.data?.items}
        rowKey={(d) => d.id}
        rowLabel={(d) => d.name}
        onRowOpen={(d) => setEditing(d)}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isFetching={query.isFetching && !query.isPending}
        emptyTitle={params.search ? 'Không có phòng ban khớp tìm kiếm' : 'Chưa có phòng ban'}
        emptyDescription="Tạo phòng ban trước khi thêm Hiring Manager hoặc tin tuyển dụng."
        meta={query.data?.meta}
        onPageChange={(page) => setParams({ page })}
        rowActions={(d) => {
          const inUse = d.userCount + d.jobCount > 0
          return (
            <>
              <Button variant="quiet" size="sm" onClick={() => setEditing(d)}>
                Sửa
              </Button>
              <Tooltip
                label="Còn người dùng hoặc tin tuyển dụng nên chưa xoá được"
                disabled={!inUse}
              >
                <Button
                  variant="danger-quiet"
                  size="sm"
                  aria-disabled={inUse || undefined}
                  onClick={() => !inUse && setDeleting(d)}
                >
                  Xoá
                </Button>
              </Tooltip>
            </>
          )
        }}
      />

      <DepartmentFormDialog
        open={editing !== undefined}
        department={editing}
        onClose={() => setEditing(undefined)}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Xoá phòng ban ${deleting?.name ?? ''}?`}
        description="Phòng ban không còn người dùng và tin tuyển dụng nên xoá được."
        confirmLabel="Xoá phòng ban"
        tone="danger"
        loading={remove.isPending}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })
        }
      />
    </div>
  )
}
