import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Button, Popover, Skeleton } from '@/components/ui'
import { useOpenDetail } from '@/hooks/use-detail'
import { cn, formatDate, formatRelative } from '@/lib/utils'
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

const isToday = (iso: string) => formatDate(iso) === formatDate(new Date().toISOString())

function Sentence({ n }: { n: NotificationItem }) {
  const text = notificationText(n)
  const name = n.application?.candidateName
  if (!name || !text.includes(name)) return <>{text}</>
  const [before, after] = text.split(name)
  return (
    <>
      {before}
      <strong>{name}</strong>
      {after}
    </>
  )
}

// F-NOTI-01 · Design Spec 6.10
export function NotificationBell({ align = 'left' }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const unread = useRealtimeStore((s) => s.unreadCount)
  const connected = useRealtimeStore((s) => s.connected)
  const list = useNotifications(open)
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()
  const openDetail = useOpenDetail()

  const items = list.data?.pages.flatMap((p) => p.items) ?? []
  const groups = [
    { label: 'Hôm nay', items: items.filter((n) => isToday(n.createdAt)) },
    { label: 'Trước đó', items: items.filter((n) => !isToday(n.createdAt)) },
  ].filter((g) => g.items.length > 0)

  const openItem = (n: NotificationItem) => {
    if (!n.readAt) markRead.mutate(n.id)
    setOpen(false)
    if (n.application) openDetail('application', n.application.id)
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align={align === 'left' ? 'start' : 'end'}
      label="Thông báo"
      className="w-[min(380px,calc(100vw-2rem))] p-0"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
          className="text-ink-2 hover:bg-sunken hover:text-ink relative rounded-sm p-2 transition-colors"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="bg-bad num absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs leading-none font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      )}
    >
      <div className="border-line-soft flex items-center justify-between border-b py-2 pr-2 pl-4">
        <p className="type-subheading">Thông báo</p>
        <Button
          size="sm"
          variant="quiet"
          disabled={!unread}
          loading={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Đã đọc hết
        </Button>
      </div>
      {!connected && (
        <p role="status" className="bg-warn-soft text-warn px-4 py-1.5 text-[13px]">
          Đang kết nối lại…
        </p>
      )}

      <div className="max-h-[min(28rem,70dvh)] overflow-y-auto">
        {list.isPending ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : list.isError ? (
          <p className="text-bad p-4 text-[13px]">
            Chưa tải được thông báo. Mở lại để thử lần nữa.
          </p>
        ) : items.length === 0 ? (
          <p className="type-body p-4">
            Không có gì mới. Thông báo về hồ sơ và lịch phỏng vấn sẽ hiện ở đây.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <p className="type-overline px-4 pt-3 pb-1">{group.label}</p>
              <ul>
                {group.items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className="hover:bg-canvas flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block text-sm leading-5',
                            n.readAt ? 'text-ink-2' : 'text-ink',
                          )}
                        >
                          <Sentence n={n} />
                        </span>
                        <span className="type-caption block truncate">
                          {formatRelative(n.createdAt)}
                          {n.application?.jobTitle && ` · ${n.application.jobTitle}`}
                        </span>
                      </span>
                      {!n.readAt && (
                        <span
                          aria-label="Chưa đọc"
                          className="bg-brand mt-1.5 size-2 shrink-0 rounded-full"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
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
    </Popover>
  )
}
