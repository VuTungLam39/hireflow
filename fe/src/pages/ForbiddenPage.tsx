import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { ROLE_LABELS } from '@/types/user'
import { SystemMessage } from './SystemMessage'

export default function ForbiddenPage({ roles }: { roles?: string }) {
  const user = useAuthStore((s) => s.user)
  return (
    <SystemMessage
      code="403"
      title={roles ? `Trang này dành cho ${roles}` : 'Trang này không thuộc quyền của bạn'}
      actions={
        <Link to={paths.home} className={buttonVariants()}>
          Về trang chủ
        </Link>
      }
    >
      {user
        ? `Tài khoản ${ROLE_LABELS[user.role]} của bạn chưa được cấp quyền mở trang này. Nếu bạn cần dùng, hãy liên hệ quản trị viên.`
        : 'Bạn cần đăng nhập bằng tài khoản có quyền phù hợp.'}
    </SystemMessage>
  )
}
