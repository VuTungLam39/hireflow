import { Bell, CalendarClock, CheckCheck, CircleAlert, CircleCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Spinner } from '@/components/ui'
import { cn, formatRelative } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useRealtimeStore } from '@/stores/realtime.store'
import {
  notificationText,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from '../hooks/use-notifications'
import type { NotificationItem } from '../types'

interface NotificationBellProps {
  align?: 'left' | 'right'
}

// F-NOTI-01: trung tâm thông báo
export function NotificationBell({ align = 'left' }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const unread = useRealtimeStore((s) => s.unreadCount)
  const connected = useRealtimeStore((s) => s.connected)
  const ref = useRef<HTMLDivElement>(null)
  const list = useNotifications(open)
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items = list.data?.pages.flatMap((p) => p.items) ?? []

  const openItem = (n: NotificationItem) => {
    if (!n.readAt) markRead.mutate(n.id)
    setOpen(false)
    if (n.application) void navigate(links.applicationDetail(n.application.id))
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={connected ? 'Thông báo (đang cập nhật trực tiếp)' : 'Thông báo (đang kết nối lại…)'}
        onClick={() => setOpen((v) => !v)}
        className="text-ink-muted hover:bg-sunken hover:text-ink relative rounded-md p-2 transition-colors"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="bg-bad absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-xs font-semibold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Thông báo"
          className={cn(
            'border-line bg-surface shadow-float absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          <div className="border-line-soft flex items-center justify-between border-b px-4 py-3">
            <p className="text-ink text-sm font-semibold">Thông báo</p>
            <Button
              size="sm"
              variant="quiet"
              disabled={!unread}
              loading={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              {!markAll.isPending && <CheckCheck />}
              Đã đọc hết
            </Button>
          </div>

          <div className="max-h-[min(26rem,70vh)] overflow-y-auto">
            {list.isPending ? (
              <div className="flex justify-center p-6">
                <Spinner />
              </div>
            ) : list.isError ? (
              <p className="text-bad p-4 text-sm">Không tải được thông báo.</p>
            ) : items.length === 0 ? (
              <p className="text-ink-muted p-6 text-center text-sm">
                Chưa có thông báo. Khi CV của tin bạn phụ trách chấm xong, thông báo sẽ hiện ở đây.
              </p>
            ) : (
              <ul className="divide-line-soft divide-y">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={cn(
                        'hover:bg-canvas flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                        !n.readAt && 'bg-info-soft/50',
                      )}
                    >
                      {n.type === 'CV_FAILED' || n.type === 'INTERVIEW_CANCELLED' ? (
                        <CircleAlert className="text-bad mt-0.5 size-4 shrink-0" />
                      ) : n.type.startsWith('INTERVIEW') ? (
                        <CalendarClock className="text-info mt-0.5 size-4 shrink-0" />
                      ) : (
                        <CircleCheck className="text-good mt-0.5 size-4 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block text-sm">{notificationText(n)}</span>
                        <span className="text-ink-muted block truncate text-xs">
                          {n.application?.jobTitle} · {formatRelative(n.createdAt)}
                        </span>
                      </span>
                      {!n.readAt && (
                        <span
                          aria-label="Chưa đọc"
                          className="bg-info mt-1.5 size-2 shrink-0 rounded-full"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {list.hasNextPage && (
              <div className="border-line-soft border-t p-2">
                <Button
                  size="sm"
                  variant="quiet"
                  className="w-full"
                  loading={list.isFetchingNextPage}
                  onClick={() => void list.fetchNextPage()}
                >
                  Xem thêm
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
