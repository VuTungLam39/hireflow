import { ArrowUpRight, ChevronDown, KeyRound, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar, Popover, menuItemClass } from '@/components/ui'
import { ChangePasswordDialog, useLogout } from '@/features/auth'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { ROLE_LABELS } from '@/types/user'

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  if (!user) return null

  return (
    <>
      <Popover
        open={open}
        onOpenChange={setOpen}
        align="end"
        role="menu"
        label="Tài khoản"
        className="w-64"
        trigger={(props) => (
          <button
            type="button"
            {...props}
            aria-label={`Tài khoản: ${user.fullName}`}
            className={cn(
              'hover:bg-sunken flex items-center gap-2.5 rounded-sm py-1 pr-1.5 pl-1 transition-colors',
              open && 'bg-sunken',
            )}
          >
            <Avatar name={user.fullName} size="sm" />
            <span className="hidden min-w-0 text-left leading-tight lg:block">
              <span className="text-ink block max-w-40 truncate text-[13px] font-medium">
                {user.fullName}
              </span>
              <span className="text-ink-muted block text-xs">{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronDown className="text-ink-muted hidden size-4 lg:block" />
          </button>
        )}
      >
        <div className="border-line-soft mb-1 border-b px-2.5 pt-1.5 pb-2.5">
          <p className="text-ink truncate font-medium">{user.fullName}</p>
          <p className="type-caption truncate">{user.email}</p>
          <p className="type-caption truncate">
            {ROLE_LABELS[user.role]}
            {user.department && ` · ${user.department.name}`}
          </p>
        </div>
        <button
          type="button"
          role="menuitem"
          className={menuItemClass}
          onClick={() => {
            setOpen(false)
            setChangingPassword(true)
          }}
        >
          <KeyRound />
          Đổi mật khẩu
        </button>
        <Link
          role="menuitem"
          to={paths.publicJobs}
          target="_blank"
          className={menuItemClass}
          onClick={() => setOpen(false)}
        >
          <ArrowUpRight />
          Trang tuyển dụng
        </Link>
        <div className="border-line-soft my-1 border-t" />
        <button
          type="button"
          role="menuitem"
          disabled={logout.isPending}
          className={menuItemClass}
          onClick={() => logout.mutate()}
        >
          <LogOut />
          Đăng xuất
        </button>
      </Popover>
      <ChangePasswordDialog open={changingPassword} onClose={() => setChangingPassword(false)} />
    </>
  )
}
