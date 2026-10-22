import { useState, type FormEvent } from 'react'
import { EmptyState, ErrorState } from '@/components/shared'
import { Button, Skeleton, Textarea } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { useAddNote, useApplicationNotes } from '../hooks/use-applications'

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
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <Textarea
          aria-label="Ghi chú mới"
          maxLength={2000}
          placeholder="Ghi chú cho đồng nghiệp (ứng viên không thấy)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end">
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
        <EmptyState title="Chưa có ghi chú" />
      ) : (
        <ul className="space-y-3">
          {data.map((note) => (
            <li key={note.id} className="rounded-md bg-slate-50 p-3 text-sm">
              <p className="whitespace-pre-wrap">{note.content}</p>
              <p className="mt-1 text-xs text-slate-500">
                {note.author.fullName} · {formatDateTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
