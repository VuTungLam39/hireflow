import { Outlet } from 'react-router'
import { Card } from '@/components/ui'

export function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <Outlet />
      </Card>
    </main>
  )
}
