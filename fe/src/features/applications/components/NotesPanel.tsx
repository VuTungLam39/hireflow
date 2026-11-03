import { useState, type FormEvent } from 'react'
import { EmptyState, ErrorState } from '@/components/shared'
import { Avatar, Button, Skeleton, Textarea } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { useAddNote, useApplicationNotes } from '../hooks/use-applications'

// BR-APP-09
export function NotesPanel({ applicationId }: { applicationId: string }) {
  const { data, isPending, isError, error, refetch } = useApplicationNotes(applicationId)
  const addNote = useAddNote(applicationId)
  const [content, setContent] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    addNote.mutate(content.trim(), { onSuccess: () => setContent('') })
  }

  return (
    <div className="max-w-2xl space-y-5">
      <form onSubmit={submit} className="space-y-2">
        <Textarea
          aria-label="Ghi chú mới"
          maxLength={2000}
          placeholder="Ghi chú cho đồng nghiệp – ứng viên không thấy"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="type-caption">Ghi chú không sửa, không xoá được sau khi thêm.</span>
          <Button type="submit" size="sm" loading={addNote.isPending} disabled={!content.trim()}>
            Thêm ghi chú
          </Button>
        </div>
      </form>

      {isPending ? (
        <Skeleton className="h-16" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.length === 0 ? (
        <EmptyState
          compact
          title="Chưa có ghi chú"
          description="Ghi lại nhận xét sau khi đọc CV hoặc gọi điện để cả nhóm cùng nắm."
        />
      ) : (
        <ul className="divide-line-soft divide-y">
          {data.map((note) => (
            <li key={note.id} className="flex gap-3 py-3">
              <Avatar name={note.author.fullName} size="sm" />
              <div className="min-w-0">
                <p className="type-caption">
                  <span className="text-ink font-medium">{note.author.fullName}</span> ·{' '}
                  {formatDateTime(note.createdAt)}
                </p>
                <p className="type-body mt-0.5 whitespace-pre-wrap">{note.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
