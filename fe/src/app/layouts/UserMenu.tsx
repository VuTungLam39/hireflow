import { ChevronDown, ExternalLink, KeyRound, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Avatar } from '@/components/ui'
import { ChangePasswordDialog, useLogout } from '@/features/auth'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { ROLE_LABELS } from '@/types/user'

const itemClass =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none'

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Tài khoản: ${user.fullName}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-slate-100',
          open && 'bg-slate-100',
        )}
      >
        <Avatar name={user.fullName} size="sm" className="ring-2 ring-white" />
        <span className="hidden min-w-0 text-left leading-tight lg:block">
          <span className="block max-w-[10rem] truncate text-sm font-medium text-slate-800">
            {user.fullName}
          </span>
          <span className="block text-xs text-slate-500">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className="hidden size-4 text-slate-400 lg:block" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-scale-in absolute top-full right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          <div className="mb-1 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <Avatar name={user.fullName} size="md" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <p className="text-primary mt-0.5 truncate text-xs font-medium">
                {ROLE_LABELS[user.role]}
                {user.department && ` · ${user.department.name}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false)
              setChangingPassword(true)
            }}
          >
            <KeyRound className="size-4 text-slate-400" />
            Đổi mật khẩu
          </button>
          <Link
            role="menuitem"
            to={paths.publicJobs}
            target="_blank"
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="size-4 text-slate-400" />
            Trang tuyển dụng công khai
          </Link>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            role="menuitem"
            disabled={logout.isPending}
            className={cn(itemClass, 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50')}
            onClick={() => logout.mutate()}
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      )}

      <ChangePasswordDialog open={changingPassword} onClose={() => setChangingPassword(false)} />
    </div>
  )
}
