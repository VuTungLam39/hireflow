import type { ComponentType } from 'react'
import {
  createBrowserRouter,
  type DOMRouterOpts,
  type LoaderFunctionArgs,
  type RouteObject,
} from 'react-router'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { MainLayout } from '@/app/layouts/MainLayout'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { PageLoader } from '@/components/ui'
import { applicationListSchema, applicationQueries } from '@/features/applications'
import { restoreSession } from '@/features/auth'
import { parseListParams } from '@/hooks/use-list-params'
import { Permission } from '@/lib/permissions'
import { queryClient } from '@/lib/query-client'
import ErrorPage from '@/pages/ErrorPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { GuestRoute, PermissionRoute, ProtectedRoute } from './guards'
import { paths } from './paths'

// Lazy load: mỗi trang được tách thành 1 file JS riêng, chỉ tải khi vào trang đó.
// Ngoại lệ luật tầng: router được import thẳng trang của feature (FE Architecture mục 3.1).
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
})

/** Bọc các route con bằng PermissionRoute */
const requires = (permission: Permission, children: object[]) => ({
  element: <PermissionRoute permission={permission} />,
  children,
})

/**
 * Tải trước dữ liệu bảng application song song với code của trang (FE Architecture mục 2.1).
 * Không await phần dữ liệu: không chặn điều hướng; component đọc cùng query key nên dùng chung cache.
 */
async function applicationsLoader({ request }: LoaderFunctionArgs) {
  await restoreSession() // đã chạy ở loader gốc thì trả về ngay
  const params = parseListParams(applicationListSchema, new URL(request.url).searchParams)
  void queryClient.ensureQueryData(applicationQueries.list(params))
  return null
}

async function sessionLoader() {
  await restoreSession()
  return null
}

export const ROOT_ROUTE_ID = 'root'

export const routes: RouteObject[] = [
  {
    id: ROOT_ROUTE_ID,
    // Khôi phục phiên từ cookie refresh token trước khi guard kiểm tra đăng nhập.
    // Trong lúc chờ, hydrateFallbackElement hiện PageLoader.
    loader: sessionLoader,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      // Trang công khai cho ứng viên: ai cũng vào được
      {
        element: <PublicLayout />,
        children: [
          {
            path: paths.publicJobs,
            lazy: page(() => import('@/features/public-jobs/pages/PublicJobsPage')),
          },
          {
            path: paths.publicJobDetail,
            lazy: page(() => import('@/features/public-jobs/pages/PublicJobDetailPage')),
          },
        ],
      },
      {
        element: <GuestRoute />,
        loader: sessionLoader,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: paths.login, lazy: page(() => import('@/features/auth/pages/LoginPage')) },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        loader: sessionLoader,
        children: [
          {
            element: <MainLayout />,
            children: [
              requires(Permission.DashboardRead, [
                {
                  path: paths.home,
                  lazy: page(() => import('@/features/dashboard/pages/DashboardPage')),
                },
              ]),
              requires(Permission.JobRead, [
                { path: paths.jobs, lazy: page(() => import('@/features/jobs/pages/JobsPage')) },
                {
                  path: paths.jobEdit,
                  lazy: page(() => import('@/features/jobs/pages/JobFormPage')),
                },
                {
                  path: paths.jobRanking,
                  lazy: page(() => import('@/features/ranking/pages/JobRankingPage')),
                },
              ]),
              requires(Permission.JobCreate, [
                {
                  path: paths.jobNew,
                  lazy: page(() => import('@/features/jobs/pages/JobFormPage')),
                },
              ]),
              requires(Permission.ApplicationRead, [
                {
                  path: paths.applications,
                  loader: applicationsLoader,
                  lazy: page(() => import('@/features/applications/pages/ApplicationsPage')),
                },
                {
                  path: paths.applicationDetail,
                  lazy: page(() => import('@/features/applications/pages/ApplicationDetailPage')),
                },
              ]),
              requires(Permission.CandidateRead, [
                {
                  path: paths.candidates,
                  lazy: page(() => import('@/features/candidates/pages/CandidatesPage')),
                },
                {
                  path: paths.candidateDetail,
                  lazy: page(() => import('@/features/candidates/pages/CandidateDetailPage')),
                },
              ]),
              requires(Permission.AiChat, [
                {
                  path: paths.aiChat,
                  lazy: page(() => import('@/features/ai-chat/pages/ChatPage')),
                },
              ]),
              requires(Permission.UserManage, [
                { path: paths.users, lazy: page(() => import('@/features/users/pages/UsersPage')) },
              ]),
              requires(Permission.OpsManage, [
                {
                  path: paths.aiQueue,
                  lazy: page(() => import('@/features/operations/pages/AiQueuePage')),
                },
              ]),
              requires(Permission.DepartmentManage, [
                {
                  path: paths.departments,
                  lazy: page(() => import('@/features/departments/pages/DepartmentsPage')),
                },
              ]),
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]

export const createAppRouter = (opts?: DOMRouterOpts) => createBrowserRouter(routes, opts)
